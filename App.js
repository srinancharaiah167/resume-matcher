// src/App.js
import React, { useState } from 'react';
import Login from './Login';
import ResumeATS from './ResumeATS';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const handleLoginSuccess = () => {
    setIsAuthenticated(true);
  };

  return (
    <>
      {isAuthenticated ? <ResumeATS /> : <Login onLogin={handleLoginSuccess} />}
    </>
  );
}

export default App;
