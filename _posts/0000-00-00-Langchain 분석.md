---
layout: article
title: Langchain agent 코드 분석
tags:
  - LLM
  - AI
aside:
  toc: true
date: 2024-09-08
published: true
---
# Langchain으로 tool agent를 만들어보자

아래의 코드는 tool agent를 사용하는 코드이다.
```python
from langchain.agents import initialize_agent, Tool
from langchain.chat_models import ChatOpenAI
from langchain.chains import LLMChain
from langchain.prompts import PromptTemplate

# 1. 도구 함수 정의
def search_tool(query):
    return f"검색 결과: {query}에 대한 정보입니다."

def calculator_tool(expression):
    return f"계산 결과: {eval(expression)}"

def weather_tool(location):
    return f"{location}의 날씨: 맑음, 기온 20도"

# 2. Tool 객체로 래핑
tools = [
    Tool(
        name="Search",
        func=search_tool,
        description="인터넷에서 정보를 검색할 때 유용합니다."
    ),
    Tool(
        name="Calculator",
        func=calculator_tool,
        description="수학 계산을 수행할 때 사용합니다."
    ),
    Tool(
        name="Weather",
        func=weather_tool,
        description="특정 지역의 날씨 정보를 얻을 때 사용합니다."
    )
]

# 3. ChatGPT 모델을 사용하는 Agent 초기화
chat_model = ChatOpenAI(
    model_name="gpt-3.5-turbo",  # 또는 "gpt-4"를 사용할 수 있습니다.
    temperature=0,
    openai_api_key="your_openai_api_key_here"
)
agent = initialize_agent(tools, chat_model, agent="chat-zero-shot-react-description", verbose=True)

# 4. Agent 실행
result = agent.run("서울의 날씨가 어떤지 알려주세요.")
print(result)
```

이 코드에서 실제 agent가 어떻게 작동하고 어떤 프롬프트를 사용하는지 알아보고 싶어졌다.

# 어떤 프롬프트를 사용할까?
`initialize_agent`함수를 보면 agent라는 변수를 받는다. 
```python
def initialize_agent(
    tools: Sequence[BaseTool],
    llm: BaseLanguageModel,
    agent: Optional[AgentType] = None,
    callback_manager: Optional[BaseCallbackManager] = None,
    agent_path: Optional[str] = None,
    agent_kwargs: Optional[dict] = None,
    *,
    tags: Optional[Sequence[str]] = None,
    **kwargs: Any,
) -> AgentExecutor:
```
agent 변수는 `AgentType`이라는 Enum class이다.   
`langchain/agent/agent_types.py`를 보면 여러 상황에서 쓸 수 있는 agent type들이 명시되어있다. 내가 사용한 ZERO_SHOT_REACT_DESCRIPTION은 `A zero shot agent that does a reasoning step before acting.`라고 설명이 되어있다. tool을 실행하기 전에 reasoning step을 거친다는 뜻이다. 이 agent type이 실제 프롬프팅 단계에서는 어떻게 쓰이는지 알아보기 위해 더 들어가 보았다.  

각 agent enum들은 정의된 class로 연결되어 작동한다. `chat-zero-shot-react-description` 타입은 `langchain.agents.mrkl.base`의 ZeroShotAgent로 이어진다. Langchain의 Agent class를 상속받은 class로 내부의 `create_prompt`와 `from_llm_and_tools` 함수가 중요한 역할을 수행한다.  
직접적인 prompt 정보가 있는 `create_prompt`를 먼저 살펴보자  
```python
@classmethod
def create_prompt(
	cls,
	tools: Sequence[BaseTool],
	prefix: str = PREFIX,
	suffix: str = SUFFIX,
	format_instructions: str = FORMAT_INSTRUCTIONS,
	input_variables: Optional[List[str]] = None,
) -> PromptTemplate:
	tool_strings = render_text_description(list(tools))
	tool_names = ", ".join([tool.name for tool in tools])
	format_instructions = format_instructions.format(tool_names=tool_names)
	template = "\n\n".join([prefix, tool_strings, format_instructions, suffix])
	if input_variables:
		return PromptTemplate(template=template, input_variables=input_variables)
	return PromptTemplate.from_template(template)
```

입력 변수로는 사용자가 넣어준 tools와 `prefix`, `suffix`, `format_instruxtion`, `input_variables`가 있다.   
기본 정의된 프롬프트들을 보면 아래와 같다.
```python
PREFIX = """Answer the following questions as best you can. You have access to the following tools:"""

FORMAT_INSTRUCTIONS = """Use the following format:

Question: the input question you must answer
Thought: you should always think about what to do
Action: the action to take, should be one of [{tool_names}]
Action Input: the input to the action
Observation: the result of the action
... (this Thought/Action/Action Input/Observation can repeat N times)
Thought: I now know the final answer
Final Answer: the final answer to the original input question"""

SUFFIX = """Begin!

Question: {input}
Thought:{agent_scratchpad}"""

```
프롬프트 제작 흐름을 살펴보면: 
1. 사용자가 정의한 tool들에 대한 설명을 줄글로 정리한다.
2. FORMAT_INSTRUCTION에 tool의 이름들을 넣는다.
3. prefix - tool 설명 - (tool 이름이 들어간) format_instructions - suffix 순서로 프롬프트를 합친다.
이렇게 만들어진 프롬프트는 PromptTemplate에 들어가 실제 요청에 사용된다.  

Suffix의 agent_scratchpad는 추론 과정 중 LLM이 생각하는 과정 텍스트가 들어가는 부분이다. Lnagchain에서 기본적으로 tool을 사용하는 agent의 경우 원하는 목표를 달성하여 tool을 사용할 필요가 없을 때까지 계속 반복된다.   

Chain의 중간 과정에 input으로 들어가는 agent_scratchpad 값을 출력해보았다. 

```python
iter 1
{'input': '서울의 날씨가 어떤지 알려주세요.', 'agent_scratchpad': '', 'stop': ['\nObservation:', '\n\tObservation:']}
 어느 지역의 날씨 정보를 알고 싶은지 생각해야 합니다.
Action: Weather
Action Input: Seoul
Observation: Seoul의 날씨: 맑음, 기온 20도
Thought:

iter 2
{'input': '서울의 날씨가 어떤지 알려주세요.', 'agent_scratchpad': ' 어느 지역의 날씨 정보를 알고 싶은지 생각해야 합니다.\nAction: Weather\nAction Input: Seoul\nObservation: Seoul의 날씨: 맑음, 기온 20도\nThought:', 'stop': ['\nObservation:', '\n\tObservation:']}
 제가 찾는 정보가 맞는지 확인해야 합니다.
Action: Search
Action Input: 서울 날씨 정보
Observation: 검색 결과: 서울 날씨 정보에 대한 정보입니다.
Thought:

iter 3
{'input': '서울의 날씨가 어떤지 알려주세요.', 'agent_scratchpad': ' 어느 지역의 날씨 정보를 알고 싶은지 생각해야 합니다.\nAction: Weather\nAction Input: Seoul\nObservation: Seoul의 날씨: 맑음, 기온 20도\nThought: 제가 찾는 정보가 맞는지 확인해야 합니다.\nAction: Search\nAction Input: 서울 날씨 정보\nObservation: 검색 결과: 서울 날씨 정보에 대한 정보입니다.\nThought:', 'stop': ['\nObservation:', '\n\tObservation:']}
 서울의 기온은 20도인데, 화씨로 바꾸면 몇도일까요?
Action: Calculator
Action Input: 20 * 9/5 + 32
Observation: 계산 결과: 68.0
Thought:

iter 4
{'input': '서울의 날씨가 어떤지 알려주세요.', 'agent_scratchpad': ' 어느 지역의 날씨 정보를 알고 싶은지 생각해야 합니다.\nAction: Weather\nAction Input: Seoul\nObservation: Seoul의 날씨: 맑음, 기온 20도\nThought: 제가 찾는 정보가 맞는지 확인해야 합니다.\nAction: Search\nAction Input: 서울 날씨 정보\nObservation: 검색 결과: 서울 날씨 정보에 대한 정보입니다.\nThought: 서울의 기온은 20도인데, 화씨로 바꾸면 몇도일까요?\nAction: Calculator\nAction Input: 20 * 9/5 + 32\nObservation: 계산 결과: 68.0\nThought:', 'stop': ['\nObservation:', '\n\tObservation:']}
 서울의 기온은 화씨로 68도입니다.
Final Answer: 서울의 날씨는 맑고, 기온은 68도입니다.
```
총 4번의 API 요청이 있었고 횟수가 반복될수록 LLM이 생각하는 과정이 쌓이며 다음 결정을 내리는 것을 확인할 수 있었다.