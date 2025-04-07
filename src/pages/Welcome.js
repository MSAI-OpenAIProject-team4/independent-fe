import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import * as speechsdk from "microsoft-cognitiveservices-speech-sdk";
import "../styles/Welcome.css";
import MenuComponent from '../components/MenuComponent';

function Welcome({ language, onLanguageChange }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [key, setKey] = useState(0);
  const [hasInteracted, setHasInteracted] = useState(false);
  const navigate = useNavigate();

  // dialogues를 useMemo로 감싸서 불필요한 재생성 방지
  const dialogues = useMemo(
    () => [
      {
        text: ["안녕하세요.", "100년 역사 여행을 도와줄 000입니다."],
      },
      {
        text: [
          "1945년 광복 이후 80년의 시간이 지났습니다.",
          "여러분은 광복을 위해 생명을 불태운 이들을",
          "얼마나 알고 기억하고 계신가요?",
        ],
      },
      {
        text: [
          "오늘 당신과 닮은 독립운동가를 만나",
          "이야기를 나눠보고 그들의 희생을 기억하는",
          "시간이 되었으면 좋겠습니다.",
        ],
      },
    ],
    []
  );

  // Azure TTS 설정을 useMemo로 감싸서 재생성 방지
  const speechConfig = useMemo(() => {
    try {
      const config = speechsdk.SpeechConfig.fromSubscription(
        process.env.REACT_APP_AZURE_SPEECH_KEY_WELCOME,
        process.env.REACT_APP_AZURE_SPEECH_REGION_WELCOME
      );
      config.speechSynthesisVoiceName = "ko-KR-JiMinNeural";
      return config;
    } catch (error) {
      console.error("Speech config 초기화 오류:", error);
      return null;
    }
  }, []);

  // 현재 대화문을 읽는 함수
  const speakText = useCallback(
    async (text) => {
      if (!speechConfig) return;

      const synthesizer = new speechsdk.SpeechSynthesizer(speechConfig);

      try {
        const result = await new Promise((resolve, reject) => {
          synthesizer.speakTextAsync(
            text,
            (result) => {
              synthesizer.close();
              resolve(result);
            },
            (error) => {
              synthesizer.close();
              reject(error);
            }
          );
        });

        if (result.errorDetails) {
          console.error("TTS 오류:", result.errorDetails);
        }
      } catch (error) {
        console.error("TTS 실행 중 오류 발생:", error);
      }
    },
    [speechConfig]
  );

  // 대화 단계가 변경될 때마다 해당 대화문을 읽기
  useEffect(() => {
    if (!hasInteracted) return;

    const currentDialogue = dialogues[currentStep].text.join(" ");
    speakText(currentDialogue);
  }, [currentStep, dialogues, speakText, hasInteracted]);

  const handleNextDialogue = () => {
    if (!hasInteracted) {
      setHasInteracted(true);
      return;
    }

    if (currentStep < dialogues.length - 1) {
      setCurrentStep(currentStep + 1);
      setKey((prev) => prev + 1);
    } else {
      navigate("/photo");
    }
  };

  const handleChatClick = () => {
    navigate("/chat");
  };

  return (
    <div className="welcome">
      <MenuComponent onLanguageChange={onLanguageChange} />
      <button className="chat-button" onClick={handleChatClick}>
        채팅하기
      </button>
      <div className="content-container" onClick={handleNextDialogue}>
        <div className="content-box">
          <div className="profile-image">
            <img src="/girl.png" alt="역사적 인물 사진" />
          </div>
          <div className="text-content" key={key}>
            {!hasInteracted ? (
              <p className="description fade-in-text">화면을 눌러 시작하세요</p>
            ) : (
              dialogues[currentStep].text.map((line, index) => (
                <p
                  key={`${key}-${index}`}
                  className="description fade-in-text"
                  style={{ "--index": index }}
                >
                  {line}
                </p>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Welcome;
