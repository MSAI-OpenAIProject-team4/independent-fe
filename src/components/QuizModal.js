import React, { useState } from 'react';
import '../styles/QuizModal.css';

function QuizModal({ onClose }) {
    const [currentQuestion, setCurrentQuestion] = useState(0);
    const [selectedAnswer, setSelectedAnswer] = useState(null);
    const [score, setScore] = useState(0);
    const [showResult, setShowResult] = useState(false);
    const [isAnswerChecked, setIsAnswerChecked] = useState(false);
    const [showIntro, setShowIntro] = useState(true);

    const introduction = {
        title: "🔹 민족의 영웅, 안중근 의사",
        content: `안중근(1879~1910)은 일제의 침략에 맞서 싸운 대표적인 독립운동가로, 대한제국 말기 러시아령 하얼빈에서 이토 히로부미를 저격하여 조국의 독립 의지를 세계에 알렸습니다.

1905년, 을사늑약을 체결하며 대한제국의 외교권을 박탈한 장본인인 이토 히로부미는 한국 침략의 핵심 인물이었습니다. 이에 분노한 안중근 의사는 1909년 10월 26일, 중국 하얼빈역에서 이토 히로부미를 총으로 저격하여 처단하였습니다. 이 사건은 러시아 관할 지역에서 발생했지만, 일본은 국제법을 무시하고 안 의사의 신병을 자국으로 넘겨 재판을 강행하였습니다.

안 의사는 이후 중국 랴오둥 반도에 위치한 뤼순감옥에 수감되어 재판을 받았고, 일제는 끝내 그에게 사형을 선고했습니다. 안중근 의사는 사형 집행 직전까지도 동양 평화를 꿈꾸며 조선의 독립과 정의를 주장했습니다. 그는 1910년 3월 26일, 순국하였습니다.

그의 순국은 한민족의 독립 의지를 상징하는 사건으로 오늘날까지 기념되고 있으며, 안중근 의사는 우리 민족의 자주와 정의를 실천한 인물로 기억되고 있습니다.`
    };

    const questions = [
        {
            question: "1909년 10월 26일, 안중근 의사는 하얼빈역에서 이토 히로부미를 저격하였습니다. 그러나 이 사건은 러시아 영토 내에서 발생했음에도 불구하고, 안중근 의사는 어느 나라 법정에서 재판을 받았나요?",
            options: [
                "러시아",
                "대한제국",
                "일본",
                "청나라"
            ],
            correctAnswer: 2
        },
        {
            question: "안중근 의사는 이토 히로부미 저격 사건 이후 어느 감옥에 수감되어 재판과 사형 선고를 받았나요?",
            options: [
                "서대문형무소",
                "독립문감옥",
                "뤼순감옥",
                "청도감옥"
            ],
            correctAnswer: 2
        },
        {
            question: "안중근 의사의 사형은 언제 집행되었나요?",
            options: [
                "1909년 10월 26일",
                "1910년 2월 1일",
                "1910년 3월 26일",
                "1910년 8월 29일"
            ],
            correctAnswer: 2
        }
    ];

    const handleAnswerSelect = (answerIndex) => {
        if (!isAnswerChecked) {
            setSelectedAnswer(answerIndex);
        }
    };

    const checkAnswer = () => {
        if (selectedAnswer === null) return;
        setIsAnswerChecked(true);
        if (selectedAnswer === questions[currentQuestion].correctAnswer) {
            setScore(score + 1);
        }
    };

    const nextQuestion = () => {
        if (currentQuestion < questions.length - 1) {
            setCurrentQuestion(currentQuestion + 1);
            setSelectedAnswer(null);
            setIsAnswerChecked(false);
        } else {
            setShowResult(true);
        }
    };

    const startQuiz = () => {
        setShowIntro(false);
    };

    return (
        <div className="quiz-modal-overlay">
            <div className="quiz-modal">
                {showIntro ? (
                    <div className="quiz-intro-container">
                        <h2 className="quiz-intro-title">{introduction.title}</h2>
                        <div className="quiz-intro-content">
                            {introduction.content}
                        </div>
                        <button className="quiz-close-button" onClick={startQuiz}>
                            퀴즈 시작하기
                        </button>
                    </div>
                ) : !showResult ? (
                    <>
                        <div className="quiz-progress">
                            문제 {currentQuestion + 1} / {questions.length}
                        </div>
                        <div className="quiz-question">
                            {questions[currentQuestion].question}
                        </div>
                        <div className="quiz-options">
                            {questions[currentQuestion].options.map((option, index) => (
                                <button
                                    key={index}
                                    className={`quiz-option ${selectedAnswer === index ? 'selected' : ''} 
                                        ${isAnswerChecked && index === questions[currentQuestion].correctAnswer ? 'correct' : ''}
                                        ${isAnswerChecked && selectedAnswer === index && selectedAnswer !== questions[currentQuestion].correctAnswer ? 'incorrect' : ''}`}
                                    onClick={() => handleAnswerSelect(index)}
                                    disabled={isAnswerChecked}
                                >
                                    {option}
                                </button>
                            ))}
                        </div>
                        {!isAnswerChecked ? (
                            <button className="quiz-close-button" onClick={checkAnswer}>
                                정답 확인
                            </button>
                        ) : (
                            <button className="quiz-close-button" onClick={nextQuestion}>
                                {currentQuestion === questions.length - 1 ? '결과 보기' : '다음 문제'}
                            </button>
                        )}
                    </>
                ) : (
                    <div className="quiz-result-container">
                        <div className="quiz-result-title">퀴즈가 종료되었습니다!</div>
                        <div className="quiz-result-score">{questions.length}문제 중 {score}문제를 맞추셨습니다.</div>
                        <div className="quiz-result-message">
                            {score === questions.length ? '완벽합니다! 🎉' :
                             score >= questions.length / 2 ? '잘 하셨습니다! 👏' :
                             '다음에는 더 잘 할 수 있을 거예요! 💪'}
                        </div>
                        <button className="quiz-close-button" onClick={onClose}>
                            닫기
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}

export default QuizModal; 