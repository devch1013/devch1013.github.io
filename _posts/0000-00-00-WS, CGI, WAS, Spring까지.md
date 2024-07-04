---
layout: article
title: WS, CGI, WAS, Spring까지
tags: 
aside:
  toc: true
date: 2024-07-04
published: true
---

# WS(Web Server)
HTTP 요청을 받아 정적 컨텐츠를 제공하는 서버  
ex) Nginx, Apache 등  


클라이언트의 요청을 직접적으로 받는 역할  
요청에 따라 정적인 content들을 바로 반환하거나 동적인 컨텐츠 제공을 위해 WAS에 요청을 보내고 그 결과를 다시 클라이언트에 전달한다.  
# CGI(Common Gateway Interface)
웹 서버와 외부 프로그램 사이에서 정보를 주고받는 방법이나 규약, 표준  
이 표준에 맞춰진게 CGI 스크립트 -> 프로그래밍 언어에 제약이 없음  

![](/assets/images/postImages/0000-00-00-WS,%20CGI,%20WAS,%20Spring까지.png){width="80%" .center}

웹 서버에 폴더를 하나 따로 만들어서 필요한 스크립트 파일들을 저장했다가 필요하면 실행하는 방식  
CGI 프로그램이 매번 프로세스를 새로 만들어서 코드를 실행하기 때문에 부하가 심하다.  
코드 파일 하나하나가 application server의 역할을 수행한다.  

# WAS(Web Application Server)
전달 받은 클라이언트의 요청에 따라 비즈니스 로직, DB 조회 등의 일을 수행하여 동적인 컨텐츠를 제공하는 서버  
ex) Tomcat, JBoss, Jeus  
- HTTP를 통해 사용자의 컴퓨터에 애플리케이션을 수행해 주는 미들웨어 개념으로도 이해할 수 있다.
- 앱에서 사용하는 컴포넌트들을 올려놓고 쓰는 방식 -> 매번 프로세스를 만들지 않는다.
- WAS도 기본적으로 WS 역할을 수행할 수 있다. 즉 WS를 쓰지 않아도 배포가 가능하다.
- 클라이언트로부터 요청이 들어오면 요청을 해결할 수 있는 적절한 Servlet을 찾아 로직을 실행하고 그 결과를 WS로 다시 보내준다.
## Spring의 WAS
Spring boot의 내장 tomcat은 클라이언트의 요청이 들어오면 적절한 servlet을 찾아 연결시켜준다.
서블릿에서 코드가 작동되는 단계가 우리가 만든 spring boot 코드가 작동되는 순간이다.
정확히는 Tomcat WAS에서 요청을 받아 필터를 거친 후 Dispatcher Servlet으로 request를 넘겨주게 된다.  

## 코드
실제 Spring 서버가 어떻게 동작하는지 확인하기 위해 간단한 controller를 만들어 breakpoint를 걸고 확인해보았다.  
![](/assets/images/postImages/0000-00-00-WS,%20CGI,%20WAS,%20Spring까지-2.png){width="80%" .center}
![](/assets/images/postImages/0000-00-00-WS,%20CGI,%20WAS,%20Spring까지-3.png){width="80%" .center}

Get 요청을 했을 때 Spring boot에서 거치는 함수들의 목록이다.
가장 먼저 Thread를 만드는 것을 볼 수 있다. 이후 SocketProcessor를 통해 TCP 소켓 연결을 한다. 실제 NioEndpoint 클래스의 SocketProcessor에서 소켓의 Handshaking 과정을 받아오는 것을 볼 수 있었다.  
![](../assets/images/postImages/0000-00-00-WS,%20CGI,%20WAS,%20Spring까지-4.png){width="80%" .center}
 그 다음 Http11Processor에서 요청을 파싱하여 request와 response를 생성하게 된다. 이 object들은 요청이 끝나고 응답이 갈 때 까지 사용되게 된다.

이후 지정되어있는 여러 Filter들을 지난다. 그 후에 request와 response가 HttpServletResponse, HttpServletRequest로 바뀌고 요청이 get인지 post인지 put인지 등으로 구분 후 dispatcherServlet으로 넘어가게 된다.

여기부터 Spring MVC convtainer로 들어가게 된다. 그 후로는 내가 만들어놓은 controller로 요청이 들어와 로직을 실행하고 그에 맞는 응답은 response에 넣어 보내게 된다.

Tomcat은 여기서 servletContainer까지의 역할을 맡게 된다. 즉 dispatcherServlet으로 넘기기 직전까지의 역할을 WAS가 수행한다고 보면 된다.

지금까지 코드를 본 것을 바탕으로 정리하면 Tomcat은 아래와 같은 작업을 진행한다.
- 쓰레드 생성, 쓰레드 풀 관리
- 통신을 위한 소켓 생성
- ServletContainer의 생성, 작업, 소멸까지의 관리

더 자세한 Spring 내부 코드는 다음에 더 뜯어봐야겠다.