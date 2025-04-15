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

    // 시스템 프롬프트: 모델의 역할을 지정
    const systemPrompt = {
      role: "system",
      content:
        "당신은 역사 전문가 역할을 수행하며, 사용자가 입력하는 질문에 대해 전문적이고 정확한 답변을 제공합니다.",
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
      max_tokens: 1000,
      temperature: 0.7,
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

  const handleMomentSelect = (moment) => {
    setSelectedMoment(moment);
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
    const isTrialEnd = responseText.includes("재판이 종료되었습니다") && 
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
                <button type="button" onClick={() => setShowQuiz(true)} className="test-quiz-button">
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
        <p className="history-moment-ai-warning">※ AI가 재현한 역사적 순간은 실제와 다를 수 있으며, 참고용으로만 사용해주세요.</p>
      </div>
    </div>
  );
}

export default HistoryMoment;
