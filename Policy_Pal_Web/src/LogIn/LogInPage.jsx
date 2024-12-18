import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom'; 
import '../LogIn/LogIn.scss';

function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!username || !password) {
      setMessage('Please fill in all fields.');
      setMessageType('error');
      return;
    }

    if (username !== password) {
      setMessage('Username and password must be the same.');
      setMessageType('error');
      return;
    }

    const validUsers = ['Mia', 'Roxy', 'Chad'];
    if (!validUsers.includes(username)) {
      setMessage('Invalid username.');
      setMessageType('error');
      return;
    }

  
    setMessage('Login successful! Redirecting...');
    setMessageType('success');

    setTimeout(() => {
      navigate('/chat', { state: { username } });
    }, 1000);
  };

  return (
    <div className="login-page">
      <div className="login-container">
        <h1>Login</h1>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="username">Username:</label>
            <input
              type="text"
              id="username"
              placeholder="Enter your username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>
          <div className="form-group">
            <label htmlFor="password">Password:</label>
            <input
              type="password"
              id="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          {message && (
            <p className={messageType}>{message}</p>
          )}
          <button type="submit">Login</button>
        </form>
      </div>
    </div>
  );
}

export default LoginPage;
