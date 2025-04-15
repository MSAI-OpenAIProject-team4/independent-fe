// src/pages/Chat.js
import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/Chat.css";
import axios from "axios";
import Papa from "papaparse";
import MenuComponent from "../components/MenuComponent";
import { translateText } from "../translations/translator";

function Chat({ language, onLanguageChange }) {
  const navigate = useNavigate();
  const messagesEndRef = useRef(null);
  const [messages, setMessages] = useState([
    {
      text: "안녕하시오! 만나뵙게 되어 반갑소. 이곳은 독립운동가와 대화할 수 있는 공간이오. 닮은꼴 독립운동가에서 나온 인물, 혹은 궁금한 독립운동가의 성함을 작성하여 주시오.",
      isUser: false,
    },
  ]);
  const [translatedMessages, setTranslatedMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isTTSEnabled, setIsTTSEnabled] = useState(true);
  const [currentAudio, setCurrentAudio] = useState(null);
  const [captions, setCaptions] = useState([]);
  const [knowledgeBase, setKnowledgeBase] = useState([]);

  const endpoint = process.env.REACT_APP_AZURE_OPENAI_ENDPOINT;
  const apiKey = process.env.REACT_APP_AZURE_OPENAI_API_KEY;
  const apiVersion = process.env.REACT_APP_AZURE_OPENAI_API_VERSION;
  const deploymentName = process.env.REACT_APP_AZURE_OPENAI_DEPLOYMENT_NAME;
  const speechKey = process.env.REACT_APP_AZURE_SPEECH_KEY;
  const speechRegion = process.env.REACT_APP_AZURE_SPEECH_REGION;

  // 일본어 텍스트에 포함된 숫자를 SSML <say-as> 태그로 감싸주는 헬퍼 함수
  const processTextForTTS = (text, language) => {
    if (language === "jp") {
      // 단어 경계 내 숫자를 찾아서 say-as 태그로 감쌈 (cardinal)
      return text.replace(/\b\d+\b/g, (match) => {
        return `<say-as interpret-as="cardinal" language="ja-JP">${match}</say-as>`;
      });
    }
    return text;
  };

  useEffect(() => {
    const translateMessages = async () => {
      if (language === "ko") {
        setTranslatedMessages(messages);
        return;
      }
      try {
        const translated = await Promise.all(
          messages.map(async (msg) => {
            if (msg.isUser) return msg;
            const translatedText = await translateText(msg.text, language);
            return { ...msg, text: translatedText };
          })
        );
        setTranslatedMessages(translated);
      } catch (error) {
        console.error("메시지 번역 실패:", error);
        setTranslatedMessages(messages);
      }
    };
    translateMessages();
  }, [messages, language]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [translatedMessages]);

  useEffect(() => {
    if (
      translatedMessages.length > 0 &&
      !translatedMessages[translatedMessages.length - 1].isUser
    ) {
      const latestTranslated =
        translatedMessages[translatedMessages.length - 1];
      if (currentAudio) {
        currentAudio.pause();
        currentAudio.currentTime = 0;
        setCurrentAudio(null);
      }
      speakTextWithAzureTTS(latestTranslated.text);
    }
  }, [translatedMessages]);

  useEffect(() => {
    const loadData = async () => {
      try {
        const response = await fetch("/data/doklip.csv");
        if (!response.ok)
          throw new Error(`HTTP error! status: ${response.status}`);
        const csvText = await response.text();

        Papa.parse(csvText, {
          header: true,
          skipEmptyLines: true,
          encoding: "UTF-8",
          complete: (results) => {
            const knowledge = results.data
              .filter((row) => row.id && row.content)
              .map((row) => ({
                id: row.id,
                name: row.name || "",
                hanjaName: row.nameHanja || "",
                birthplace: row.addressBirth || "",
                movement: row.movementFamily || "",
                award: row.orders || "",
                summary: row.activities || "",
                content: row.content || "",
                reference: row.references || "",
                imageUrl: row.image_url || "",
                searchText:
                  `${row.name} ${row.nameHanja} ${row.movementFamily} ${row.addressBirth} ${row.activities} ${row.content}`.toLowerCase(),
              }));
            setKnowledgeBase(knowledge);
          },
          error: (error) => {
            console.error("CSV 파싱 오류:", error);
          },
        });
      } catch (error) {
        console.error("CSV 파일 로드 중 오류:", error);
      }
    };
    loadData();
  }, []);

  const searchRelevantContent = (query) => {
    if (!query || !knowledgeBase.length) return [];

    const loweredQuery = query.toLowerCase();

    const calculateRelevance = (item) => {
      let score = 0;
      if (item.name?.toLowerCase().includes(loweredQuery)) score += 10;
      if (item.hanjaName?.toLowerCase().includes(loweredQuery)) score += 8;
      if (item.movement?.toLowerCase().includes(loweredQuery)) score += 6;
      if (item.birthplace?.toLowerCase().includes(loweredQuery)) score += 4;
      if (item.summary?.toLowerCase().includes(loweredQuery)) score += 3;
      if (item.content?.toLowerCase().includes(loweredQuery)) score += 2;
      if (item.searchText.includes(loweredQuery)) score += 1;
      return score;
    };

    return knowledgeBase
      .map((item) => ({ ...item, relevance: calculateRelevance(item) }))
      .filter((item) => item.relevance > 0)
      .sort((a, b) => b.relevance - a.relevance)
      .slice(0, 3);
  };

  const speakTextWithAzureTTS = async (text) => {
    if (!isTTSEnabled || !speechKey || !speechRegion) return;

    if (currentAudio) {
      currentAudio.pause();
      currentAudio.currentTime = 0;
    }

    // 언어 설정에 따라 일본어인 경우 숫자를 전처리합니다.
    const processedText = processTextForTTS(text.trim(), language);

    const url = `https://${speechRegion}.tts.speech.microsoft.com/cognitiveservices/v1`;
    const ssml = `<speak version="1.0" xml:lang="${
      language === "ko" ? "ko-KR" : language === "jp" ? "ja-JP" : "en-US"
    }">
      <voice name="${
        language === "ko"
          ? "ko-KR-SunHiNeural"
          : language === "jp"
          ? "ja-JP-NanamiNeural"
          : "en-US-JennyNeural"
      }">${processedText}</voice>
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

      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);
      setCurrentAudio(audio);
      audio.play();
    } catch (error) {
      console.error("TTS 에러:", error);
    }
  };

  const handleTTSButtonClick = () => {
    setIsTTSEnabled((prev) => {
      const next = !prev;
      if (!next && currentAudio) {
        currentAudio.pause();
      } else if (next && currentAudio?.paused) {
        currentAudio.play().catch((e) => console.error("오디오 재생 오류:", e));
      }
      return next;
    });
  };

  const handleBackClick = () => {
    navigate("/");
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (inputMessage.trim() === "") return;

    const userMessage = { text: inputMessage, isUser: true };
    setMessages((prev) => [...prev, userMessage]);
    setInputMessage("");

    const relevantDocs = searchRelevantContent(inputMessage);
    const contextText = relevantDocs
      .map(
        (doc, idx) =>
          `참고자료 ${idx + 1}: ${doc.name}(${doc.hanjaName}) - ${
            doc.movement
          } - ${doc.content}`
      )
      .join("\n");

    const system_prompt = `
      당신은 "꼬리에 꼬리를 무는 형식의 스타일의 이야기 전달자"입니다.  
      사용자가 입력한 독립운동가의 정보를 바탕으로,  
      감정적으로 공감할 수 있는 대화형 스토리텔링을 제공합니다.
      아래에 나와 있는 '단계별 규칙'에 따라 스토리를 유도 해야 합니다.
      각 단계별로 별도로 질문하여 다음 단계로 가도록 답변을 유도 해야 합니다
      자연스러운 대화를 위해 단계명을 사용자에게 명시하지 않아야 합니다.
      처음에 입력 받은 인물에 대한 citation을 인물 설정이 바뀌기 전까지 대화 하는 내내 return 할 것.
      
      당신의 목적은 다음과 같습니다:
      
      1. 사용자가 인물의 삶에 몰입하도록 유도하고,
      2. 각 이야기 구성 단계 사이마다 사용자에게 직접 질문을 던지고,
      3. 사용자의 답변을 듣고 반응하며 이야기를 이어가는 것입니다.
      
      ---
      
      이야기는 아래 5단계로 구성되며, 각 단계마다 사용자와 자연스러운 대화를 주고받아야 합니다.
      
      [단계별 규칙]
      
      ---
      
      1. 프롤로그 (30~50자) 
      - 진입 전, 감정 공감형 질문을 사용자에게 던지고 응답을 기다리세요.  
        예: “사랑하는 사람을 지키기 위해 모든 걸 내려놔 본 적 있으세요?”  
      - 사용자의 반응에 감정적으로 공감하고,  
      - 궁금증을 자극하는 한 문장으로 프롤로그를 제시하세요.
      
      ---
      
      2. 기 (사건 배경 설명)
      - 인물의 시대적 상황과 배경을 전달합니다.  
      - 전달 후, 사용자가 그 시대였다면 어떤 선택을 했을지 질문하세요.
      
      ---
      
      3. 승 (사건 전개) 
      - 인물이 실제로 어떤 행동을 했는지 서술합니다.  
      - 중간에 질문을 넣어 몰입을 유도하세요.
      
      ---
      
      4. 전 (반전/진실) 
      - 감춰졌던 진실, 고통스러운 사실, 감동적인 반전을 전합니다.  
      - 전달 후, 사용자의 감정 반응을 물어보세요.
      
      ---
      
      5. 결 (여운과 마무리)  
      - 인물의 마지막 여정과 우리가 왜 이 이야기를 기억해야 하는지를 전합니다.  
      - 마지막으로, 사용자가 스스로 질문을 받아들이도록 유도하세요.
      
      ---
      
      기타 규칙
      
      - 반드시 아래 제공된 문서들만 참고해서 대답하세요.
      - 문서에 없는 정보는 "문서에 해당 내용이 없습니다."라고 말할 것.
      - 추론하거나 외부 지식을 추가하지 말 것.
      - 질문 내용이 인물, 활동, 상훈, 단체, 관련 인물에 관한 경우 해당 문서 필드를 찾아서 설명할 것.
      `;

    const promptMessages = [
      {
        role: "system",
        content:
          "너는 대한민국 독립운동가야. 독립운동가의 말투로 옛날 한국어(하오체)로 대답해주시오. 단계별로 질문을 하여 대답을 유도할거야." +
          system_prompt +
          "1000자 이내로 요약하여 핵심만 알려주도록 하시오.  주의사항:\n" +
          "1. 제공된 참고자료의 내용만을 사용하여 대답할 것\n" +
          "2. 참고자료에 없는 내용은 생성하지 말 것\n" +
          "3. 참고자료에 있는 사실만을 기반으로 대화할 것\n" +
          "4. 확실하지 않은 부분은 '그 부분에 대해서는 정확히 알지 못하오'라고 대답할 것\n\n",
      },
      ...messages.map((m) => ({
        role: m.isUser ? "user" : "assistant",
        content: m.text,
      })),
      { role: "user", content: inputMessage },
    ];

    try {
      const response = await axios.post(
        `${endpoint}/openai/deployments/${deploymentName}/chat/completions?api-version=${apiVersion}`,
        {
          messages: promptMessages,
          temperature: 0.7,
          max_tokens: 500,
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

      const formattedCaptions = relevantDocs.map((doc, idx) => ({
        title: `참고 ${idx + 1}`,
        content: `${doc.name}(${doc.hanjaName}) - ${doc.movement}\n${doc.content}`,
      }));
      setCaptions(formattedCaptions);
    } catch (error) {
      console.error("OpenAI 오류:", error);
      setMessages((prev) => [
        ...prev,
        { text: "오류가 발생했소. 다시 시도해보시오.", isUser: false },
      ]);
    }
  };

  return (
    <div className="chat">
      <MenuComponent onLanguageChange={onLanguageChange} />
      <button className="back-button" onClick={handleBackClick}>
        뒤로가기
      </button>
      <div className="chat-container">
        <div className="messages">
          {translatedMessages.map((message, index) => (
            <div
              key={index}
              className={`message ${message.isUser ? "user" : "bot"}`}
            >
              {message.text}
            </div>
          ))}
          <div ref={messagesEndRef} />
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
      <button
        className={`tts-button ${isTTSEnabled ? "active" : ""}`}
        onClick={handleTTSButtonClick}
        title={isTTSEnabled ? "TTS 끄기" : "TTS 켜기"}
      >
        {isTTSEnabled ? "🔊" : "🔇"}
      </button>
      <div className="caption-container">
        {captions.map((caption, index) => (
          <div key={index} className="caption-item">
            <div className="caption-title">{caption.title}</div>
            <div className="caption-content">{caption.content}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Chat;
