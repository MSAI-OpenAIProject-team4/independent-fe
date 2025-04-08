import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/Chat.css";
import axios from "axios";
import MenuComponent from "../components/MenuComponent";

function Chat({ language, onLanguageChange }) {
  const navigate = useNavigate();
  const messagesEndRef = useRef(null);
  const [messages, setMessages] = useState([
    {
      text: "안녕하시오! 나는 독립운동가 000이오. 오늘 어떤 이야기를 나누고 싶소? 독립운동과 관련하여 궁금한 것이 있으면 질문해 주시오",
      isUser: false,
    },
  ]);
  const [inputMessage, setInputMessage] = useState("");
  const [isTTSEnabled, setIsTTSEnabled] = useState(true);
  const [currentAudio, setCurrentAudio] = useState(null);
  const [captions] = useState([]);

  //////////////////////각종 key/////////////////////////

  // Azure OpenAI 설정
  const endpoint = process.env.REACT_APP_AZURE_OPENAI_ENDPOINT;
  const apiKey = process.env.REACT_APP_AZURE_OPENAI_API_KEY;
  const apiVersion = process.env.REACT_APP_AZURE_OPENAI_API_VERSION;
  const deploymentName = process.env.REACT_APP_AZURE_OPENAI_DEPLOYMENT_NAME;

  // AI Search 설정
  const aisearch_endpoint = process.env.REACT_APP_AZURE_AI_SEARCH_ENDPOINT;
  const aisearch_key = process.env.REACT_APP_AZURE_AI_SEARCH_API_KEY;
  const aisearch_indexName = process.env.REACT_APP_AZURE_AI_SEARCH_INDEX;
  const aisearch_semantic = process.env.REACT_APP_AZURE_AI_SEARCH_SEMANTIC;

  // Azure Speech 설정
  const speechKey = process.env.REACT_APP_AZURE_SPEECH_KEY;
  const speechRegion = process.env.REACT_APP_AZURE_SPEECH_REGION;

  // 메시지가 변경될 때마다 스크롤을 최신 메시지로 이동
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // 👇 새 메시지가 추가될 때 마지막 메시지를 읽어주는 useEffect 추가!
  useEffect(() => {
    // 메시지가 비어있지 않고 마지막 메시지가 봇 메시지일 경우
    if (messages.length > 0 && !messages[messages.length - 1].isUser) {
      speakTextWithAzureTTS(messages[messages.length - 1].text);
    }
  }, [messages]);

  // TTS 함수
  const speakTextWithAzureTTS = async (text) => {
    if (!isTTSEnabled || !speechKey || !speechRegion) {
      return;
    }

    // 이전 재생 중인 오디오가 있다면 중단
    if (currentAudio) {
      currentAudio.pause();
      currentAudio.currentTime = 0;
    }

    const url = `https://${speechRegion}.tts.speech.microsoft.com/cognitiveservices/v1`;

    const ssml = `
      <speak version='1.0' xml:lang='ko-KR'>
        <voice name='ko-KR-SunHiNeural'>${text}</voice>
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

      if (!response.ok) {
        throw new Error(`Azure TTS 요청 실패: ${response.status}`);
      }

      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);
      setCurrentAudio(audio);
      audio.play();
    } catch (error) {
      console.error("TTS 에러:", error);
    }
  };

  //음소거 버튼

  const handleTTSButtonClick = () => {
    setIsTTSEnabled((prev) => {
      const nextState = !prev;

      if (!nextState && currentAudio) {
        // 음소거 상태로 변경할 때는 일시정지
        currentAudio.pause();
      } else if (nextState && currentAudio && currentAudio.paused) {
        // 다시 소리 켤 때 이전 오디오가 있으면 이어서 재생
        currentAudio
          .play()
          .catch((e) => console.error("오디오 재생 중 오류:", e));
      }

      return nextState;
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

    try {
      const response = await axios.post(
        `${endpoint}/openai/deployments/${deploymentName}/chat/completions?api-version=${apiVersion}`,
        {
          messages: [
            {
              role: "system",
              content:
                "너는 대한민국 독립운동가야. 독립운동가라고 생각하고 옛날 한국인의 말투로 대답해줘. '하오체'로 대답해주면 돼.",
            },
            ...messages.map((m) => ({
              role: m.isUser ? "user" : "assistant",
              content: m.text,
            })),
            { role: "user", content: inputMessage },
          ],
          temperature: 0.7,
          max_tokens: 2000,
          top_p: 0.95,
          frequency_penalty: 0,
          presence_penalty: 0,
          stop: null,

          // ✅ AI Search 확장 옵션 추가
          // azure_extension_options: {
          //   extensions: [
          //     {
          //       type: "AzureCognitiveSearch",
          //       endpoint: aisearch_endpoint,
          //       key: aisearch_key,
          //       indexName: aisearch_indexName,
          //     },
          //   ],
          // },
          data_sources: [
            {
              type: "azure_search",
              parameters: {
                endpoint: aisearch_endpoint,
                index_name: aisearch_indexName,
                semantic_configuration: aisearch_semantic,
                query_type: "semantic",
                fields_mapping: {},
                in_scope: true,
                filter: null,
                strictness: 5,
                top_n_documents: 5,
                authentication: {
                  type: "api_key",
                  key: aisearch_key,
                },
                key: aisearch_key,
              },
            },
          ],
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

      // TTS로 읽어주기
      //speakTextWithAzureTTS(botResponse);
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
          {messages.map((message, index) => (
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
