import React from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/PhotoCapture.css';

function PhotoCapture() {
  const navigate = useNavigate();

  return (
    <div className="photo-capture">
      <div className="capture-container">
        <div className="camera-frame">
          <img src="/camera-frame.png" alt="카메라 프레임" className="frame-image" />
        </div>
        <div className="instructions">
          <p className="instruction-text">면저 사진을 촬영하겠습니다.</p>
          <p className="instruction-text">(4-5초간 잠시 기다려주세요)</p>
        </div>
        <button className="capture-button">
          촬영하기
        </button>
      </div>
    </div>
  );
}

export default PhotoCapture; 