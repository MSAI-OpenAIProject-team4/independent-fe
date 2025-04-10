// src/pages/Chat.js
import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/Chat.css";
import axios from "axios";
import Papa from "papaparse";
import MenuComponent from "../components/MenuComponent";
import { translateText } from "../translations/translator";

function Chat({ language, onLanguageChange }) {
  const navigate = useNavigate();
  const messagesEndRef = useRef(null);
  const [messages, setMessages] = useState([
    {
      text: "안녕하시오! 나는 독립운동가 000이오. 오늘 어떤 이야기를 나누고 싶소? 독립운동과 관련하여 궁금한 것이 있으면 질문해 주시오",
      isUser: false,
    },
  ]);
  const [translatedMessages, setTranslatedMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isTTSEnabled, setIsTTSEnabled] = useState(true);
  const [currentAudio, setCurrentAudio] = useState(null);
  const [captions, setCaptions] = useState([]);
  const [knowledgeBase, setKnowledgeBase] = useState([]);

  const endpoint = process.env.REACT_APP_AZURE_OPENAI_ENDPOINT;
  const apiKey = process.env.REACT_APP_AZURE_OPENAI_API_KEY;
  const apiVersion = process.env.REACT_APP_AZURE_OPENAI_API_VERSION;
  const deploymentName = process.env.REACT_APP_AZURE_OPENAI_DEPLOYMENT_NAME;
  const speechKey = process.env.REACT_APP_AZURE_SPEECH_KEY;
  const speechRegion = process.env.REACT_APP_AZURE_SPEECH_REGION;

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
        const response = await fetch("/data/independent.csv");
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
                name: row.hangle || "",
                hanjaName: row.hanja || "",
                birthplace: row.adress || "",
                movement: row.type || "",
                award: row.award || "",
                summary: row.activity || "",
                content: row.content || "",
                reference: row.reference || "",
                imageUrl: row.image_url || "",
                searchText:
                  `${row.hangle} ${row.hanja} ${row.type} ${row.adress} ${row.activity} ${row.content}`.toLowerCase(),
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

    const url = `https://${speechRegion}.tts.speech.microsoft.com/cognitiveservices/v1`;
    const ssml = `
      <speak version='1.0' xml:lang='${language === "ko" ? "ko-KR" : "en-US"}'>
        <voice name='${
          language === "ko" ? "ko-KR-SunHiNeural" : "en-US-JennyNeural"
        }'>
          ${text}
        </voice>
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

  const handleBackClick = () => {
    navigate("/");
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (inputMessage.trim() === "") return;

    const userMessage = { text: inputMessage, isUser: true };
    setMessages((prev) => [...prev, userMessage]);
    setInputMessage("");

    const relevantDocs = searchRelevantContent(inputMessage);
    const contextText = relevantDocs
      .map(
        (doc, idx) =>
          `참고자료 ${idx + 1}: ${doc.name}(${doc.hanjaName}) - ${
            doc.movement
          } - ${doc.content}`
      )
      .join("\n");

    const promptMessages = [
      {
        role: "system",
        content:
          "너는 대한민국 독립운동가야. 독립운동가라고 생각하고 옛날 한국인의 말투로 대답해줘. 500자 이내로 요약해서 핵심만 알려줘. '하오체'로 대답해주면 돼. 주의사항:\n1. 제공된 참고자료의 내용만 사용하여 대답하시오\n2. 참고자료에 없는 내용은 절대 생성하지 마시오\n3. 참고자료에 있는 사실만을 기반으로 대화하시오\n4. 확실하지 않은 내용은 '그 부분에 대해서는 정확히 알지 못하오'라고 대답하시오\n\n아래는 참고할 수 있는 자료요:\n" +
          contextText,
      },
      ...messages.map((m) => ({
        role: m.isUser ? "user" : "assistant",
        content: m.text,
      })),
      { role: "user", content: inputMessage },
    ];

    try {
      const response = await axios.post(
        `${endpoint}/openai/deployments/${deploymentName}/chat/completions?api-version=${apiVersion}`,
        {
          messages: promptMessages,
          temperature: 0.7,
          max_tokens: 500,
        },
        {
          headers: {
            "Content-Type": "application/json",
            "api-key": apiKey,
          },
        }
      );

      const botResponse = response.data.choices[0].message.content;
      setMessages((prev) => [...prev, { text: botResponse, isUser: false }]);

      const formattedCaptions = relevantDocs.map((doc, idx) => ({
        title: `참고 ${idx + 1}`,
        content: `${doc.name}(${doc.hanjaName}) - ${doc.movement}\n${doc.content}`,
      }));
      setCaptions(formattedCaptions);
    } catch (error) {
      console.error("OpenAI 오류:", error);
      setMessages((prev) => [
        ...prev,
        { text: "오류가 발생했소. 다시 시도해보시오.", isUser: false },
      ]);
    }
  };

  return (
    <div className="chat">
      <MenuComponent onLanguageChange={onLanguageChange} />
      <button className="back-button" onClick={handleBackClick}>
        뒤로가기
      </button>
      <div className="chat-container">
        <div className="messages">
          {translatedMessages.map((message, index) => (
            <div
              key={index}
              className={`message ${message.isUser ? "user" : "bot"}`}
            >
              {message.text}
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
        <form className="input-form" onSubmit={handleSendMessage}>
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            placeholder="메시지를 입력하세요..."
            className="message-input"
          />
          <button type="submit" className="send-button">
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
