import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import '../styles/MatchResult.css';

const MatchResult = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const capturedImage = location.state?.capturedImage;
  const [matchResult, setMatchResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (capturedImage) {
      compareImages();
    }
  }, [capturedImage]);

  const compareImages = async () => {
    try {
      setLoading(true);
      setError(null);

      // FormData 생성
      const formData = new FormData();
      formData.append('image', capturedImage);

      // 서버에 이미지 전송
      const response = await axios.post(
        `${process.env.REACT_APP_VM_ENDPOINT}/compare`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
            'Access-Control-Allow-Origin': '*'
          },
          timeout: 30000, // 30초 타임아웃
          withCredentials: true
        }
      );

      if (response.data && response.data.match) {
        setMatchResult(response.data);
      } else {
        setError('일치하는 얼굴을 찾을 수 없습니다.');
      }
    } catch (err) {
      console.error('이미지 비교 중 오류:', err);
      if (err.code === 'ECONNABORTED') {
        setError('서버 연결 시간이 초과되었습니다. 다시 시도해주세요.');
      } else if (err.response) {
        setError(`서버 오류: ${err.response.data.error || '알 수 없는 오류'}`);
      } else if (err.request) {
        setError('서버에 연결할 수 없습니다. 서버가 실행 중인지 확인해주세요.');
      } else {
        setError(`오류 발생: ${err.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRetry = () => {
    setLoading(true);
    setError(null);
    compareImages();
  };

  const handleNextClick = () => {
    if (matchResult) {
      const matchedFighter = {
        name: matchResult.name,
        nameHanja: matchResult.nameHanja,
        movementFamily: matchResult.movementFamily,
        orders: matchResult.orders,
        addressBirth: matchResult.addressBirth,
        activities: matchResult.activities,
        references: matchResult.references,
        similarity: matchResult.similarity
      };
      navigate('/chat', { state: { matchedFighter } });
    }
  };

  if (!capturedImage) {
    return (
      <div className="match-result-container">
        <div className="error-message">
          <p>캡처된 이미지가 없습니다.</p>
          <button onClick={() => navigate('/photo-capture')}>돌아가기</button>
        </div>
      </div>
    );
  }

  return (
    <div className="match-result-container">
      <h2>얼굴 매칭 결과</h2>
      
      {loading && (
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>얼굴을 분석 중입니다...</p>
        </div>
      )}

      {error && (
        <div className="error-message">
          <p>{error}</p>
          <button onClick={handleRetry}>다시 시도</button>
          <button onClick={() => navigate('/photo-capture')}>돌아가기</button>
        </div>
      )}

      {matchResult && !loading && !error && (
        <div className="match-result-content">
          <div className="image-comparison">
            <div className="image-container">
              <h3>촬영한 사진</h3>
              <img src={URL.createObjectURL(capturedImage)} alt="촬영한 사진" />
            </div>
            <div className="image-container">
              <h3>매칭된 독립운동가</h3>
              <img src={matchResult.matchedImage} alt="매칭된 독립운동가" />
            </div>
          </div>

          <div className="match-details">
            <h3>매칭 정보</h3>
            <p><strong>이름:</strong> {matchResult.name}</p>
            <p><strong>한자:</strong> {matchResult.nameHanja}</p>
            <p><strong>운동/가족:</strong> {matchResult.movementFamily}</p>
            <p><strong>서훈:</strong> {matchResult.orders}</p>
            <p><strong>출생지:</strong> {matchResult.addressBirth}</p>
            <p><strong>활동:</strong> {matchResult.activities}</p>
            <p><strong>참고문헌:</strong> {matchResult.references}</p>
            <p><strong>유사도:</strong> {matchResult.similarity}%</p>
          </div>

          <div className="button-container">
            <button onClick={() => navigate('/photo-capture')}>다시 촬영</button>
            <button onClick={handleNextClick}>채팅 시작</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default MatchResult; 