import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/Chat.css';

function Chat() {
  const navigate = useNavigate();
  const [messages, setMessages] = useState([
    { text: "안녕하세요! 저는 독립운동가 000입니다. 오늘 어떤 이야기를 나누고 싶으신가요?", isUser: false }
  ]);
  const [inputMessage, setInputMessage] = useState('');

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (inputMessage.trim() === '') return;

    // 사용자 메시지 추가
    setMessages(prev => [...prev, { text: inputMessage, isUser: true }]);
    setInputMessage('');

    // 1초 후 봇 응답 추가
    setTimeout(() => {
      setMessages(prev => [...prev, { 
        text: "그렇군요. 제가 그때의 이야기를 들려드릴게요...", 
        isUser: false 
      }]);
    }, 1000);
  };

  const handleBackClick = () => {
    navigate('/');
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
              className={`message ${message.isUser ? 'user' : 'bot'}`}
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