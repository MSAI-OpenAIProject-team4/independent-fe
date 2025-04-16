import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import '../styles/MatchResult.css';
import axios from 'axios';

const MatchResult = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const [matchResult, setMatchResult] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showBiography, setShowBiography] = useState(false);
    const [showFullContent, setShowFullContent] = useState(false);

    useEffect(() => {
        let isMounted = true;  // 컴포넌트 마운트 상태 추적

        const compareImages = async () => {
            try {
                const capturedImage = location.state?.capturedImage;
                
                const response = await axios.post('http://20.84.89.102/api/compare/', {
                    image: capturedImage || 'test_image'
                }, {
                    headers: {
                        'Content-Type': 'application/json',
                    }
                });

                console.log('서버 응답:', response.data);
                
                if (isMounted) {  // 컴포넌트가 마운트된 상태일 때만 상태 업데이트
                    if (response.data.error) {
                        setError(response.data.error);
                    } else {
                        setMatchResult(response.data);
                    }
                    setLoading(false);
                }
            } catch (err) {
                console.error('Error:', err);
                if (isMounted) {
                    setError(err.response?.data?.error || err.message);
                    setLoading(false);
                }
            }
        };

        compareImages();

        // 클린업 함수
        return () => {
            isMounted = false;
        };
    }, []); // location.state 의존성 제거

    const handleNextClick = () => {
        if (!showBiography) {
            setShowBiography(true);
        } else if (matchResult) {
            navigate('/chat', {
                state: {
                    matchedFighter: {
                        name: matchResult.matchedFighter.name,
                        nameHanja: matchResult.matchedFighter.nameHanja,
                        movementFamily: matchResult.matchedFighter.movementFamily,
                        orders: matchResult.matchedFighter.orders,
                        addressBirth: matchResult.matchedFighter.addressBirth,
                        activities: matchResult.matchedFighter.activities,
                        references: matchResult.matchedFighter.references,
                        image_url: matchResult.matchedFighter.image_url,
                        content: matchResult.matchedFighter.content
                    }
                }
            });
        }
    };

    const summarizeContent = (content) => {
        if (!content) return '';
        const firstSentence = content.split('.')[0] + '.';
        const summary = content.length > 150 ? content.substring(0, 150) + '...' : content;
        return showFullContent ? content : summary;
    };

    if (loading) {
        return (
            <div className="match-result">
                <h2 className="match-title">닮은 독립운동가를 찾고 있습니다...</h2>
                <div className="loading-spinner"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="match-result">
                <h2 className="match-title">죄송합니다</h2>
                <p className="error-message">{error}</p>
                <button className="retry-button" onClick={() => navigate('/photo')}>
                    다시 촬영하기
                </button>
            </div>
        );
    }

    if (!matchResult) {
        return null;  // 데이터가 없을 때 빈 화면 표시
    }

    if (!showBiography) {
        return (
            <div className="match-result">
                <button className="menu-button" onClick={() => navigate('/photo')}>
                    메뉴
                </button>
                <h2 className="match-title">{matchResult?.matchedFighter?.name}님과 연결되었습니다</h2>
                <p className="similarity">유사도: {(matchResult?.similarity * 100).toFixed(1)}%</p>
                
                <div className="image-comparison">
                    <div className="user-image">
                        <img src={location.state?.capturedImage} alt="사용자" />
                    </div>
                    <div className="historical-image">
                        <img src={matchResult?.matchedFighter?.image_url} alt={matchResult?.matchedFighter?.name} />
                    </div>
                </div>

                <button className="next-button" onClick={handleNextClick}>
                    다음
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M5 12h14M12 5l7 7-7 7"/>
                    </svg>
                </button>
            </div>
        );
    }

    return (
        <div className="biography">
            <div className="biography-container">
                <div className="biography-image">
                    <img src={matchResult?.matchedFighter?.image_url} alt={matchResult?.matchedFighter?.name} />
                </div>
                <div className="biography-info">
                    <h2>{matchResult?.matchedFighter?.name} ({matchResult?.matchedFighter?.nameHanja})</h2>
                    <div className="info-row">
                        <div className="info-section">
                            <h3>생애</h3>
                            <p>{matchResult?.matchedFighter?.bornDied}</p>
                        </div>
                        <div className="info-section">
                            <h3>훈격</h3>
                            <p>{matchResult?.matchedFighter?.orders}</p>
                        </div>
                    </div>
                    <div className="info-section">
                        <h3>주요 활동</h3>
                        <div className="activities-content">
                            <p className="p1">{matchResult?.matchedFighter?.activities}</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="button-container">
                <button className="chat-button" onClick={handleNextClick}>
                    대화하기
                </button>
            </div>
        </div>
    );
};

export default MatchResult; 