import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/Chat.css";
import axios from "axios";
import MenuComponent from '../components/MenuComponent';

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
  const [captions, setCaptions] = useState([]);

  // 특정 단어와 설명을 매핑하는 객체
  const keywordMap = {
    "3·1운동": {
      title: "3·1 운동",
      content: "1919년 3월 1일에 시작된 한국의 대표적인 독립운동. 민족 자결주의의 영향을 받아 전개된 반일 독립운동이다."
    },
    "3·1 운동": {
      title: "3·1 운동",
      content: "1919년 3월 1일에 시작된 한국의 대표적인 독립운동. 민족 자결주의의 영향을 받아 전개된 반일 독립운동이다."
    },
    "3·1만세운동": {
      title: "3·1 만세운동",
      content: "1919년 3월 1일에 시작된 한국의 대표적인 독립운동. 민족 자결주의의 영향을 받아 전개된 반일 독립운동이다."
    },
    "3·1 만세운동": {
      title: "3·1 만세운동",
      content: "1919년 3월 1일에 시작된 한국의 대표적인 독립운동. 민족 자결주의의 영향을 받아 전개된 반일 독립운동이다."
    },
    "3·1 만세 운동": {
      title: "3·1 만세 운동",
      content: "1919년 3월 1일에 시작된 한국의 대표적인 독립운동. 민족 자결주의의 영향을 받아 전개된 반일 독립운동이다."
    },
    "대한민국 임시정부": {
      title: "대한민국 임시정부",
      content: "1919년 4월 11일 상하이에서 수립된 망명정부. 독립운동의 중심 기구 역할을 했다."
    },
    "윤봉길": {
      title: "윤봉길 의사",
      content: "1908-1932, 한국의 독립운동가. 1932년 상하이 훙커우 공원에서 의거를 일으켰다."
    }
    // 더 많은 키워드를 추가할 수 있습니다.
  };

  // 메시지에서 특정 단어를 찾아 캡션을 추가하는 함수
  const findKeywordsAndAddCaptions = (text) => {
    const newCaptions = [];
    Object.keys(keywordMap).forEach(keyword => {
      if (text.includes(keyword)) {
        newCaptions.push(keywordMap[keyword]);
      }
    });
    if (newCaptions.length > 0) {
      setCaptions(prev => [...new Set([...prev, ...newCaptions])]);
    }
  };

  // 스크롤을 맨 아래로 이동시키는 함수
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // messages가 변경될 때마다 스크롤을 맨 아래로 이동
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Azure 연결
  const endpoint =
    process.env.REACT_APP_AZURE_OPENAI_ENDPOINT ||
    "https://independentchat2.openai.azure.com/";
  const apiKey = process.env.REACT_APP_AZURE_OPENAI_API_KEY || "";
  const apiVersion = "2024-05-01-preview";
  const deploymentName = "independent-gpt4o"; // This must match your deployment name

  //Azure Speech 설정
  const speechKey = process.env.REACT_APP_AZURE_SPEECH_KEY_3 || "";
  const speechRegion = process.env.REACT_APP_AZURE_SPEECH_REGION_1 || "westeurope";

  // TTS 함수
  const speakTextWithAzureTTS = async (text) => {
    if (!speechKey || !speechRegion) {
      console.error("Azure Speech 키 또는 리전이 설정되지 않았습니다.");
      return;
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

      if (!response.ok) {
        throw new Error(`Azure TTS 요청 실패: ${response.status}`);
      }

      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);
      audio.play();
    } catch (error) {
      console.error("TTS 에러:", error);
    }
  };

  const handleBackClick = () => {
    navigate("/");
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (inputMessage.trim() === "") return;

    const userMessage = { text: inputMessage, isUser: true };
    setMessages(prev => [...prev, userMessage]);
    setInputMessage("");

    try {
      const response = await axios.post(
        `${endpoint}/openai/deployments/${deploymentName}/chat/completions?api-version=${apiVersion}`,
        {
          messages: [
            {
              role: "system",
              content:
                "너는 대한민국 독립운동가야. 독립운동가라고 생각하고 옛날 한국인의 말투로 대답해줘. '하오체'로 대답해주면 돼.",
            },
            ...messages.map((m) => ({
              role: m.isUser ? "user" : "assistant",
              content: m.text,
            })),
            { role: "user", content: inputMessage },
          ],
          temperature: 0.7,
          max_tokens: 800,
          top_p: 0.95,
          frequency_penalty: 0,
          presence_penalty: 0,
          stop: null,
        },
        {
          headers: {
            "Content-Type": "application/json",
            "api-key": apiKey,
          },
        }
      );

      const botResponse = response.data.choices[0].message.content;
      setMessages(prev => [...prev, { text: botResponse, isUser: false }]);
      
      // 봇의 응답에서 키워드 찾기
      findKeywordsAndAddCaptions(botResponse);

      // TTS로 읽어주기
      speakTextWithAzureTTS(botResponse);
    } catch (error) {
      console.error("OpenAI 오류:", error);
      setMessages(prev => [
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
