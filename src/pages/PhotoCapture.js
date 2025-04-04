import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Webcam from 'react-webcam';
import '../styles/PhotoCapture.css';

function PhotoCapture() {
  const [showWebcam, setShowWebcam] = useState(false);
  const [capturedImage, setCapturedImage] = useState(null);
  const [showFlash, setShowFlash] = useState(false);
  const webcamRef = useRef(null);
  const navigate = useNavigate();

  const videoConstraints = {
    width: 450,
    height: 450,
    facingMode: "user"
  };

  const handleCaptureClick = () => {
    if (!showWebcam) {
      setShowWebcam(true);
    } else {
      const imageSrc = webcamRef.current.getScreenshot();
      setCapturedImage(imageSrc);
    }
  };

  const handleRetake = () => {
    setCapturedImage(null);
  };

  const handleConfirm = () => {
    setShowFlash(true);
    setTimeout(() => {
      navigate('/result', {
        state: { capturedImage }
      });
    }, 250); // 플래시가 가장 밝은 시점에 페이지 전환
  };

  return (
    <div className="photo-capture">
      {showFlash && <div className="flash-effect" />}
      <div className="capture-container">
        <div className="camera-frame">
          {!showWebcam && !capturedImage && (
            <img src="/camera-frame.png" alt="카메라 프레임" className="frame-image" />
          )}
          {showWebcam && !capturedImage && (
            <Webcam
              audio={false}
              ref={webcamRef}
              screenshotFormat="image/jpeg"
              videoConstraints={videoConstraints}
              className="frame-image"
              mirrored={true}
            />
          )}
          {capturedImage && (
            <img src={capturedImage} alt="captured" className="frame-image" />
          )}
        </div>
        
        {!showWebcam && (
          <div className="instructions">
            <p className="instruction-text">카메라를 정면으로 응시해주세요.</p>
            <p className="instruction-text notice">(* 사진은 저장되지 않습니다.)</p>
          </div>
        )}
        
        <div className="button-group">
          {!capturedImage ? (
            <button onClick={handleCaptureClick} className="capture-button">
              {showWebcam ? '촬영하기' : '시작하기'}
            </button>
          ) : (
            <>
              <button onClick={handleRetake} className="capture-button">다시 찍기</button>
              <button onClick={handleConfirm} className="capture-button confirm">확인</button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default PhotoCapture; 