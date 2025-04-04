import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/Welcome.css';

function Welcome() {
  const [currentStep, setCurrentStep] = useState(0);
  const [key, setKey] = useState(0);
  const navigate = useNavigate();

  const dialogues = [
    {
      text: [
        "안녕하세요.",
        "100년 역사 여행을 도와줄 000입니다."
      ]
    },
    {
      text: [
        "1945년 광복 이후 80년의 시간이 지났습니다.",
        "여러분은 광복을 위해 생명을 불태운 이들을",
        "얼마나 알고 기억하고 계신가요?"
      ]
    },
    {
      text: [
        "오늘 당신과 닮은 독립운동가를 만나",
        "이야기를 나눠보고 그들의 희생을 기억하는",
        "시간이 되었으면 좋겠습니다."
      ]
    }
  ];

  const handleNextDialogue = () => {
    if (currentStep < dialogues.length - 1) {
      setCurrentStep(currentStep + 1);
      setKey(prev => prev + 1);
    } else {
      navigate('/photo');
    }
  };

  const handleChatClick = () => {
    navigate('/chat');
  };

  return (
    <div className="welcome">
      <button className="chat-button" onClick={handleChatClick}>
        채팅하기
      </button>
      <div className="content-container" onClick={handleNextDialogue}>
        <div className="content-box">
          <div className="profile-image">
            <img src="/girl.png" alt="역사적 인물 사진" />
          </div>
          <div className="text-content" key={key}>
            {dialogues[currentStep].text.map((line, index) => (
              <p 
                key={`${key}-${index}`}
                className="description fade-in-text"
                style={{ '--index': index }}
              >
                {line}
              </p>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Welcome; 