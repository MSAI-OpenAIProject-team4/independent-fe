import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/HistoryMoment.css";
import MenuComponent from "../components/MenuComponent";
import { translateText } from "../translations/translator";

function HistoryMoment({ language = "ko", onLanguageChange }) {
  const navigate = useNavigate();
  const [selectedMoment, setSelectedMoment] = useState(null);
  const [translatedMoment, setTranslatedMoment] = useState(null);

  const [moments, setMoments] = useState([
    {
      id: 1,
      title: "안중근 의사의 재판",
      description:
        "1909년 10월 26일, 안중근 의사는 하얼빈 역에서 이토 히로부미를 처단한 후 체포되어 재판을 받게 됩니다. \n 당신은 안중근 의사가 되어 스스로를 변호해야 합니다.",
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
  ]);

  const getAzureOpenAIResponse = async (chatHistory) => {
    const endpointBase = process.env.REACT_APP_AZURE_OPENAI_ENDPOINT;
    const deploymentName = process.env.REACT_APP_AZURE_OPENAI_DEPLOYMENT_NAME;
    const apiVersion = process.env.REACT_APP_AZURE_OPENAI_API_VERSION;
    const apiKey = process.env.REACT_APP_AZURE_OPENAI_API_KEY;

    const endpoint = `${endpointBase}/openai/deployments/${deploymentName}/chat/completions?api-version=${apiVersion}`;

    const systemPrompt = {
      role: "system",
      content:
        "당신은 역사 전문가 역할을 수행하며, 사용자가 입력하는 질문에 대해 전문적이고 정확한 답변을 제공합니다.",
    };

    const messages = [systemPrompt].concat(
      chatHistory.map((message) => ({
        role: message.isUser ? "user" : "assistant",
        content: message.text,
      }))
    );

    const requestBody = {
      messages,
      max_tokens: 10000,
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
  };

  useEffect(() => {
    const translateMoment = async () => {
      if (!selectedMoment) return;

      if (language === "ko") {
        setTranslatedMoment(selectedMoment);
        return;
      }

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
            <p>{translatedMoment?.description || selectedMoment.description}</p>
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
                  placeholder="변호 내용을 입력하세요..."
                />
                <button type="submit">전송</button>
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
      </div>
    );
  }

  return (
    <div className="history-moment-container selection-page">
      <MenuComponent
        onBackClick={handleBackClick}
        language={language}
        onLanguageChange={onLanguageChange}
      />
      <div className="moments-selection">
        <h1>
          {language === "en"
            ? "Moments in History"
            : language === "jp"
            ? "歴史の瞬間"
            : "역사의 순간"}
        </h1>
        <div className="moments-grid">
          {moments.map((moment) => (
            <div
              key={moment.id}
              className="moment-card"
              onClick={() => handleMomentSelect(moment)}
            >
              <h2>{moment.title}</h2>
              <p>{moment.description}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default HistoryMoment;
