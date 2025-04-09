import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/Chat.css";
import axios from "axios";
import Papa from "papaparse";
import MenuComponent from "../components/MenuComponent";

function Chat({ language, onLanguageChange }) {
  const navigate = useNavigate();
  const messagesEndRef = useRef(null);
  const [messages, setMessages] = useState([
    {
      text: "안녕하시오! 나는 독립운동가 000이오. 오늘 어떤 이야기를 나누고 싶소? 독립운동과 관련하여 궁금한 것이 있으면 질문해 주시오",
      isUser: false,
    },
  ]);
  const [inputMessage, setInputMessage] = useState("");
  const [isTTSEnabled, setIsTTSEnabled] = useState(true);
  const [currentAudio, setCurrentAudio] = useState(null);
  const [captions, setCaptions] = useState([]);
  const [documents, setDocuments] = useState([]);

  // Azure 설정
  const endpoint = process.env.REACT_APP_AZURE_OPENAI_ENDPOINT;
  const apiKey = process.env.REACT_APP_AZURE_OPENAI_API_KEY;
  const apiVersion = process.env.REACT_APP_AZURE_OPENAI_API_VERSION;
  const deploymentName = process.env.REACT_APP_AZURE_OPENAI_DEPLOYMENT_NAME;
  const speechKey = process.env.REACT_APP_AZURE_SPEECH_KEY;
  const speechRegion = process.env.REACT_APP_AZURE_SPEECH_REGION;

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (messages.length > 0 && !messages[messages.length - 1].isUser) {
      if (currentAudio) {
        currentAudio.pause();
        currentAudio.currentTime = 0;
        setCurrentAudio(null);
      }
      speakTextWithAzureTTS(messages[messages.length - 1].text);
    }
  }, [messages]);

  useEffect(() => {
    fetch("/doklip.csv")
      .then((response) => response.text())
      .then((csvText) => {
        Papa.parse(csvText, {
          header: true,
          complete: (results) => setDocuments(results.data),
        });
      });
  }, []);

  const speakTextWithAzureTTS = async (text) => {
    if (!isTTSEnabled || !speechKey || !speechRegion) return;

    if (currentAudio) {
      currentAudio.pause();
      currentAudio.currentTime = 0;
    }

    const url = `https://${speechRegion}.tts.speech.microsoft.com/cognitiveservices/v1`;
    const ssml = `
      <speak version='1.0' xml:lang='ko-KR'>
        <voice name='ko-KR-SunHiNeural'>${text}</voice>
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
      const nextState = !prev;
      if (!nextState && currentAudio) {
        currentAudio.pause();
      } else if (nextState && currentAudio?.paused) {
        currentAudio
          .play()
          .catch((e) => console.error("오디오 재생 중 오류:", e));
      }
      return nextState;
    });
  };

  const handleBackClick = () => {
    navigate("/");
  };

  const getRelevantDocs = (query) => {
    const loweredQuery = query.toLowerCase();
    const matches = documents
      .filter((doc) =>
        Object.values(doc).some((value) =>
          String(value).toLowerCase().includes(loweredQuery)
        )
      )
      .slice(0, 3);
    return matches;
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (inputMessage.trim() === "") return;

    const userMessage = { text: inputMessage, isUser: true };
    setMessages((prev) => [...prev, userMessage]);
    setInputMessage("");

    const relevantDocs = getRelevantDocs(inputMessage);
    const contextText = relevantDocs
      .map(
        (doc, idx) =>
          `참고자료 ${idx + 1}: ${doc.content || JSON.stringify(doc)}`
      )
      .join("\n");

    const promptMessages = [
      {
        role: "system",
        content:
          "너는 대한민국 독립운동가야. 독립운동가라고 생각하고 옛날 한국인의 말투로 대답해줘. '하오체'로 대답해주면 돼. 아래는 참고할 수 있는 자료요:\n" +
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
        content: doc.content || JSON.stringify(doc),
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

  function isImageUrl(url) {
    return /\.(jpeg|jpg|png|gif|webp)$/i.test(url);
  }

  return (
    <div className="chat">
      <MenuComponent onLanguageChange={onLanguageChange} />
      <button className="back-button" onClick={handleBackClick}>
        뒤로가기
      </button>
      <div className="chat-container">
        <div className="messages">
          {messages.map((message, index) => (
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
