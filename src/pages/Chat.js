// src/pages/Chat.js
import React, { useState, useRef, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import "../styles/Chat.css";
import axios from "axios";
import Papa from "papaparse";
import MenuComponent from "../components/MenuComponent";
import { translateText } from "../translations/translator";

function Chat({ language, onLanguageChange }) {
  const navigate = useNavigate();
  const location = useLocation();
  const matchedFighter = location.state?.matchedFighter;
  const messagesEndRef = useRef(null);
  const [messages, setMessages] = useState([
    {
      text: matchedFighter
        ? `안녕하시오! 저는 ${matchedFighter.name}이오. 제가 걸어온 독립운동의 길에 대해 무엇이든 물어보시오.`
        : "안녕하세요! 저는 독립운동가들의 이야기를 전해드리는 이야기꾼입니다. 어떤 독립운동가의 이야기가 궁금하신가요?",
      isUser: false,
      isInitialGreeting: true,
    },
  ]);
  const [translatedMessages, setTranslatedMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isTTSEnabled, setIsTTSEnabled] = useState(true);
  const [currentAudio, setCurrentAudio] = useState(null);
  const [captions, setCaptions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [knowledgeBase, setKnowledgeBase] = useState([]);

  const speechKey = process.env.REACT_APP_AZURE_SPEECH_KEY;
  const speechRegion = process.env.REACT_APP_AZURE_SPEECH_REGION;

  // 일본어 텍스트에 포함된 숫자를 SSML <say-as> 태그로 감싸주는 헬퍼 함수
  const processTextForTTS = (text, language) => {
    if (language === "jp") {
      // 단어 경계 내 숫자를 찾아서 say-as 태그로 감쌈 (cardinal)
      return text.replace(/\b\d+\b/g, (match) => {
        return `<say-as interpret-as="cardinal" language="ja-JP">${match}</say-as>`;
      });
    }
    return text;
  };

  useEffect(() => {
    const translateMessages = async () => {
      if (language === "ko") {
        setTranslatedMessages(messages);
        return;
      }
      try {
        const translated = await Promise.all(
          messages.map(async (msg) => {
            if (msg.isUser) return msg;
            const translatedText = await translateText(msg.text, language);
            return { ...msg, text: translatedText };
          })
        );
        setTranslatedMessages(translated);
      } catch (error) {
        console.error("메시지 번역 실패:", error);
        setTranslatedMessages(messages);
      }
    };
    translateMessages();
  }, [messages, language]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [translatedMessages]);

  useEffect(() => {
    if (
      translatedMessages.length > 0 &&
      !translatedMessages[translatedMessages.length - 1].isUser
    ) {
      const latestTranslated =
        translatedMessages[translatedMessages.length - 1];
      if (currentAudio) {
        currentAudio.pause();
        currentAudio.currentTime = 0;
        setCurrentAudio(null);
      }
      speakTextWithAzureTTS(latestTranslated.text);
    }
  }, [translatedMessages]);

  useEffect(() => {
    const loadData = async () => {
      try {
        const response = await fetch("/data/doklip.csv");
        if (!response.ok)
          throw new Error(`HTTP error! status: ${response.status}`);
        const csvText = await response.text();

        Papa.parse(csvText, {
          header: true,
          skipEmptyLines: true,
          encoding: "UTF-8",
          complete: (results) => {
            const knowledge = results.data
              .filter((row) => row.id && row.content)
              .map((row) => ({
                id: row.id,
                name: row.name || "",
                hanjaName: row.nameHanja || "",
                birthplace: row.addressBirth || "",
                movement: row.movementFamily || "",
                award: row.orders || "",
                summary: row.activities || "",
                content: row.content || "",
                reference: row.references || "",
                imageUrl: row.image_url || "",
                searchText:
                  `${row.name} ${row.nameHanja} ${row.movementFamily} ${row.addressBirth} ${row.activities} ${row.content}`.toLowerCase(),
              }));
            setKnowledgeBase(knowledge);
          },
          error: (error) => {
            console.error("CSV 파싱 오류:", error);
          },
        });
      } catch (error) {
        console.error("CSV 파일 로드 중 오류:", error);
      }
    };
    loadData();
  }, []);

  const searchRelevantContent = (query) => {
    if (!query || !knowledgeBase.length) return [];

    const loweredQuery = query.toLowerCase();

    const calculateRelevance = (item) => {
      let score = 0;
      if (item.name?.toLowerCase().includes(loweredQuery)) score += 10;
      if (item.hanjaName?.toLowerCase().includes(loweredQuery)) score += 8;
      if (item.movement?.toLowerCase().includes(loweredQuery)) score += 6;
      if (item.birthplace?.toLowerCase().includes(loweredQuery)) score += 4;
      if (item.summary?.toLowerCase().includes(loweredQuery)) score += 3;
      if (item.content?.toLowerCase().includes(loweredQuery)) score += 2;
      if (item.searchText.includes(loweredQuery)) score += 1;
      return score;
    };

    return knowledgeBase
      .map((item) => ({ ...item, relevance: calculateRelevance(item) }))
      .filter((item) => item.relevance > 0)
      .sort((a, b) => b.relevance - a.relevance)
      .slice(0, 3);
  };

  const speakTextWithAzureTTS = async (text) => {
    if (!isTTSEnabled || !speechKey || !speechRegion) return;

    if (currentAudio) {
      currentAudio.pause();
      currentAudio.currentTime = 0;
    }

    // 언어 설정에 따라 일본어인 경우 숫자를 전처리합니다.
    const processedText = processTextForTTS(text.trim(), language);

    const url = `https://${speechRegion}.tts.speech.microsoft.com/cognitiveservices/v1`;
    const ssml = `<speak version="1.0" xml:lang="${
      language === "ko" ? "ko-KR" : language === "jp" ? "ja-JP" : "en-US"
    }">
      <voice name="${
        language === "ko"
          ? "ko-KR-SunHiNeural"
          : language === "jp"
          ? "ja-JP-NanamiNeural"
          : "en-US-JennyNeural"
      }">${processedText}</voice>
    </speak>`;

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/ssml+xml",
          "Ocp-Apim-Subscription-Key": speechKey,
          "X-Microsoft-OutputFormat": "audio-16khz-32kbitrate-mono-mp3",
        },
        body: ssml,
      });

      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);
      setCurrentAudio(audio);
      audio.play();
    } catch (error) {
      console.error("TTS 에러:", error);
    }
  };

  const handleTTSButtonClick = () => {
    setIsTTSEnabled((prev) => {
      const next = !prev;
      if (!next && currentAudio) {
        currentAudio.pause();
      } else if (next && currentAudio?.paused) {
        currentAudio.play().catch((e) => console.error("오디오 재생 오류:", e));
      }
      return next;
    });
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (inputMessage.trim() === "" || isLoading) return;

    const userMessage = { text: inputMessage, isUser: true };
    setMessages((prev) => [...prev, userMessage]);
    setInputMessage("");
    setIsLoading(true);
    setIsSearching(!matchedFighter && messages.length === 1);

    try {
      // 매칭된 인물이 없고, 첫 메시지인 경우 (인물 검색)
      if (!matchedFighter && messages.length === 1) {
        const response = await axios.post(
          "https://independent.eastus.cloudapp.azure.com/api/chat/",
          {
            question: inputMessage,
            language: language,
            matchedFighter: null,
            isNarrator: true, // 나레이터 모드임을 백엔드에 알림
          },
          {
            headers: {
              "Content-Type": "application/json",
            },
          }
        );

        if (response.data && response.data.matchedFighter) {
          // 인물이 매칭된 경우
          const botMessage = {
            text: "독립운동가를 찾았습니다. 이제부터 그분의 이야기를 들려드리겠습니다.",
            isUser: false,
          };
          setMessages((prev) => [...prev, botMessage]);
          // 여기서는 navigate하지 않고 현재 페이지에서 계속 진행
        } else {
          // 인물이 매칭되지 않은 경우
          const botMessage = {
            text: "죄송합니다. 해당하는 독립운동가를 찾을 수 없습니다. 다른 독립운동가의 이름을 말씀해주시겠어요?",
            isUser: false,
          };
          setMessages((prev) => [...prev, botMessage]);
        }
      } else {
        // 일반적인 대화 진행
        const response = await axios.post(
          "http://20.84.89.102/api/chat/",
          {
            question: inputMessage,
            language: language,
            matchedFighter: matchedFighter
              ? {
                  name: matchedFighter.name,
                  nameHanja: matchedFighter.nameHanja,
                  movementFamily: matchedFighter.movementFamily,
                  orders: matchedFighter.orders,
                  addressBirth: matchedFighter.addressBirth,
                  activities: matchedFighter.activities,
                  content: matchedFighter.content,
                  references: matchedFighter.references,
                }
              : null,
            isNarrator: !matchedFighter, // 매칭된 인물이 없으면 나레이터 모드
          },
          {
            headers: {
              "Content-Type": "application/json",
            },
          }
        );

        if (response.data && response.data.answer) {
          const botMessage = { text: response.data.answer, isUser: false };
          setMessages((prev) => [...prev, botMessage]);

          if (response.data.citations && response.data.citations.length > 0) {
            const formattedCitations = response.data.citations.map(
              (citation, idx) => ({
                title: `참고 ${idx + 1}`,
                content: `${citation.title}\n${citation.reference}`,
              })
            );
            setCaptions(formattedCitations);
          }
        } else {
          throw new Error("서버 응답에 답변이 없습니다.");
        }
      }
    } catch (error) {
      console.error("API 오류:", error);
      const errorMessage = {
        text: matchedFighter
          ? "죄송하오. 답변 중에 오류가 발생했소. 다시 한 번 질문해 주시겠소?"
          : "죄송합니다. 답변 중에 오류가 발생했습니다. 다시 한 번 질문해 주시겠어요?",
        isUser: false,
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (matchedFighter?.image_url) {
      console.log("Setting fighter image:", matchedFighter.image_url);
      document.documentElement.style.setProperty(
        "--fighter-image",
        `url("${matchedFighter.image_url}")`
      );
    }
  }, [matchedFighter]);

  return (
    <div className="chat">
      <MenuComponent onLanguageChange={onLanguageChange} />
      <div className="chat-container">
        <div className="chat-header">
          <h1>독립운동가와의 대화</h1>
          <p className="chat-ai-warning">
            ※ AI는 실수할 수 있으며, 제공되는 정보는 참고용으로만 사용해주세요.
          </p>
        </div>
        <div className="messages">
          {translatedMessages.map((message, index) => (
            <div
              key={index}
              className={`message ${message.isUser ? "user" : "bot"} ${
                !message.isUser
                  ? matchedFighter
                    ? "matched-avatar"
                    : "default-avatar"
                  : ""
              }`}
            >
              {message.text}
            </div>
          ))}
          {isLoading && isSearching && (
            <div className="message bot">
              <div className="typing-indicator">문서를 읽고 있습니다...</div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
        <form className="input-form" onSubmit={handleSendMessage}>
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            placeholder="메시지를 입력하세요..."
            className="message-input"
            disabled={isLoading}
          />
          <button type="submit" className="send-button" disabled={isLoading}>
            전송
          </button>
        </form>
      </div>
      <button
        className={`tts-button ${isTTSEnabled ? "active" : ""}`}
        onClick={handleTTSButtonClick}
        title={isTTSEnabled ? "TTS 끄기" : "TTS 켜기"}
      >
        {isTTSEnabled ? "🔊" : "🔇"}
      </button>
      <div className="caption-container">
        {captions.map((caption, index) => (
          <div key={index} className="caption-item">
            <div className="caption-title">{caption.title}</div>
            <div className="caption-content">{caption.content}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Chat;
