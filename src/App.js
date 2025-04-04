import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';
import Welcome from './pages/Welcome';
import PhotoCapture from './pages/PhotoCapture';
import Chat from './pages/Chat';
import MatchResult from './pages/MatchResult';

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/" element={<Welcome />} />
          <Route path="/photo" element={<PhotoCapture />} />
          <Route path="/chat" element={<Chat />} />
          <Route path="/result" element={<MatchResult />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
