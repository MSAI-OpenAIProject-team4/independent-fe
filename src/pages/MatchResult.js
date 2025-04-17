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

    useEffect(() => {
        let isMounted = true;

        const compareImages = async () => {
            try {
                const capturedImage = location.state?.capturedImage;
                console.log('전송할 이미지:', capturedImage ? '이미지 있음' : '이미지 없음');
                
                if (!capturedImage) {
                    throw new Error('이미지가 없습니다.');
                }

                if (!capturedImage.startsWith('data:image')) {
                    throw new Error('올바른 이미지 형식이 아닙니다.');
                }

                const response = await axios.post('http://20.84.89.102/api/compare/', {
                    image: capturedImage
                }, {
                    headers: {
                        'Content-Type': 'application/json',
                    }
                });

                console.log('서버 응답 전체:', response);

                let responseData = response.data;

                // 문자열이면 JSON 파싱 시도
                if (typeof responseData === 'string') {
                    try {
                        responseData = JSON.parse(responseData);
                    } catch (parseError) {
                        console.error('JSON 파싱 에러:', parseError);
                        throw new Error('서버 응답을 처리할 수 없습니다.');
                    }
                }

                if (isMounted) {
                    if (responseData.error) {
                        console.error('서버 에러:', responseData.error);
                        setError(responseData.error);
                    } else if (!responseData.matchedFighter) {
                        console.error('매칭된 독립운동가 정보 없음');
                        setError('매칭된 독립운동가 정보를 찾을 수 없습니다.');
                    } else {
                        console.log('매칭된 독립운동가:', responseData.matchedFighter);
                        setMatchResult(responseData);
                    }
                    setLoading(false);
                }
            } catch (err) {
                console.error('API 호출 에러:', err);
                if (isMounted) {
                    setError(err.message || '서버 연결에 실패했습니다.');
                    setLoading(false);
                }
            }
        };

        compareImages();

        return () => {
            isMounted = false;
        };
    }, [location.state?.capturedImage]);

    useEffect(() => {
        if (matchResult) {
            console.log('현재 매칭 결과:', matchResult);
        }
    }, [matchResult]);

    const handleStartChat = () => {
        if (matchResult?.matchedFighter) {
            console.log('채팅으로 전달되는 데이터:', matchResult.matchedFighter);
            navigate('/chat', {
                state: {
                    matchedFighter: matchResult.matchedFighter
                }
            });
        } else {
            console.error('채팅을 시작할 수 없습니다: 매칭 데이터 없음');
        }
    };

    const handleNextClick = () => {
        if (!showBiography) {
            setShowBiography(true);
        } else {
            handleStartChat();
        }
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

    if (!matchResult?.matchedFighter) {
        console.error('매칭 결과 없음');
        return (
            <div className="match-result">
                <h2 className="match-title">죄송합니다</h2>
                <p className="error-message">매칭 결과를 찾을 수 없습니다.</p>
                <button className="retry-button" onClick={() => navigate('/photo')}>
                    다시 시도하기
                </button>
            </div>
        );
    }

    return showBiography ? (
        <div className="biography">
            <div className="biography-container">
                <div className="biography-image">
                    <img 
                        src={matchResult.matchedFighter.image_url} 
                        alt={matchResult.matchedFighter.name}
                        onError={(e) => {
                            console.error('이미지 로딩 실패:', e);
                            e.target.onerror = null;
                            e.target.src = '/placeholder.jpg';
                        }}
                    />
                </div>
                <div className="biography-info">
                    <h2>{matchResult.matchedFighter.name} ({matchResult.matchedFighter.nameHanja})</h2>
                    <div className="info-row">
                        <div className="info-section">
                            <h3>생애</h3>
                            <p>{matchResult.matchedFighter.bornDied || '정보 없음'}</p>
                        </div>
                        <div className="info-section">
                            <h3>훈격</h3>
                            <p>{matchResult.matchedFighter.orders || '정보 없음'}</p>
                        </div>
                    </div>
                    <div className="info-section">
                        <h3>주요 활동</h3>
                        <div className="activities-content">
                            <p className="p1">{matchResult.matchedFighter.activities || '정보 없음'}</p>
                        </div>
                    </div>
                </div>
            </div>
            <div className="button-container">
                <button className="chat-button" onClick={handleStartChat}>
                    대화하기
                </button>
            </div>
        </div>
    ) : (
        <div className="match-result">
            <button className="menu-button" onClick={() => navigate('/photo')}>
                메뉴
            </button>
            <h2 className="match-title">{matchResult.matchedFighter.name}님과 연결되었습니다</h2>
            <p className="similarity">
                유사도: {matchResult.similarity ? `${(matchResult.similarity * 100).toFixed(1)}%` : 'NaN%'}
            </p>
            <div className="image-comparison">
                <div className="user-image">
                    <img src={location.state?.capturedImage} alt="사용자" />
                </div>
                <div className="historical-image">
                    <img 
                        src={matchResult.matchedFighter.image_url} 
                        alt={matchResult.matchedFighter.name}
                        onError={(e) => {
                            console.error('이미지 로딩 실패:', e);
                            e.target.onerror = null;
                            e.target.src = '/placeholder.jpg';
                        }}
                    />
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
};

export default MatchResult;
