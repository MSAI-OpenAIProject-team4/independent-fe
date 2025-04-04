import React from 'react';
import { useLocation } from 'react-router-dom';
import '../styles/MatchResult.css';

function MatchResult() {
  const location = useLocation();
  const { capturedImage } = location.state || {};

  const handleNextClick = () => {
    // 다음 페이지로 이동 (추후 구현)
    console.log('다음 페이지로 이동');
  };

  return (
    <div className="match-result">
      <div className="result-container">
        <h1 className="match-title">000님과 연결되었습니다.</h1>
        <p className="match-percentage">유사도 : 0.78%</p>
        <div className="image-comparison">
          <div className="historical-image">
            <img src="/independence-fighter.png" alt="독립운동가" />
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