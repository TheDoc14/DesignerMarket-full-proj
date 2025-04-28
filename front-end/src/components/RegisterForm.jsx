// src/components/RegisterForm.jsx
import React, { useState } from 'react';
import StyledInput from './styled/StyledInput';
import StyledButton from './styled/StyledButton';
import StyledForm from './styled/StyledForm';
import StyledError from './styled/StyledError';
import StyledSuccess from './styled/StyledSuccess';
import { FaUser, FaEnvelope, FaLock } from 'react-icons/fa';

function RegisterForm() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!name || !email || !password) {
      setError('Please fill in all fields.');
      setSuccess('');
    } else {
      setError('');
      setSuccess('Registration successful!');
      console.log('Register:', { name, email, password });
    }
  };

  return (
    <StyledForm onSubmit={handleSubmit}>
      <h2>Register</h2>
      {error && <StyledError>{error}</StyledError>}
      {success && <StyledSuccess>{success}</StyledSuccess>}

      <StyledInput.InputWrapper>
        <StyledInput.IconWrapper><FaUser /></StyledInput.IconWrapper>
        <StyledInput.Input
          type="text"
          placeholder="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </StyledInput.InputWrapper>

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

      <StyledButton type="submit">Register</StyledButton>
    </StyledForm>
  );
}

export default RegisterForm;
