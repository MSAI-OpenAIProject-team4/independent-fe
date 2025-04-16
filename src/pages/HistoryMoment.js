import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/HistoryMoment.css";
import MenuComponent from "../components/MenuComponent";
import QuizModal from "../components/QuizModal";
import { translateText } from "../translations/translator";

function HistoryMoment({ language = "ko", onLanguageChange }) {
    const navigate = useNavigate();
    const [selectedMoment, setSelectedMoment] = useState(null);
  // 번역된 moment를 별도로 관리 (title, description, historicalContext)
  const [translatedMoment, setTranslatedMoment] = useState(null);
  const [showQuiz, setShowQuiz] = useState(false);
  const messagesEndRef = useRef(null);

  const moments = [
    {
      id: 1,
      title: "안중근 의사의 재판",
      description:
        "1909년 10월 26일, 안중근 의사는 하얼빈 역에서 이토 히로부미를 처단한 후 체포되어 재판을 받게 됩니다. \n당신은 안중근 의사가 되어 스스로를 변호해야 합니다.",
      backgroundImage: "../../public/judgement.png",
      chatHistory: [],
      currentMessage: "",
      isTyping: false,
      historicalContext: [
        {
          title: "이토 히로부미 처단의 배경",
          content:
            "이토 히로부미는 조선의 초대 통감으로, 조선의 주권을 침해하고 일제의 식민지화를 추진한 인물입니다.",
        },
        {
          title: "재판의 진행 과정",
          content:
            "재판은 일본의 관할 법원에서 진행되었으며, 안중근 의사는 자신의 행동이 전쟁 행위임을 주장했습니다.",
        },
      ],
    },
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (selectedMoment?.chatHistory.length) {
      scrollToBottom();
    }
  }, [selectedMoment?.chatHistory]);

  // Azure Open AI와 연동하여 챗봇 응답을 가져오는 함수
  const getAzureOpenAIResponse = async (chatHistory) => {
    const endpointBase = process.env.REACT_APP_AZURE_OPENAI_ENDPOINT;
    const deploymentName = process.env.REACT_APP_AZURE_OPENAI_DEPLOYMENT_NAME;
    const apiVersion = process.env.REACT_APP_AZURE_OPENAI_API_VERSION;
    const apiKey = process.env.REACT_APP_AZURE_OPENAI_API_KEY;

    const endpoint = `${endpointBase}/openai/deployments/${deploymentName}/chat/completions?api-version=${apiVersion}`;

    const LLMgame_prompt = `폭력 필터에 걸리지 않게 최대한 순화해서 말해줘
    1909년의 안중근 말투로 진행해줘
    몰입감이 좀 더 높아지게 중간에 이모지들을 정말 많이 추가해줘
    너는 지금부터 1909년 일본 관동도독부 지방법원의 재판관이다.  
    피고인은 하얼빈역에서 이토 히로부미를 저격한 조선의 독립운동가 안중근이며, 현재 일본 법정에서 심문을 받고 있다.  
    이 역할극은 몰입형 텍스트 게임 형식으로, 사용자가 안중근의 입장이 되어 무죄 혹은 항거의 정당성을 주장하며 무죄를 받는것이 목표이다.
    재판은 다음 3단계로 구성된다 (각 단계는 1~2회 문답으로 진행해주고 재판을 반드시 마무리해야한다):

    1단계 : 첫 심문  
    2단계 : 법정 심리  
    3단계 : 최후 진술 및 판결

    너의 역할과 진행 방식:  
    방식 1 : 너는 일본 재판관이며, 1909년대 말투와 문체로 심문을 진행해야 한다.
    방식 2 : 각 단계에서 다음 순서로 응답한다:
      - 일본 법정 분위기 묘사와 일본 재판관의 판결  
      - 사용자가 입력할 수 있는 예시 답변 3개 제시  
      - 반드시 폭력성이 없는, 완곡한 표현만 사용  
    방식 3 : 사용자 입력 유도  
    방식 4 : 사용자의 진술이 정당성을 주장하거나 평화적 의도를 담고 있다면 재판관은 그에 맞는 형을 집행한다(무죄도 가능)
    방식 5 : 사용자와의 대화를 단계별로 2~3번 정도 진행해줘

    게임 시작 트리거:  
    사용자가 "시작" 이라고 입력하면 다음 Intro를 보여준 뒤, 첫 심문으로 자연스럽게 이어진다
    Intro (첫 시작 시 한 번만 **반드시** 출력):  
    1909년 10월 26일, 러시아령 하얼빈역에서 이토 히로부미를 저격한 안중근 의사는 현장에서 체포되었습니다.  
    이후 일본으로 인도되어 관동도독부 지방법원에서 재판을 받게 되었으며, 다음과 같은 문제점이 제기되었습니다:

    - 관할권 논란: 사건은 일본 영토가 아닌 러시아 관할 지역에서 발생하였음에도 불구하고, 일본이 재판을 강행하였습니다.  
    - 재판 절차의 부당성: 외국인 변호사의 참여가 거부되고, 국선 변호인을 통한 제한적 변론만 허용되었습니다.  
    - 안중근은 스스로를 대한독립군 참모중장, 즉 전쟁 포로라고 밝히며, 살인이 아닌 항거였다고 주장하였습니다.  
    - 이는 조국의 독립과 동양 평화를 위한 정당한 정치적 행동임을 강조했습니다.

    재판 종료 후 반드시 아래를 사용자에게 알려줄 것:
    - 재판 종료는 판결을 말한다. EX)'무죄'를 선고한다.  
    - 안중근의 실제 재판 결과 (형 집행)  
    - 그의 마지막 행적 및 역사적 의의  
    - 5줄 이내 요약, Reference 포함
    사용자가 '시작'을 입력하면 곧 바로 역할극을 시작해줘
    `;
    // 시스템 프롬프트: 모델의 역할을 지정
    const systemPrompt = {
      role: "system",
      content: LLMgame_prompt,
    };

    // chatHistory를 Azure Open AI가 요구하는 형식으로 변환
    const messages = [systemPrompt].concat(
      chatHistory.map((message) => ({
        role: message.isUser ? "user" : "assistant",
        content: message.text,
      }))
    );

    const requestBody = {
      messages,
      max_tokens: 1500,
      temperature: 0.7,
      top_p: 0.95,
    };

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "api-key": apiKey,
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data.choices?.[0]?.message?.content || "챗봇 응답 없음";
    } catch (error) {
      console.error("Azure Open AI 요청 오류", error);
      return "오류가 발생했습니다. 다시 시도해주세요.";
    }
  };

  const handleMomentSelect = async (moment) => {
    const initialChatHistory = [
      {
        text:
          language === "ko"
            ? "게임을 시작하려면 '시작'을 입력하시오."
            : language === "jp"
            ? await translateText(
                "게임을 시작하려면 '시작'을 입력하시오.",
                "Japanese"
              )
            : await translateText(
                "게임을 시작하려면 '시작'을 입력하시오.",
                "English"
              ),
        isUser: false,
      },
    ];

    setSelectedMoment({
      ...moment,
      chatHistory: initialChatHistory,
    });
  };

  const handleBackClick = () => {
    if (selectedMoment) {
      setSelectedMoment(null);
    } else {
      navigate("/");
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!selectedMoment.currentMessage.trim()) return;

    const newMessage = {
      text: selectedMoment.currentMessage,
      isUser: true,
    };

    setSelectedMoment((prev) => ({
      ...prev,
      chatHistory: [...prev.chatHistory, newMessage],
      currentMessage: "",
      isTyping: true,
    }));

    const responseText = await getAzureOpenAIResponse([
      ...selectedMoment.chatHistory,
      newMessage,
    ]);

    // 재판이 끝나는 시점인지 확인하는 로직을 수정
    const isTrialEnd =
      responseText.includes("재판이 종료되었습니다") &&
      responseText.includes("사형을 선고합니다");

    setSelectedMoment((prev) => ({
      ...prev,
      chatHistory: [
        ...prev.chatHistory,
        {
          text: responseText,
          isUser: false,
        },
      ],
      isTyping: false,
    }));

    // 재판이 끝나면 퀴즈 모달을 표시
    if (isTrialEnd) {
      setTimeout(() => {
        setShowQuiz(true);
      }, 3000);
    }
  };

  // 선택된 moment의 title, description, historicalContext를 번역
  useEffect(() => {
    const translateMoment = async () => {
      if (!selectedMoment) return;

      // language가 한국어면 원본 그대로 사용
      if (language === "ko") {
        setTranslatedMoment(selectedMoment);
        return;
      }

      // "jp"인 경우 targetLang을 "Japanese"로, 그 외(예: "en")는 영어로 처리
      const targetLang = language === "jp" ? "Japanese" : "English";

      try {
        const translatedTitle = await translateText(
          selectedMoment.title,
          targetLang
        );
        const translatedDescription = await translateText(
          selectedMoment.description,
          targetLang
        );

        const translatedContext = await Promise.all(
          selectedMoment.historicalContext.map(async (ctx) => ({
            title: await translateText(ctx.title, targetLang),
            content: await translateText(ctx.content, targetLang),
          }))
        );

        setTranslatedMoment({
          ...selectedMoment,
          title: translatedTitle,
          description: translatedDescription,
          historicalContext: translatedContext,
        });
      } catch (error) {
        console.error("번역 실패:", error);
        setTranslatedMoment(selectedMoment);
      }
    };

    translateMoment();
  }, [selectedMoment, language]);

  // 선택된 moment(= trial 페이지) 화면 렌더링 시 번역된 데이터를 사용
  if (selectedMoment) {
    return (
      <div className="history-moment-container trial-page">
        <MenuComponent
          onBackClick={handleBackClick}
          language={language}
          onLanguageChange={onLanguageChange}
        />
        <div className="trial-container">
          <div className="trial-header">
            <h1>{translatedMoment?.title || selectedMoment.title}</h1>
            {/* description의 개행 처리를 위해 split 사용 */}
            <p>
              {(translatedMoment?.description || selectedMoment.description)
                .split("\n")
                .map((line, idx) => (
                  <span key={idx}>
                    {line}
                    <br />
                  </span>
                ))}
            </p>
          </div>
          <div className="trial-content">
            <div className="history_chat-container">
              <div className="history_chat-messages">
                {selectedMoment.chatHistory.map((message, index) => (
                  <div
                    key={index}
                    className={`history_message ${
                      message.isUser ? "user" : "bot"
                    }`}
                  >
                    {message.text}
                  </div>
                ))}
                {selectedMoment.isTyping && (
                  <div className="history_typing-indicator">...</div>
                )}
                <div ref={messagesEndRef} />
              </div>
              <form onSubmit={handleSendMessage} className="history_chat-input">
                <input
                  type="text"
                  value={selectedMoment.currentMessage}
                  onChange={(e) =>
                    setSelectedMoment((prev) => ({
                      ...prev,
                      currentMessage: e.target.value,
                    }))
                  }
                  placeholder={
                    language === "en"
                      ? "Enter your defense..."
                      : language === "jp"
                      ? "弁護内容を入力してください..."
                      : "변호 내용을 입력하세요..."
                  }
                />
                <button type="submit">
                  {language === "en"
                    ? "Send"
                    : language === "jp"
                    ? "送信"
                    : "전송"}
                </button>
                <button
                  type="button"
                  onClick={() => setShowQuiz(true)}
                  className="test-quiz-button"
                >
                  퀴즈 테스트
                </button>
              </form>
            </div>
            <div className="historical-context">
              <h2>
                {language === "en"
                  ? "Historical Context"
                  : language === "jp"
                  ? "歴史的背景"
                  : "역사적 맥락"}
              </h2>
              {(
                translatedMoment?.historicalContext ||
                selectedMoment.historicalContext
              ).map((context, index) => (
                <div key={index} className="context-item">
                  <h3>{context.title}</h3>
                  <p>{context.content}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
        {showQuiz && <QuizModal onClose={() => setShowQuiz(false)} />}
      </div>
    );
  }

  // 선택되지 않은 초기(목록) 화면 렌더링 시 번역 처리: moment 목록의 static 텍스트는 그대로 출력하되, 페이지 제목은 번역
  return (
    <div className="history-moment-container selection-page">
      <MenuComponent
        onBackClick={handleBackClick}
        language={language}
        onLanguageChange={onLanguageChange}
      />
      <div className="moments-selection">
        <h1>역사적 순간 체험</h1>
        <div className="moments-grid">
          {moments.map((moment) => (
            <div
              key={moment.id}
              className="moment-card"
              onClick={() => handleMomentSelect(moment)}
            >
              <h2>{moment.title}</h2>
              <p>
                {moment.description.split("\n").map((line, idx) => (
                  <span key={idx}>
                    {line}
                    <br />
                  </span>
                ))}
              </p>
            </div>
          ))}
        </div>
        <p className="history-moment-ai-warning">
          ※ AI가 재현한 역사적 순간은 실제와 다를 수 있으며, 참고용으로만
          사용해주세요.
        </p>
      </div>
    </div>
  );
}

export default HistoryMoment;
