import React, {
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
} from "react";
import { useNavigate } from "react-router-dom";
import "../styles/Welcome.css";
import MenuComponent from "../components/MenuComponent";

function Welcome({ language, onLanguageChange }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [hasInteracted, setHasInteracted] = useState(false);
  const [shouldSpeak, setShouldSpeak] = useState(false);
  const navigate = useNavigate();

  // HTMLAudio 객체를 저장할 ref
  const audioRef = useRef(null);

  const dialogues = useMemo(
    () => [
      { text: ["안녕하세요.", "100년 역사 여행을 도와줄 000입니다."] },
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

  // Azure TTS REST API를 호출하여 음성 Blob을 받아 Audio 객체로 재생하는 함수
  const speakText = useCallback(async (text) => {
    // 기존에 재생 중인 음성이 있다면 즉시 중단
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current = null;
    }

    const region = process.env.REACT_APP_AZURE_SPEECH_REGION_WELCOME;
    const key = process.env.REACT_APP_AZURE_SPEECH_KEY_WELCOME;
    const url = `https://${region}.tts.speech.microsoft.com/cognitiveservices/v1`;

    // SSML 형식의 음성 합성 요청
    const ssml = `<speak version='1.0' xml:lang='ko-KR'>
      <voice name='ko-KR-JiMinNeural'>
        ${text}
      </voice>
    </speak>`;

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/ssml+xml",
          "X-Microsoft-OutputFormat": "audio-16khz-32kbitrate-mono-mp3",
          "Ocp-Apim-Subscription-Key": key,
        },
        body: ssml,
      });
      if (!response.ok) {
        throw new Error("TTS 요청 실패: " + response.status);
      }
      const blob = await response.blob();
      const audioUrl = URL.createObjectURL(blob);
      const audio = new Audio(audioUrl);
      audioRef.current = audio;
      audio.play();
    } catch (error) {
      console.error("TTS 에러:", error);
    }
  }, []);

  // 대화 실행을 상태로 제어: shouldSpeak가 true이면 현재 대사의 텍스트를 읽음
  useEffect(() => {
    if (!hasInteracted || !shouldSpeak) return;
    const text = dialogues[currentStep].text.join(" ");
    speakText(text);
    setShouldSpeak(false);
  }, [shouldSpeak, hasInteracted, currentStep, dialogues, speakText]);

  // 언마운트될 때 실행: 남은 음성이 있으면 중단
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
        audioRef.current = null;
        console.log("✅ 언마운트 시 음성 중지됨");
      }
    };
  }, []);

  const handleNextDialogue = () => {
    // 새로운 대사가 시작되기 전에 기존 음성을 중단!
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current = null;
    }

    if (!hasInteracted) {
      setHasInteracted(true);
      setShouldSpeak(true);
      return;
    }

    if (currentStep < dialogues.length - 1) {
      setCurrentStep((prev) => prev + 1);
      setShouldSpeak(true);
    } else {
      navigate("/photo");
    }
  };

  const handleChatClick = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current = null;
    }
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
          <div className="text-content">
            {!hasInteracted ? (
              <p className="description fade-in-text">화면을 눌러 시작하세요</p>
            ) : (
              dialogues[currentStep].text.map((line, index) => (
                <p
                  key={index}
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
