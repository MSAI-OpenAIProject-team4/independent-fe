import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/HistoryMoment.css';
import MenuComponent from '../components/MenuComponent';

function HistoryMoment() {
    const navigate = useNavigate();
    const [selectedMoment, setSelectedMoment] = useState(null);
    const [moments, setMoments] = useState([
        {
            id: 1,
            title: "안중근 의사의 재판",
            description: "1909년 10월 26일, 안중근 의사는 하얼빈 역에서 이토 히로부미를 처단한 후 체포되어 재판을 받게 됩니다. \n 당신은 안중근 의사가 되어 스스로를 변호해야 합니다.",
            backgroundImage: "../../public/judgement.png",
            chatHistory: [],
            currentMessage: "",
            isTyping: false,
            historicalContext: [
                {
                    title: "이토 히로부미 처단의 배경",
                    content: "이토 히로부미는 조선의 초대 통감으로, 조선의 주권을 침해하고 일제의 식민지화를 추진한 인물입니다."
                },
                {
                    title: "재판의 진행 과정",
                    content: "재판은 일본의 관할 법원에서 진행되었으며, 안중근 의사는 자신의 행동이 전쟁 행위임을 주장했습니다."
                }
            ]
        }
    ]);

    const handleMomentSelect = (moment) => {
        setSelectedMoment(moment);
    };

    const handleBackClick = () => {
        if (selectedMoment) {
            setSelectedMoment(null);
        } else {
            navigate('/');
        }
    };

    const handleSendMessage = (e) => {
        e.preventDefault();
        if (!selectedMoment.currentMessage.trim()) return;

        // TODO: 챗봇 API 연동
        const newMessage = {
            text: selectedMoment.currentMessage,
            isUser: true
        };

        setSelectedMoment(prev => ({
            ...prev,
            chatHistory: [...prev.chatHistory, newMessage],
            currentMessage: "",
            isTyping: true
        }));

        // TODO: 챗봇 응답 처리
        setTimeout(() => {
            setSelectedMoment(prev => ({
                ...prev,
                chatHistory: [...prev.chatHistory, {
                    text: "이것은 챗봇의 응답입니다. 실제 API 연동 후 구현됩니다.",
                    isUser: false
                }],
                isTyping: false
            }));
        }, 1000);
    };

    if (selectedMoment) {
        return (
            <div className="history-moment-container trial-page">
                <MenuComponent onBackClick={handleBackClick} />
                <div className="trial-container">
                    <div className="trial-header">
                        <h1>{selectedMoment.title}</h1>
                        <p>{selectedMoment.description}</p>
                    </div>
                    <div className="trial-content">
                        <div className="chat-container">
                            <div className="chat-messages">
                                {selectedMoment.chatHistory.map((message, index) => (
                                    <div key={index} className={`message ${message.isUser ? 'user' : 'bot'}`}>
                                        {message.text}
                                    </div>
                                ))}
                                {selectedMoment.isTyping && (
                                    <div className="typing-indicator">...</div>
                                )}
                            </div>
                            <form onSubmit={handleSendMessage} className="chat-input">
                                <input
                                    type="text"
                                    value={selectedMoment.currentMessage}
                                    onChange={(e) => setSelectedMoment(prev => ({ ...prev, currentMessage: e.target.value }))}
                                    placeholder="변호 내용을 입력하세요..."
                                />
                                <button type="submit">전송</button>
                            </form>
                        </div>
                        <div className="historical-context">
                            <h2>역사적 맥락</h2>
                            {selectedMoment.historicalContext.map((context, index) => (
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
            <MenuComponent onBackClick={handleBackClick} />
            <div className="moments-selection">
                <h1>역사의 순간</h1>
                <div className="moments-grid">
                    {moments.map(moment => (
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