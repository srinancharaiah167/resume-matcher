import React, { useState } from 'react';
import axios from 'axios';

export default function Auth({ onAuthSuccess }) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [msg, setMsg] = useState('');

  const handleSubmit = async () => {
    const route = isLogin ? '/login' : '/register';
    try {
      const res = await axios.post(`http://localhost:5000${route}`, { email, password });
      setMsg(res.data.message);
      if (isLogin && res.status === 200) onAuthSuccess(); // login success
    } catch (err) {
      setMsg(err.response?.data?.message || "Error");
    }
  };

  return (
    <div style={{ padding: '2rem' }}>
      <h2>{isLogin ? 'Login' : 'Register'}</h2>
      <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="Email" /><br /><br />
      <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Password" /><br /><br />
      <button onClick={handleSubmit}>{isLogin ? 'Login' : 'Register'}</button>
      <p>{msg}</p>
      <button onClick={() => setIsLogin(!isLogin)} style={{ marginTop: '1rem' }}>
        {isLogin ? "Don't have an account? Register" : "Already registered? Login"}
      </button>
    </div>
  );
}
