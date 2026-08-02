---
title: "동기 FastAPI 핸들러에서 asyncio.create_task 가 조용히 죽는 이유"
tags: [python, asyncio, fastapi]
date: 2026-08-02
published: true
---

`def` 핸들러는 이벤트 루프가 아니라 스레드풀에서 돈다 — 그 안의 `asyncio.create_task()` 는 잡을 루프가 없어 코루틴째로 유실된다.
<!--more-->

## 환경

- Python 3.12
- FastAPI 0.115 / Starlette 0.45

## 문제 상황

응답을 반환한 뒤 알림 하나를 fire-and-forget 으로 쏘는 엔드포인트였다. 핸들러는
동기(`def`)로 선언돼 있었고, 본문 끝에서 코루틴을 하나 띄웠다.

```python
@router.post("/orders/{order_id}/approve")
def approve_order(order_id: int):
    result = approve(order_id)
    asyncio.create_task(notify(result))   # fire-and-forget
    return result
```

두 가지가 동시에 터졌다.

- 엔드포인트가 **500** 을 반환한다.
- 로그에 `RuntimeError: no running event loop` 가 찍히고, 곧이어
  `coroutine 'notify' was never awaited` 경고가 뜬다. 알림은 **한 번도 실행되지 않는다.**

`notify` 자체는 멀쩡하다. `create_task` 를 부르는 그 줄에서 죽는다.

## 원인

FastAPI(Starlette)는 핸들러를 선언 방식에 따라 다른 곳에서 실행한다.

- `async def` 핸들러 → 이벤트 루프 위에서 직접 실행.
- `def` 핸들러 → **스레드풀(anyio worker thread)** 에서 실행. 동기 블로킹 코드가
  이벤트 루프를 멈추지 않게 하려는 설계다.

`asyncio.create_task()` 는 "지금 이 스레드에서 **돌고 있는** 이벤트 루프"에 태스크를
붙인다. 내부적으로 `get_running_loop()` 를 부르는데, 스레드풀 워커 스레드에는 도는
루프가 없다. 그래서 `RuntimeError: no running event loop` 로 죽는다.

핸들러를 `def` 로 내린 것 자체는 의도된 선택이었다 — 동기 DB 드라이버로 블로킹
쿼리를 하는 핸들러가 커넥션 풀 고갈 시 이벤트 루프를 통째로 얼리는 문제 때문에,
이런 핸들러들을 `async def` → `def` 로 전환하던 중이었다. 전환 과정에서 본문에 남아
있던 `create_task` 가 그대로 사각지대가 됐다. `async def` 였을 땐 멀쩡히 돌던 코드가,
`def` 로 바뀌는 순간 조용히 깨진다.

## 해결

응답 반환 후 실행할 후처리는 `asyncio` 가 아니라 **Starlette 의 `BackgroundTasks`**
에 태운다. 등록된 작업은 응답이 나간 뒤 실행되고, 동기 함수는 스레드풀에서 돈다.

문제는 여기 태울 게 코루틴이라는 점이다. `BackgroundTasks` 는 sync/async 를 알아서
처리해주지만, 우리 쪽 후처리 함수엔 동기와 코루틴이 섞여 있었다. 그래서 **항상 동기
러너로 감싸고, 코루틴이면 그 스레드에서 전용 루프로 완주**시키는 헬퍼를 하나 뒀다.

```python
import asyncio, inspect
from fastapi import BackgroundTasks

def fire_and_forget(background_tasks, func, *args, **kwargs):
    background_tasks.add_task(_run, func, *args, **kwargs)

def _run(func, *args, **kwargs):
    result = func(*args, **kwargs)
    if inspect.iscoroutine(result):
        asyncio.run(result)   # 이 스레드 전용 루프에서 완주
```

```python
@router.post("/orders/{order_id}/approve")
def approve_order(order_id: int, background_tasks: BackgroundTasks):
    result = approve(order_id)
    fire_and_forget(background_tasks, notify, result)   # sync/async 무관
    return result
```

**버린 대안 — 핸들러 안에서 직접 `asyncio.run(notify(result))`.** 스레드풀 스레드라
새 루프를 열어 돌릴 수는 있다. 하지만 그러면 알림이 끝날 때까지 응답이 블로킹된다.
fire-and-forget 의 의미가 사라진다.

**한 가지 주의 — 응답을 커스텀 `Response` 객체로 반환하는 경우.** 데코레이터 등이
핸들러 반환값을 `JSONResponse` 로 감싸 돌려줘도 이 방식은 동작한다. FastAPI 가 라우팅
단계에서 `response.background` 에 수집된 `BackgroundTasks` 를 채워주기 때문이다.
직접 `Response(...)` 를 만들어 반환하면서 `background=` 를 지정하지 않으면 그때는
등록한 작업이 실행되지 않으니, 그 경우엔 명시적으로 넘겨야 한다.

재발을 막으려고 AST 로 "동기 핸들러 본문의 `asyncio.create_task` / `ensure_future`
호출"을 잡는 린트 테스트를 하나 붙였다. `async def` 핸들러(루프 위)와, 같은 이름의
관계없는 메서드(예: 진행률 트래커의 `create_task()`)는 오탐이라 `asyncio.` 로 시작하는
호출만 걸러낸다.

## 관련 이론

**`asyncio.create_task` 는 실행 중인 루프를 전제한다.** 이름과 달리 루프를 만들지
않는다. `get_running_loop()` 로 현재 스레드의 도는 루프를 찾아 거기에 태스크를 붙이고,
루프가 없으면 예외를 던진다. 루프는 스레드에 종속적이다 — 한 스레드의 루프를 다른
스레드에서 볼 수 없다.

**동기 라우트를 스레드풀에 오프로드하는 건 ASGI 서버의 표준 동작이다.** 이벤트 루프는
단일 스레드에서 돌기 때문에, 블로킹 호출(동기 DB, 파일 IO, `time.sleep`)이 그 스레드
위에서 실행되면 그동안 다른 요청을 하나도 처리하지 못한다. 그래서 Starlette 는 `def`
핸들러를 워커 스레드로 넘겨 루프 스레드를 자유롭게 둔다. 대신 그 스레드엔 루프가 없다.

**응답 후 후처리의 자리는 `BackgroundTasks` 다.** 응답 전송이 끝난 뒤 실행되므로
클라이언트 지연에 영향을 주지 않는다. 다만 "정말 응답과 무관하게 떼어내야 하는" 작업
(장시간·재시도·크래시 내성 필요)이면 이것도 부족하다 — 프로세스가 죽으면 같이 죽기
때문이다. 그 경우는 외부 큐/워커로 넘겨야 한다. `BackgroundTasks` 는 "응답 직후,
같은 프로세스에서, 짧게" 하는 후처리의 자리다.

## 참고

- [Starlette — Background Tasks](https://www.starlette.io/background/)
- [asyncio — `create_task` / `get_running_loop`](https://docs.python.org/3/library/asyncio-task.html)
