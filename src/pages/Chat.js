import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/Chat.css";
import axios from "axios";

function Chat() {
  const navigate = useNavigate();
  const [messages, setMessages] = useState([
    {
      text: "안녕하세요! 저는 독립운동가 000입니다. 오늘 어떤 이야기를 나누고 싶으신가요?",
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

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (inputMessage.trim() === "") return;

    const userMessage = { text: inputMessage, isUser: true };
    setMessages((prev) => [...prev, userMessage]);
    setInputMessage("");

    try {
      const response = await axios.post(
        `${endpoint}/openai/deployments/${deploymentName}/chat/completions?api-version=${apiVersion}`,
        {
          messages: [
            { role: "system", content: "당신은 친절한 독립운동가입니다." },
            ...messages.map((m) => ({
              role: m.isUser ? "user" : "assistant",
              content: m.text,
            })),
            { role: "user", content: inputMessage },
          ],
          temperature: 0.7,
          max_tokens: 1000,
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
    } catch (error) {
      console.error("OpenAI 오류:", error);
      setMessages((prev) => [
        ...prev,
        { text: "오류가 발생했어요. 다시 시도해주세요.", isUser: false },
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
