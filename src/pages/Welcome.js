// src/pages/Welcome.js
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
import { translateText } from "../translations/translator";

function Welcome({ language = "ko", onLanguageChange }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [hasInteracted, setHasInteracted] = useState(false);
  const [shouldSpeak, setShouldSpeak] = useState(false);
  const [translatedDialogues, setTranslatedDialogues] = useState([]);
  const navigate = useNavigate();

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

  // 언어가 바뀌면 번역 실행 (일본어 선택 시 targetLanguage는 "Japanese"로 전달)
  useEffect(() => {
    const translateDialoguesAsync = async () => {
      if (language === "ko") {
        setTranslatedDialogues(dialogues);
        return;
      }

      const targetLanguage = language === "jp" ? "Japanese" : language;
      try {
        const translated = await Promise.all(
          dialogues.map(async (dialogue) => {
            const translatedLines = await Promise.all(
              dialogue.text.map((line) => translateText(line, targetLanguage))
            );
            return { text: translatedLines };
          })
        );
        setTranslatedDialogues(translated);
      } catch (error) {
        console.error("번역 실패:", error);
        setTranslatedDialogues(dialogues);
      }
    };

    translateDialoguesAsync();
  }, [dialogues, language]);

  // TTS 함수: 선택된 언어에 따라 SSML을 동적으로 구성하고, 오디오 Blob이 유효한지 검사
  const speakText = useCallback(
    async (text) => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
        audioRef.current = null;
      }

      // 언어에 따라 xml:lang과 voice name 설정
      let xmlLang = "ko-KR";
      let voiceName = "ko-KR-JiMinNeural";
      if (language === "en") {
        xmlLang = "en-US";
        voiceName = "en-US-JennyNeural";
      } else if (language === "jp") {
        xmlLang = "ja-JP";
        voiceName = "ja-JP-NanamiNeural"; // Azure TTS에서 지원하는 일본어 음성으로 확인
      }

      const region = process.env.REACT_APP_AZURE_SPEECH_REGION_WELCOME;
      const key = process.env.REACT_APP_AZURE_SPEECH_KEY_WELCOME;
      const url = `https://${region}.tts.speech.microsoft.com/cognitiveservices/v1`;

      const ssml = `<speak version="1.0" xml:lang="${xmlLang}">
        <voice name="${voiceName}">
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
          const errorText = await response.text();
          throw new Error(
            "TTS 요청 실패: " + response.status + " " + errorText
          );
        }
        const blob = await response.blob();
        // blob이 유효하고 지원하는 타입인지 확인 (대부분 "audio/mpeg" 타입)
        if (!blob || !blob.type.startsWith("audio/")) {
          throw new Error("유효한 오디오 파일이 반환되지 않았습니다.");
        }
        const audioUrl = URL.createObjectURL(blob);
        const audio = new Audio(audioUrl);
        audioRef.current = audio;
        audio.play().catch((err) => {
          console.error("오디오 재생 오류:", err);
        });
      } catch (error) {
        console.error("TTS 에러:", error);
      }
    },
    [language]
  );

  // TTS 사용 시 번역된 대사를 읽음 (translatedDialogues 사용)
  useEffect(() => {
    if (!hasInteracted || !shouldSpeak || translatedDialogues.length === 0)
      return;
    const text = translatedDialogues[currentStep].text.join(" ");
    speakText(text);
    setShouldSpeak(false);
  }, [shouldSpeak, hasInteracted, currentStep, translatedDialogues, speakText]);

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

  return (
    <div className="welcome">
      <MenuComponent onLanguageChange={onLanguageChange} />
      <div className="content-container" onClick={handleNextDialogue}>
        <div className="content-box">
          <div className="profile-image">
            <img src="/girl.png" alt="역사적 인물 사진" />
          </div>
          <div className="text-content">
            {!hasInteracted ? (
              <p className="description fade-in-text">
                {language === "ko"
                  ? "화면을 눌러 시작하세요"
                  : language === "en"
                  ? "Tap the screen to start"
                  : "Start"}
              </p>
            ) : (
              translatedDialogues[currentStep]?.text.map((line, index) => (
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
