import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/IndependentGame.css';

function IndependentGame() {
  const navigate = useNavigate();
  const [currentScene] = useState({
    title: "하얼빈 의거",
    date: "1909년 10월 26일",
    location: "하얼빈역",
    description: "쌀쌀한 공기 속에서 당신은 이토 히로부미가 탄 열차가 도착한다는 정보를 입수했습니다. 러시아 군복을 입은 안중근 의사와 동지들이 플랫폼에서 대기하고 있습니다. 열차가 도착하고 이토 히로부미가 내립니다.",
    choices: [
      "이토 히로부미에게 가까이 접근하여 즉시 거사를 실행한다.",
      "러시아 육군 장교들과 인사를 나누는 척하며 더 적절한 타이밍을 기다린다.",
      "동지들에게 신호를 보내 함께 움직일 준비를 한다.",
      "잠시 망설이며 이토 히로부미의 동선을 더 지켜본다."
    ],
    historicalContext: "안중근 의사는 1909년 10월 26일, 한국 침략의 원흉인 이토 히로부미를 처단하기 위해 하얼빈역에서 의거를 감행했습니다. 이 의거는 한국의 주권을 침탈한 일제에 대한 강력한 항거였으며, 세계에 한국의 독립 의지를 알린 중요한 사건이었습니다."
  });

  const handleChoice = (choiceIndex) => {
    // 선택에 따른 다음 장면 전환 로직 구현 예정
    console.log(`Selected choice: ${choiceIndex}`);
  };

  return (
    <div className="game-container">
      <div className="game-content">
        {/* 상단 정보 */}
        <div className="scene-header">
          <h1>{currentScene.title}</h1>
          <div className="scene-info">
            <span className="date">{currentScene.date}</span>
            <span className="location">{currentScene.location}</span>
          </div>
        </div>

        {/* 장면 설명 */}
        <div className="scene-description">
          <p>{currentScene.description}</p>
        </div>

        {/* 선택지 */}
        <div className="choices-container">
          {currentScene.choices.map((choice, index) => (
            <button
              key={index}
              className="choice-button"
              onClick={() => handleChoice(index)}
            >
              {choice}
            </button>
          ))}
        </div>

        {/* 역사적 배경 */}
        <div className="historical-context">
          <h3>역사적 배경</h3>
          <p>{currentScene.historicalContext}</p>
        </div>

        {/* 뒤로가기 버튼 */}
        <button 
          className="back-button"
          onClick={() => navigate('/')}
        >
          메인으로 돌아가기
        </button>
      </div>
    </div>
  );
}

export default IndependentGame; 