---
layout: article
title: Spring-Discord 웹 훅 연결
tags:
  - Spring
aside:
  toc: true
date: 2024-06-04
published: true
---

원하는 채널의 설정에 들어가 웹후크를 생성한다.
![](/assets/images/postImages/Pasted%20image%2020240516182722.png){: width="80%" .center}


![](/assets/images/postImages/Pasted%20image%2020240516182757.png){: width="80%" .center}


웹후크 URL을 복사해둔다.

HTTP로 직접 통신을 진행한다.
`application.yaml`에 다음과 같이 웹 훅 주소를 추가한다.
```yml
discord:  
  error-webhook: https://discord.com/api/webhooks/~~~~~~
```

Discord 메세지를 보낼 수 있는 component를 제작한다. 코드에서 DiscordExceptionMessage라는 레코드는 json 형태로 보내고 싶은 값을 담은 Dto이다. 
```java
@Component
@RequiredArgsConstructor  
@Slf4j  
public class DiscordMsgComponent {  
    @Value("${discord.error-webhook}")  
    String errorWebhookUrl;  
  
    public void sendErrorMessage(Exception e, ErrorCode errorCode) {  
	    try {  
	        HttpHeaders httpHeaders = new HttpHeaders();  
	        httpHeaders.add("Content-Type", "application/json; utf-8");  
	        HttpEntity<DiscordMessageWrapper> messageEntity = new HttpEntity<>(new DiscordMessageWrapper(new DiscordExceptionMessage(  
	                errorCode.getStatus(),  
	                errorCode.getMessage(),  
	                e.getMessage()  
	        ).toString()), httpHeaders);  
	        RestTemplate template = new RestTemplate();  
	        template.exchange(  
	                errorWebhookUrl,  
	                HttpMethod.POST,  
	                messageEntity,  
	                String.class  
	        );  
	    } catch (Exception ex) {  
	        log.error("Webhook error: "+ ex.getMessage());  
	    }  
	}
}
```
메세지 요청을 보낼 때 "content"라는 json 필드에 담아 전달해야한다. 따라서 content 필드를 가진 Wrapper 클래스를 만들어 보내고자 하는 메세지를 담아준다.

만든 컴포넌트를 500 에러가 발생할 때 사용하여 메세지가 발송되도록 하였다.
```java

@RestControllerAdvice  
@RequiredArgsConstructor  
@Slf4j  
public class PresetExceptionControllerException {
	private final DiscordMsgComponent discordMsgComponent;
	
	@ExceptionHandler(Exception.class)  
	protected ResponseEntity<ErrorResponse> Exception(Exception e) {  
	    ErrorCode errorCode = ErrorCode.INTERNAL_SERVER_ERROR;  
	    log.error("Error message : {}", errorCode.getMessage());  
	    log.error("{}", e.getMessage());  
	    log.error("{}", (Object) e.getStackTrace());  
	    discordMsgComponent.sendErrorMessage(e, errorCode);  
	    return new ResponseEntity<>(new ErrorResponse(errorCode), HttpStatus.resolve(errorCode.getStatus()));  
	}
}
```

![](/assets/images/postImages/Pasted%20image%2020240604183211.png){: width="80%" .center}


메세지가 잘 오는 것을 볼 수 있다.