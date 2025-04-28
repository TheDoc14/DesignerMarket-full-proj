// src/components/LoginForm.jsx
import React, { useState } from 'react';
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

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!email || !password) {
      setError('Please fill in all fields.');
      setSuccess('');
    } else {
      setError('');
      setSuccess('Login successful!');
      console.log('Login:', { email, password });
    }
  };

  return (
    <StyledForm onSubmit={handleSubmit}>
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
