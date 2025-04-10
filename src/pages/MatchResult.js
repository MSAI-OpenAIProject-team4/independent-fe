import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import '../styles/MatchResult.css';
import axios from 'axios';

function MatchResult() {
  const location = useLocation();
  const navigate = useNavigate();
  const { capturedImage } = location.state || {};
  const [matchResult, setMatchResult] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const compareImages = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // VM 엔드포인트 확인
        const vmEndpoint = process.env.REACT_APP_VM_ENDPOINT;
        if (!vmEndpoint) {
          throw new Error('VM 엔드포인트가 설정되지 않았습니다. .env 파일을 확인해주세요.');
        }

        // axios 설정
        const axiosConfig = {
          headers: {
            'Content-Type': 'application/json',
          },
          timeout: 30000, // 30초 타임아웃
        };

        const response = await axios.post(
          `${vmEndpoint}/compare`,
          {
            userImage: capturedImage,
          },
          axiosConfig
        );

        if (response.data) {
          setMatchResult(response.data);
        } else {
          throw new Error('서버로부터 응답을 받지 못했습니다.');
        }
      } catch (error) {
        console.error('이미지 비교 중 오류 발생:', error);
        
        let errorMessage = '이미지 비교 중 오류가 발생했습니다.';
        if (error.code === 'ECONNABORTED') {
          errorMessage = '서버 연결 시간이 초과되었습니다. 다시 시도해주세요.';
        } else if (error.code === 'ERR_NETWORK') {
          errorMessage = '서버에 연결할 수 없습니다. 네트워크 연결을 확인해주세요.';
        } else if (error.message.includes('VM 엔드포인트')) {
          errorMessage = error.message;
        } else if (error.response) {
          errorMessage = `서버 오류: ${error.response.data.message || '알 수 없는 오류가 발생했습니다.'}`;
        }
        
        setError(errorMessage);
      } finally {
        setIsLoading(false);
      }
    };

    if (capturedImage) {
      compareImages();
    } else {
      setError('이미지가 없습니다.');
      setIsLoading(false);
    }
  }, [capturedImage]);

  const handleRetry = () => {
    if (capturedImage) {
      setIsLoading(true);
      setError(null);
      const compareImages = async () => {
        try {
          const vmEndpoint = process.env.REACT_APP_VM_ENDPOINT;
          if (!vmEndpoint) {
            throw new Error('VM 엔드포인트가 설정되지 않았습니다. .env 파일을 확인해주세요.');
          }

          const response = await axios.post(
            `${vmEndpoint}/compare`,
            {
              userImage: capturedImage,
            },
            {
              headers: {
                'Content-Type': 'application/json',
              },
              timeout: 30000,
            }
          );
          setMatchResult(response.data);
        } catch (error) {
          console.error('재시도 중 오류 발생:', error);
          setError('재시도 중 오류가 발생했습니다. 다시 시도해주세요.');
        } finally {
          setIsLoading(false);
        }
      };
      compareImages();
    }
  };

  const handleBackToCapture = () => {
    navigate('/photo-capture');
  };

  const handleNextClick = () => {
    navigate('/chat', { 
      state: { 
        matchedFighter: {
          name: matchResult?.matchedFighter?.name,
          nameHanja: matchResult?.matchedFighter?.nameHanja,
          movementFamily: matchResult?.matchedFighter?.movementFamily,
          orders: matchResult?.matchedFighter?.orders,
          addressBirth: matchResult?.matchedFighter?.addressBirth,
          activities: matchResult?.matchedFighter?.activities,
          content: matchResult?.matchedFighter?.content,
          references: matchResult?.matchedFighter?.references,
          image_url: matchResult?.matchedFighter?.image_url
        }
      } 
    });
  };

  if (isLoading) {
    return (
      <div className="match-result">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>이미지를 분석 중입니다...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="match-result">
        <div className="error-container">
          <p className="error-message">{error}</p>
          <div className="error-buttons">
            <button onClick={handleRetry} className="retry-button">
              다시 시도
            </button>
            <button onClick={handleBackToCapture} className="back-button">
              사진 다시 찍기
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="match-result">
      <div className="result-container">
        <h1 className="match-title">{matchResult?.name || '000'}님과 연결되었습니다.</h1>
        <p className="match-percentage">유사도 : {(matchResult?.similarity * 100).toFixed(2)}%</p>
        <div className="image-comparison">
          <div className="historical-image">
            <img src={matchResult?.fighterImage || "/independence-fighter.png"} alt="독립운동가" />
          </div>
          <div className="user-image">
            <img src={capturedImage || "/user-avatar.png"} alt="사용자" />
          </div>
        </div>
        <button className="next-button" onClick={handleNextClick}>
          <span>다음</span>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M9 18L15 12L9 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      </div>
    </div>
  );
}

export default MatchResult; 