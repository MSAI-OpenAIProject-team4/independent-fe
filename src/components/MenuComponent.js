// src/components/MenuComponent.js
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/MenuComponent.css";

function MenuComponent({ onLanguageChange = () => {}, selectedLanguage }) {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();

  const handleMenuClick = () => {
    setIsOpen(!isOpen);
  };

  const handleLanguageSelect = (language) => {
    onLanguageChange(language);
    setIsOpen(false);
  };

  const handleNavigation = (path) => {
    navigate(path);
    setIsOpen(false);
  };

  return (
    <div className="menu-component">
      <button className="menu-button" onClick={handleMenuClick}>
        메뉴
      </button>
      <div className={`menu-dropdown ${isOpen ? "open" : ""}`}>
        <div className="menu-sections">
          <div className="menu-section" onClick={() => handleNavigation("/")}>
            100년 역사 여행
          </div>
          <div className="section-divider"></div>
          <div
            className="menu-section"
            onClick={() => handleNavigation("/chat")}
          >
            독립운동가와 대화하기
          </div>
          <div className="section-divider"></div>
          <div
            className="menu-section"
            onClick={() => handleNavigation("/game")}
          >
            독립운동 체험
          </div>
          <div className="section-divider"></div>
          <div
            className="menu-section"
            onClick={() => handleNavigation("/history")}
          >
            찰나의 역사
          </div>
        </div>
        <div className="flags-container">
          <div className="menu-item" onClick={() => handleLanguageSelect("ko")}>
            <img src="/kr-flag.png" alt="한국어" className="menu-flag" />
          </div>
          <div className="menu-item" onClick={() => handleLanguageSelect("en")}>
            <img src="/us-flag.png" alt="English" className="menu-flag" />
          </div>
          <div className="menu-item" onClick={() => handleLanguageSelect("jp")}>
            <img src="/jp-flag.png" alt="日本語" className="menu-flag" />
          </div>
        </div>
      </div>
    </div>
  );
}

export default MenuComponent;
