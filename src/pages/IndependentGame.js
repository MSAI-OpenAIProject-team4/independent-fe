import React, { useState } from 'react';
import '../styles/IndependentGame.css';
import MenuComponent from '../components/MenuComponent';
import historicalEvents from '../data/independentEvent.js';

const makeApiRequest = async (currentEventId, currentStep, currentChoice) => {
  const eventData = historicalEvents[currentEventId];
  if (!eventData) {
    throw new Error('Event data not found');
  }

  const response = await fetch(process.env.REACT_APP_AZURE_AI_GAME_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'api-key': process.env.REACT_APP_AZURE_AI_GAME_API_KEY
    },
    body: JSON.stringify({
      messages: [
        {
          role: "system",
          content: "당신은 일제강점기 역사 속 인물이 되어 사건을 체험하는 몰입형 시나리오를 생성하는 AI입니다.\n\n응답은 다음 JSON 형식이어야 합니다:\n{\n  \"description\": \"[1인칭 시점으로 상황 묘사]\",\n  \"choices\": [\n    { \"text\": \"[선택지1]\", \"nextStep\": [정수] },\n    { \"text\": \"[선택지2]\", \"nextStep\": [정수] }\n  ]\n}\n\n제약 조건:\n- 1인칭 시점으로 묘사\n- 실제 역사적 맥락에 맞는 선택지\n- 5~7단계 이내 종료\n- 체포 후 과정 포함\n- 첫 단계시작할때 상황과 내가 누구인지 묘사"
        },
        {
          role: "user",
          content: `현재 사건: ${eventData.title}
                   단계: ${currentStep}
                   이전 선택: ${currentChoice ? currentChoice.text : '시작'}
                   
                   사건 정보:
                   - 연도: ${eventData.year}
                   - 주요 인물: ${eventData.keyFigures.join(', ')}
                   - 요약: ${eventData.summary}
                   
                   <retrieved>
                   ${JSON.stringify(eventData)}
                   </retrieved>`
        }
      ],
      temperature: 0.7,
      max_tokens: 800
    })
  });

  if (!response.ok) {
    throw new Error(`API 요청 실패: ${response.status}`);
  }

  const data = await response.json();
  
  if (data.error) {
    throw new Error(data.error.message);
  }

  const sceneData = JSON.parse(data.choices[0].message.content);
  
  if (currentChoice) {
    const outcome = eventData.outcomes[currentChoice.nextScene];
    if (outcome) {
      sceneData.result = outcome;
    }
  }
  
  return sceneData;
};

function IndependentGame({ language, onLanguageChange }) {
  const [selectedScene, setSelectedScene] = useState(null);
  const [selectedChoice, setSelectedChoice] = useState(null);
  const [currentSceneData, setCurrentSceneData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const getEventData = (eventId) => {
    if (!eventId) return null;
    return historicalEvents[eventId];
  };

  const getNextSceneData = async (eventId, step, choice = null) => {
    setIsLoading(true);
    let retryCount = 0;
    const maxRetries = 3;

    while (retryCount < maxRetries) {
      try {
        const sceneData = await makeApiRequest(eventId, step, choice);
        setCurrentSceneData(sceneData);
        setIsLoading(false);
        return;
      } catch (error) {
        console.error(`시도 ${retryCount + 1} 실패:`, error);
        retryCount++;
        
        if (retryCount === maxRetries) {
          setCurrentSceneData({
            description: "죄송합니다. 시나리오를 불러오는데 실패했습니다. 잠시 후 다시 시도해주세요.",
            choices: []
          });
          setIsLoading(false);
        } else {
          await new Promise(resolve => setTimeout(resolve, 1000 * retryCount));
        }
      }
    }
  };

  const handleChoice = async (choiceIndex) => {
    const selectedChoiceData = currentSceneData.choices[choiceIndex];
    setSelectedChoice(choiceIndex);
    
    if (selectedChoiceData.nextStep === -1) {
      setTimeout(() => {
        setSelectedScene(null);
        setSelectedChoice(null);
        setCurrentSceneData(null);
      }, 3000);
    } else {
      setTimeout(async () => {
        setSelectedChoice(null);
        await getNextSceneData(selectedScene, selectedChoiceData.nextStep, selectedChoiceData);
      }, 3000);
    }
  };

  const handleSceneSelect = async (eventId) => {
    setSelectedScene(eventId);
    await getNextSceneData(eventId, 0);
  };

  const currentEvent = getEventData(selectedScene);

  return (
    <div className="game-container">
      <MenuComponent onLanguageChange={onLanguageChange} />
      <div className="game-content">
        {!selectedScene ? (
          <>
            <div className="scene-header">
              <h1>독립운동 선택</h1>
              <p>참여하고 싶은 독립운동을 선택하시오</p>
            </div>
            <div className="scene-selection">
              {Object.entries(historicalEvents).map(([key, event]) => (
                <div 
                  key={event.id}
                  className="scene-option" 
                  data-scene={event.id} 
                  onClick={() => handleSceneSelect(key)}
                >
                  <h2>{event.title}</h2>
                  <p>{event.year}년</p>
                </div>
              ))}
            </div>
          </>
        ) : currentEvent ? (
          <>
            <div className="scene-header">
              <h1>{currentEvent.title}</h1>
              <div className="scene-info">
                <span className="date">{currentEvent.year}년</span>
              </div>
            </div>

            {isLoading ? (
              <div className="loading">
                <div className="loading-spinner"></div>
                <p>시나리오를 생성하고 있습니다...</p>
              </div>
            ) : currentSceneData && (
              <>
                <div className="scene-description">
                  <p>{currentSceneData.description}</p>
                </div>

                {selectedChoice !== null ? (
                  <div className="choice-result">
                    <p className="choice-text">{currentSceneData.choices[selectedChoice].text}</p>
                    {currentSceneData.result && (
                      <>
                        <p className="result-text">{currentSceneData.result.text}</p>
                        <p className="result-impact">{currentSceneData.result.result}</p>
                      </>
                    )}
                  </div>
                ) : (
                  <div className="choices-container">
                    {currentSceneData.choices.map((choice, index) => (
                      <button
                        key={index}
                        className="choice-button"
                        onClick={() => handleChoice(index)}
                      >
                        {choice.text}
                      </button>
                    ))}
                  </div>
                )}
              </>
            )}
          </>
        ) : (
          <div className="error-message">
            <p>선택한 이벤트를 찾을 수 없습니다.</p>
            <button className="game-back-button" onClick={() => setSelectedScene(null)}>
              돌아가기
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default IndependentGame; 