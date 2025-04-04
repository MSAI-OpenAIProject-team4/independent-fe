import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/Chat.css";
import axios from "axios";

function Chat() {
  const navigate = useNavigate();
  const [messages, setMessages] = useState([
    {
      text: "안녕하시오! 나는 독립운동가 000이오. 오늘 어떤 이야기를 나누고 싶소? 독립운동과 관련하여 궁금한 것이 있으면 질문해 주시오",
      isUser: false,
    },
  ]);
  const [inputMessage, setInputMessage] = useState("");

  // Azure 연결
  const endpoint =
    process.env["AZURE_OPENAI_ENDPOINT"] ||
    "https://independentchat2.openai.azure.com/";
  const apiKey = process.env["AZURE_OPENAI_API_KEY"] || "";
  const apiVersion = "2024-05-01-preview";
  const deploymentName = "independent-gpt4o"; // This must match your deployment name

  //Azure Speech 설정
  const speechKey = process.env["AZURE_SPEECH_KEY"] || "";
  const speechRegion = process.env["AZURE_SPEECH_REGION"] || "westeurope";

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

  // chating 함수
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (inputMessage.trim() === "") return;

    const userMessage = { text: inputMessage, isUser: true };
    const updatedMessages = [...messages, userMessage]; // 최신 메시지 목록을 따로 관리
    setMessages((prev) => [...prev, userMessage]);
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
      setMessages((prev) => [...prev, { text: botResponse, isUser: false }]);

      // 시스템 메시지를 TTS로 읽어줌
      speakTextWithAzureTTS(botResponse);
    } catch (error) {
      console.error("OpenAI 오류:", error);
      setMessages((prev) => [
        ...prev,
        { text: "오류가 발생했소. 다시 시도해보시오.", isUser: false },
      ]);
    }
  };

  const handleBackClick = () => {
    navigate("/");
  };

  return (
    <div className="chat">
      <button className="back-button" onClick={handleBackClick}>
        뒤로가기
      </button>
      <div className="flag-icons">
        <img src="/kr-flag.png" alt="한국어" className="flag-icon" />
        <img src="/us-flag.png" alt="English" className="flag-icon" />
        <img src="/jp-flag.png" alt="日本語" className="flag-icon" />
      </div>
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
    </div>
  );
}

export default Chat;
