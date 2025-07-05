// src/Login.jsx
import React, { useState, useEffect } from 'react';

export default function Login({ onLogin }) {
  const [credentials, setCredentials] = useState({ username: '', password: '' });

  useEffect(() => {
    const link = document.createElement('link');
    link.href = 'https://fonts.googleapis.com/css2?family=Inter:wght@400;600&display=swap';
    link.rel = 'stylesheet';
    document.head.appendChild(link);
  }, []);

  const handleChange = (e) => {
    setCredentials({ ...credentials, [e.target.name]: e.target.value });
  };

  const handleLogin = () => {
    if (credentials.username === 'admin' && credentials.password === 'admin123') {
      onLogin();
    } else {
      alert('Invalid credentials');
    }
  };

  const containerStyle = {
    fontFamily: "'Inter', sans-serif",
    display: 'flex',
    height: '100vh',
    background: '#f1f6fb',
  };

  const leftStyle = {
    flex: 1,
    backgroundColor: '#bbdefb',
    color: '#0d47a1',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    padding: '3rem',
    position: 'relative',
  };

  const rightStyle = {
    flex: 1,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    position: 'relative',
  };

  const loginBox = {
    backgroundColor: '#ffffff',
    padding: '2rem',
    borderRadius: '12px',
    boxShadow: '0 8px 24px rgba(0,0,0,0.1)',
    width: '320px',
  };

  const inputStyle = {
    width: '100%',
    padding: '12px',
    margin: '10px 0',
    borderRadius: '8px',
    border: '1px solid #ccc',
    fontSize: '1rem',
  };

  const buttonStyle = {
    width: '100%',
    padding: '12px',
    backgroundColor: '#1976d2',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    fontWeight: '600',
    cursor: 'pointer',
  };

  const decorationStyle = {
    position: 'absolute',
    width: '100%',
    height: '40px',
    background: 'linear-gradient(to right, #e3f2fd, #bbdefb)',
  };

  return (
    <div style={containerStyle}>
      <div style={leftStyle}>
        <div style={{ ...decorationStyle, top: 0 }} />
        <h1 style={{ fontSize: '2.4rem', fontWeight: 600, marginBottom: '1rem' }}>
          🚀 Welcome to ATS Portal
        </h1>
        <p style={{ fontSize: '1.1rem', lineHeight: '1.6' }}>
          This platform offers a streamlined way to track and manage job applications efficiently.
          Our system helps recruiters make smarter decisions—faster.
        </p>
        <div style={{ ...decorationStyle, bottom: 0 }} />
      </div>

      <div style={rightStyle}>
        <div style={loginBox}>
          <h2 style={{ textAlign: 'center', marginBottom: '1rem' }}>🔐 Login</h2>
          <input
            type="text"
            name="username"
            placeholder="Username"
            value={credentials.username}
            onChange={handleChange}
            style={inputStyle}
          />
          <input
            type="password"
            name="password"
            placeholder="Password"
            value={credentials.password}
            onChange={handleChange}
            style={inputStyle}
          />
          <button onClick={handleLogin} style={buttonStyle}>Login</button>
        </div>
      </div>
    </div>
  );
}
