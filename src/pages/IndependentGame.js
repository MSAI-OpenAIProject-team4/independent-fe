import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/IndependentGame.css';
import MenuComponent from '../components/MenuComponent';

function IndependentGame({ language, onLanguageChange }) {
  const navigate = useNavigate();
  const [selectedScene, setSelectedScene] = useState(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedChoice, setSelectedChoice] = useState(null);
  
  const scenes = {
    harlbin: {
      title: "하얼빈 의거",
      date: "1909년 10월 26일",
      location: "하얼빈역",
      steps: [
        {
          description: "쌀쌀한 공기 속에서 당신은 이토 히로부미가 탄 열차가 도착한다는 정보를 입수했습니다. 러시아 군복을 입은 안중근 의사와 동지들이 플랫폼에서 대기하고 있습니다. 열차가 도착하고 이토 히로부미가 내립니다.",
          choices: [
            {
              text: "이토 히로부미에게 가까이 접근하여 즉시 거사를 실행한다.",
              result: "당신은 이토 히로부미에게 다가가 권총을 발사합니다. 총성이 울리고 이토 히로부미가 쓰러집니다. 주변이 혼란스러워지고 러시아 경찰들이 달려옵니다.",
              nextStep: 1
            },
            {
              text: "러시아 육군 장교들과 인사를 나누는 척하며 더 적절한 타이밍을 기다린다.",
              result: "당신은 러시아 장교들과 인사를 나누며 자연스럽게 이토 히로부미의 주변으로 이동합니다. 이토 히로부미가 플랫폼을 걸어가고 있습니다.",
              nextStep: 2
            },
            {
              text: "동지들에게 신호를 보내 함께 움직일 준비를 한다.",
              result: "당신은 미리 약속된 신호를 보냅니다. 동지들이 각자의 위치로 이동하고, 이토 히로부미의 경호원들이 긴장하기 시작합니다.",
              nextStep: 3
            },
            {
              text: "잠시 망설이며 이토 히로부미의 동선을 더 지켜본다.",
              result: "당신은 이토 히로부미의 이동 경로를 관찰합니다. 그가 플랫폼을 걸어가며 러시아 장교들과 인사를 나누는 모습이 보입니다.",
              nextStep: 4
            }
          ]
        },
        {
          description: "이토 히로부미를 처단한 후, 당신은 체포되어 재판정에 끌려갑니다. 일본 검사가 당신에게 질문을 합니다.",
          choices: [
            {
              text: "자신의 행동이 정의로운 것이었다고 주장한다.",
              result: "당신은 이토 히로부미가 한국의 주권을 침탈한 원흉이라고 주장하며, 자신의 행동이 정의로운 것이었다고 말합니다.",
              nextStep: 5
            },
            {
              text: "침묵을 지키고 변호인의 말만을 듣는다.",
              result: "당신은 침묵을 지키며 변호인의 변론을 듣습니다. 변호인은 당신의 행동이 정치적 동기에서 비롯된 것이라고 주장합니다.",
              nextStep: 5
            }
          ]
        },
        {
          description: "이토 히로부미가 플랫폼을 걸어가고 있습니다. 주변에는 러시아 장교들과 경호원들이 있습니다.",
          choices: [
            {
              text: "이토 히로부미가 러시아 장교와 악수를 나누는 순간을 노린다.",
              result: "이토 히로부미가 러시아 장교와 악수를 나누는 순간, 당신은 권총을 뽑아들고 발사합니다. 총성이 울리고 이토 히로부미가 쓰러집니다.",
              nextStep: 1
            },
            {
              text: "더 가까운 거리에서 기회를 노린다.",
              result: "당신은 이토 히로부미의 이동 경로를 따라가며 더 가까운 거리에서 기회를 노립니다. 이토 히로부미가 당신 쪽으로 다가옵니다.",
              nextStep: 4
            }
          ]
        },
        {
          description: "동지들이 각자의 위치로 이동했습니다. 이토 히로부미가 플랫폼을 걸어가고 있습니다.",
          choices: [
            {
              text: "동시에 거사를 실행한다.",
              result: "당신은 신호를 보내 동시에 거사를 실행합니다. 여러 방향에서 총성이 울리고, 이토 히로부미가 쓰러집니다.",
              nextStep: 1
            },
            {
              text: "이토 히로부미가 혼자 있는 순간을 기다린다.",
              result: "당신은 이토 히로부미가 경호원들과 떨어져 혼자 있는 순간을 기다립니다. 이토 히로부미가 잠시 혼자 서있는 모습이 보입니다.",
              nextStep: 4
            }
          ]
        },
        {
          description: "이토 히로부미가 당신 쪽으로 다가옵니다. 주변에는 러시아 장교들이 있지만, 이토 히로부미와의 거리가 가까워졌습니다.",
          choices: [
            {
              text: "권총을 뽑아들고 발사한다.",
              result: "당신은 권총을 뽑아들고 이토 히로부미를 향해 발사합니다. 총성이 울리고 이토 히로부미가 쓰러집니다.",
              nextStep: 1
            },
            {
              text: "더 가까운 거리에서 기회를 노린다.",
              result: "당신은 이토 히로부미가 더 가까이 오기를 기다립니다. 이토 히로부미가 당신 앞에서 멈춰 서고, 주변을 둘러봅니다.",
              nextStep: 4
            }
          ]
        },
        {
          description: "재판이 끝나고 당신은 사형 선고를 받습니다. 옥중에서 당신은 자신의 행동이 한국의 독립에 기여했다고 생각합니다.",
          choices: [
            {
              text: "자신의 행동이 가치 있었다고 생각하며 평화롭게 마지막을 맞이한다.",
              result: "당신은 자신의 행동이 한국의 독립에 기여했다고 생각하며 평화롭게 마지막을 맞이합니다. 후대에 안중근 의사로 기억됩니다.",
              nextStep: -1
            },
            {
              text: "다음 세대에게 독립 정신을 전달하기 위해 옥중에서 글을 쓴다.",
              result: "당신은 옥중에서 '동양평화론'을 집필하며 다음 세대에게 독립 정신을 전달합니다. 이 글은 후대에 큰 영향을 미칩니다.",
              nextStep: -1
            }
          ]
        }
      ],
      historicalContext: "안중근 의사는 1909년 10월 26일, 한국 침략의 원흉인 이토 히로부미를 처단하기 위해 하얼빈역에서 의거를 감행했습니다. 이 의거는 한국의 주권을 침탈한 일제에 대한 강력한 항거였으며, 세계에 한국의 독립 의지를 알린 중요한 사건이었습니다."
    },
    marchFirst: {
      title: "3·1 운동",
      date: "1919년 3월 1일",
      location: "서울 태화관",
      steps: [
        {
          description: "1919년 3월 1일, 서울 종로의 태화관에서 33인의 대표들이 모여 독립선언서를 발표했습니다. 당신은 이 역사적인 순간에 참여하고 있습니다. 독립선언서가 낭독되고, 만세 소리가 울려 퍼지기 시작합니다.",
          choices: [
            {
              text: "독립선언서를 직접 낭독하여 만세 운동을 시작한다.",
              result: "당신은 독립선언서를 직접 낭독합니다. 목소리가 떨리지만, 당신은 한국의 독립을 선언합니다. 태화관 안에 있던 사람들이 만세를 외치기 시작합니다.",
              nextStep: 1
            },
            {
              text: "태화관 밖으로 나가 시민들에게 독립선언서를 배포한다.",
              result: "당신은 태화관 밖으로 나가 시민들에게 독립선언서를 배포합니다. 시민들은 독립선언서를 읽고 만세를 외치기 시작합니다.",
              nextStep: 2
            },
            {
              text: "다른 대표들과 함께 만세 시위를 이끈다.",
              result: "당신은 다른 대표들과 함께 태화관을 나와 만세 시위를 이끕니다. 시민들이 합류하여 만세 소리가 울려 퍼집니다.",
              nextStep: 3
            },
            {
              text: "독립선언서를 일본 경찰에게 전달하고 체포를 당한다.",
              result: "당신은 독립선언서를 일본 경찰에게 전달합니다. 경찰은 당신을 체포하고, 다른 대표들도 체포됩니다.",
              nextStep: 4
            }
          ]
        },
        {
          description: "당신의 낭독에 이어 태화관 안에 있던 사람들이 만세를 외치기 시작했습니다. 일본 경찰이 태화관으로 달려오고 있습니다.",
          choices: [
            {
              text: "태화관을 나와 시위대와 합류한다.",
              result: "당신은 태화관을 나와 시위대와 합류합니다. 시위대는 종로를 향해 행진하며 만세를 외칩니다.",
              nextStep: 3
            },
            {
              text: "태화관 안에 남아 다른 대표들을 보호한다.",
              result: "당신은 태화관 안에 남아 다른 대표들을 보호합니다. 일본 경찰이 들어오지만, 대표들은 이미 도망쳤습니다.",
              nextStep: 5
            }
          ]
        },
        {
          description: "당신은 태화관 밖에서 시민들에게 독립선언서를 배포하고 있습니다. 시민들은 독립선언서를 읽고 만세를 외치기 시작합니다.",
          choices: [
            {
              text: "시위대를 이끌고 종로로 향한다.",
              result: "당신은 시위대를 이끌고 종로로 향합니다. 시위대는 만세를 외치며 행진합니다.",
              nextStep: 3
            },
            {
              text: "더 많은 시민들에게 독립선언서를 배포한다.",
              result: "당신은 더 많은 시민들에게 독립선언서를 배포합니다. 시민들은 독립선언서를 읽고 만세를 외치기 시작합니다.",
              nextStep: 3
            }
          ]
        },
        {
          description: "당신은 다른 대표들과 함께 만세 시위를 이끌고 있습니다. 시민들이 합류하여 만세 소리가 울려 퍼집니다.",
          choices: [
            {
              text: "시위대를 이끌고 종로로 향한다.",
              result: "당신은 시위대를 이끌고 종로로 향합니다. 시위대는 만세를 외치며 행진합니다.",
              nextStep: 5
            },
            {
              text: "시위대를 여러 방향으로 나누어 확산시킨다.",
              result: "당신은 시위대를 여러 방향으로 나누어 확산시킵니다. 만세 소리가 서울 전역으로 퍼져나갑니다.",
              nextStep: 5
            }
          ]
        },
        {
          description: "당신은 일본 경찰에게 체포되었습니다. 다른 대표들도 체포되어 경찰서로 끌려갑니다.",
          choices: [
            {
              text: "체포를 당했지만 만세를 외친다.",
              result: "당신은 체포를 당했지만 만세를 외칩니다. 다른 체포된 대표들도 만세를 외치기 시작합니다.",
              nextStep: 5
            },
            {
              text: "침묵을 지키고 재판을 기다린다.",
              result: "당신은 침묵을 지키고 재판을 기다립니다. 다른 체포된 대표들도 침묵을 지킵니다.",
              nextStep: 5
            }
          ]
        },
        {
          description: "3·1 운동이 전국으로 확산되었습니다. 당신은 이 운동이 한국의 독립에 기여했다고 생각합니다.",
          choices: [
            {
              text: "이 운동이 한국의 독립에 기여했다고 생각하며 만족한다.",
              result: "당신은 이 운동이 한국의 독립에 기여했다고 생각하며 만족합니다. 후대에 3·1 운동의 주도자로 기억됩니다.",
              nextStep: -1
            },
            {
              text: "다음 단계의 독립운동을 준비한다.",
              result: "당신은 다음 단계의 독립운동을 준비합니다. 이 운동은 대한민국 임시정부 수립의 계기가 됩니다.",
              nextStep: -1
            }
          ]
        }
      ],
      historicalContext: "3·1 운동은 1919년 3월 1일부터 전국적으로 전개된 한국의 대표적인 독립운동입니다. 이 운동은 민족 자결주의의 영향을 받아 전개되었으며, 약 200만 명의 한국인이 참여한 대규모 평화 시위였습니다. 이 운동은 한국의 독립 의지를 세계에 알린 중요한 사건이었으며, 이후 대한민국 임시정부 수립의 계기가 되었습니다."
    }
  };

  const handleChoice = (choiceIndex) => {
    const currentSceneData = scenes[selectedScene];
    const currentStepData = currentSceneData.steps[currentStep];
    const selectedChoiceData = currentStepData.choices[choiceIndex];
    
    setSelectedChoice(choiceIndex);
    
    if (selectedChoiceData.nextStep === -1) {
      // 게임 종료
      setTimeout(() => {
        setSelectedScene(null);
        setCurrentStep(0);
        setSelectedChoice(null);
      }, 3000);
    } else {
      // 다음 단계로 진행
      setTimeout(() => {
        setCurrentStep(selectedChoiceData.nextStep);
        setSelectedChoice(null);
      }, 3000);
    }
  };

  const handleSceneSelect = (sceneKey) => {
    setSelectedScene(sceneKey);
    setCurrentStep(0);
    setSelectedChoice(null);
  };

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
              <div className="scene-option" data-scene="harlbin" onClick={() => handleSceneSelect('harlbin')}>
                <h2>하얼빈 의거</h2>
                <p>1909년 10월 26일, 안중근 의사의 이토 히로부미 처단</p>
              </div>
              <div className="scene-option" data-scene="marchFirst" onClick={() => handleSceneSelect('marchFirst')}>
                <h2>3·1 운동</h2>
                <p>1919년 3월 1일, 전국적인 독립만세 운동</p>
              </div>
            </div>
          </>
        ) : (
          <>
            <div className="scene-header">
              <h1>{scenes[selectedScene].title}</h1>
              <div className="scene-info">
                <span className="date">{scenes[selectedScene].date}</span>
                <span className="location">{scenes[selectedScene].location}</span>
              </div>
            </div>

            <div className="scene-description">
              <p>{scenes[selectedScene].steps[currentStep].description}</p>
            </div>

            {selectedChoice !== null ? (
              <div className="choice-result">
                <p>{scenes[selectedScene].steps[currentStep].choices[selectedChoice].result}</p>
              </div>
            ) : (
              <div className="choices-container">
                {scenes[selectedScene].steps[currentStep].choices.map((choice, index) => (
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

            <div className="historical-context">
              <h3>역사적 배경</h3>
              <p>{scenes[selectedScene].historicalContext}</p>
            </div>
          </>
        )}

        <button 
          className="back-button"
          onClick={() => selectedScene ? setSelectedScene(null) : navigate('/')}
        >
          {selectedScene ? "선택 화면으로" : "메인으로 돌아가기"}
        </button>
      </div>
    </div>
  );
}

export default IndependentGame; 