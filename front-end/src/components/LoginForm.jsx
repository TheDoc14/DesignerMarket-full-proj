import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import StyledInput from './styled/StyledInput';
import StyledButton from './styled/StyledButton';
import StyledForm from './styled/StyledForm';
import StyledError from './styled/StyledError';
import StyledSuccess from './styled/StyledSuccess';
import { FaEnvelope, FaLock } from 'react-icons/fa';

function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();

    if (!email || !password) {
      setError('נא למלא את כל השדות');
      setSuccess('');
      return;
    }

    try {
      const res = await axios.post('http://localhost:5000/api/auth/login', {
        email,
        password
      });

      const { token, user } = res.data;

      // שמירת הטוקן והמשתמש ב-localStorage
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));

      setError('');
      setSuccess(`שלום ${user.username}! התחברת בהצלחה 😊`);

      setTimeout(() => {
        navigate('/profile');
      }, 2000);

    } catch (err) {
      setSuccess('');
      setError(err.response?.data?.message || 'שגיאה בהתחברות');
    }
  };

  return (
    <StyledForm onSubmit={handleLogin}>
      <h2>Login</h2>
      {error && <StyledError>{error}</StyledError>}
      {success && <StyledSuccess>{success}</StyledSuccess>}

      <StyledInput.InputWrapper>
        <StyledInput.IconWrapper><FaEnvelope /></StyledInput.IconWrapper>
        <StyledInput.Input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </StyledInput.InputWrapper>

      <StyledInput.InputWrapper>
        <StyledInput.IconWrapper><FaLock /></StyledInput.IconWrapper>
        <StyledInput.Input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </StyledInput.InputWrapper>

      <StyledButton type="submit">Login</StyledButton>
    </StyledForm>
  );
}

export default LoginForm;
