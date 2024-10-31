---
layout: article
title: AVINchat
cover: /assets/images/cover/AVINchat.png
date: 2024-02-19
---
![](/assets/images/cover/AVINchat.png){: width="70%" .center}
<br>
## AVIN-Chat:  An Audio-Visual Interactive Chatbot System with Emotional State Tuning  [<img src="/assets/images/github-40.svg">](https://github.com/devch1013/3D-Audio-Face)

**담당 파트**  
* Unity 클라이언트 개발
	* 웹캠 카메라 캡처, 음성 녹음, 3D object 다운로드\배치, 음성 재생
* FastAPI 백엔드 개발(AI 모델 연동)
* HRN - LDT - Blender | Whisper - ChatGPT - Emotivoice 파이프라인의 각 레이어 모듈 개발
	* HRN 모델을 사용하여 이미지 입력 - 3D face 생성
	* LDT를 사용해 base face로 52개의 표정 face object 생성(병렬처리로 처리 속도 개선)
	* Blender python API를 사용하여 하나의 BlendShape object로 변환
	* Whisper모델로 사용자의 음성을 텍스트로 변환
	- ChatGPT API를 사용해 사용자의 발화에 맞는 응답 생성
	- Emotivoice 모델을 사용해 감정이 들어간 응답 음성 생성
* 감정을 담은 대화를 생성할 수 있도록 ChatGPT 프롬프팅
* 코드 담당, 기술 파트 논문 작성


Face to face conversation with the 3D facial avatar made from single person's photo by user input.
* Generate Facial Avatar in 3D with single photo
* Convert user's voice to text using Whisper from OpenAI
* Conversation using ChatGPT
* Convert ChatGPT's answer to voice using EmotiVoice

![](/assets/images/Pasted%20image%2020240305140900.png){: width="80%" .center}


**IJCAI Demo Track(Accepted)**   
![](/assets/images/postImages/IJCAI_image.jpg){: width="80%" .center}
[IJCAI paper Link](https://www.ijcai.org/proceedings/2024/1027) [Arxiv](https://arxiv.org/abs/2409.00012)


