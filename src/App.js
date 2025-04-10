// src/App.js
import React, { useState } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import "./App.css";
import Welcome from "./pages/Welcome";
import PhotoCapture from "./pages/PhotoCapture";
import Chat from "./pages/Chat";
import MatchResult from "./pages/MatchResult";
import IndependentGame from "./pages/IndependentGame";
import MenuComponent from "./components/MenuComponent";

function App() {
  const [language, setLanguage] = useState("ko");

  return (
    <Router>
      <div className="App">
        <MenuComponent
          onLanguageChange={(lang) => setLanguage(lang)}
          selectedLanguage={language}
        />
        <Routes>
          <Route
            path="/"
            element={
              <Welcome language={language} onLanguageChange={setLanguage} />
            }
          />
          <Route
            path="/photo"
            element={
              <PhotoCapture
                language={language}
                onLanguageChange={setLanguage}
              />
            }
          />
          <Route
            path="/chat"
            element={
              <Chat language={language} onLanguageChange={setLanguage} />
            }
          />
          <Route
            path="/result"
            element={
              <MatchResult language={language} onLanguageChange={setLanguage} />
            }
          />
          <Route
            path="/game"
            element={
              <IndependentGame
                language={language}
                onLanguageChange={setLanguage}
              />
            }
          />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
