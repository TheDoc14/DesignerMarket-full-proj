import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import StyledForm from './styled/StyledForm';
import StyledInput from './styled/StyledInput';
import StyledButton from './styled/StyledButton';
import StyledError from './styled/StyledError';
import StyledSuccess from './styled/StyledSuccess';
import { FaEnvelope, FaLock } from 'react-icons/fa';

function LoginForm({ setUser }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();

    if (!email || !password) {
      setError('נא למלא את כל השדות');
      return;
    }

    try {
      const res = await axios.post('http://localhost:5000/api/auth/login', {
        email,
        password
      });

      const { token, user } = res.data;

      if (!user.isVerified) {
        setError('החשבון שלך לא אומת. בדוק את האימייל שלך.');
        return;
      }

      // שמירת המידע בהתאם ל"זכור אותי"
      const storage = rememberMe ? localStorage : sessionStorage;
      storage.setItem('token', token);
      storage.setItem('user', JSON.stringify(user));
      setUser(user);

      setError('');
      setSuccess(`שלום ${user.username}, התחברת בהצלחה 😊`);

      setTimeout(() => {
        navigate('/profile');
      }, 2500);

    } catch (err) {
      setSuccess('');

      const serverMessage =
        err.response?.data?.message ||
        err.response?.data?.error ||
        err.response?.data?.errors?.[0]?.msg;

      if (serverMessage) {
        setError(serverMessage);
      } else if (err.response?.status === 403) {
        setError('האימייל שלך לא אומת. בדוק את תיבת הדואר שלך.');
      } else if (err.response?.status === 400) {
        setError('אימייל או סיסמה שגויים');
      } else {
        setError('שגיאה בהתחברות');
      }
    }
  };

  return (
    <StyledForm onSubmit={handleLogin}>
      <h2>התחברות</h2>
      {error && <StyledError>{error}</StyledError>}
      {success && <StyledSuccess>{success}</StyledSuccess>}

      <StyledInput.InputWrapper>
        <StyledInput.IconWrapper><FaEnvelope /></StyledInput.IconWrapper>
        <StyledInput.Input
          type="email"
          placeholder="אימייל"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </StyledInput.InputWrapper>

      <StyledInput.InputWrapper>
        <StyledInput.IconWrapper><FaLock /></StyledInput.IconWrapper>
        <StyledInput.Input
          type="password"
          placeholder="סיסמה"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </StyledInput.InputWrapper>

      <div style={{
        display: 'flex',
        justifyContent: 'flex-end',
        alignItems: 'center',
        marginBottom: '10px'
      }}>
        <label style={{ fontSize: '0.9rem', cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={rememberMe}
            onChange={(e) => setRememberMe(e.target.checked)}
            style={{ marginRight: '5px' }}
          />
          זכור אותי
        </label>
      </div>

      <StyledButton type="submit">התחבר</StyledButton>
    </StyledForm>
  );
}

export default LoginForm;
