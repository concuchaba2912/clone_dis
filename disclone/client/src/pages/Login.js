// client/src/pages/Login.js
import React, { useState, useContext } from 'react';
import { Link, Redirect } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [error, setError] = useState('');
  const { login, isAuthenticated } = useContext(AuthContext);

  const { email, password } = formData;

  const onChange = e => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const onSubmit = async e => {
    e.preventDefault();
    const success = await login(formData);
    if (!success) {
      setError('Invalid credentials');
    }
  };

  if (isAuthenticated) {
    return <Redirect to="/channels" />;
  }

  return (
    <div className="login-container">
      <div className="login-form">
        <h1>Welcome back!</h1>
        <p>We're so excited to see you again!</p>
        {error && <div className="error">{error}</div>}
        <form onSubmit={onSubmit}>
          <div className="form-group">
            <label>EMAIL</label>
            <input
              type="email"
              name="email"
              value={email}
              onChange={onChange}
              required
            />
          </div>
          <div className="form-group">
            <label>PASSWORD</label>
            <input
              type="password"
              name="password"
              value={password}
              onChange={onChange}
              required
            />
          </div>
          <button type="submit" className="submit-btn">Login</button>
        </form>
        <p>
          Need an account? <Link to="/register">Register</Link>
        </p>
      </div>
    </div>
  );
};

export default Login;