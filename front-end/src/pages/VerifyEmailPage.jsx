import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import axios from 'axios';

const Container = styled.div`
  min-height: 70vh;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  background-color: #e3f2fd;
  padding: 20px;
  text-align: center;
`;

const Title = styled.h2`
  color: #1565c0;
  margin-bottom: 20px;
`;

const Message = styled.p`
  color: #0d47a1;
  font-size: 16px;
  margin-bottom: 30px;
`;

const Error = styled.p`
  color: #d32f2f;
  font-size: 16px;
  margin-bottom: 30px;
`;

const Button = styled.button`
  background-color: #1976d2;
  color: white;
  border: none;
  padding: 12px 24px;
  font-size: 14px;
  border-radius: 8px;
  cursor: pointer;
  &:hover {
    background-color: #1565c0;
  }
`;

function VerifyEmailPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const [status, setStatus] = useState(null);

  useEffect(() => {
    const token = new URLSearchParams(location.search).get("token");

    if (!token) {
      setStatus("missing");
      return;
    }

    axios
      .get(`http://localhost:5000/api/auth/verify-email?token=${token}`)
      .then(() => {
        setStatus("success");
      })
      .catch((err) => {
        const errorMsg = err?.response?.data?.error;

        if (errorMsg === "Invalid or expired token") {
          setStatus("expired");
        } else if (errorMsg === "User already verified") {
          setStatus("success");
        } else {
          console.error("Verification error:", err);
          setStatus("error");
        }
      });
  }, [location]);

  return (
    <Container>
      {status === "success" && (
        <>
          <Title>המשתמש אומת בהצלחה ✅</Title>
          <Message>כתובת המייל שלך אומתה, תוכל להתחבר כעת למערכת.</Message>
          <Button onClick={() => navigate("/login")}>מעבר להתחברות</Button>
        </>
      )}

      {status === "expired" && (
        <>
          <Title>שגיאה באימות ❌</Title>
          <Error>הקישור פג תוקף או לא תקין.</Error>
          <Button onClick={() => navigate("/")}>חזרה לדף הבית</Button>
        </>
      )}

      {status === "missing" && (
        <>
          <Title>חסר טוקן אימות</Title>
          <Error>לא ניתן לבצע אימות ללא טוקן.</Error>
          <Button onClick={() => navigate("/")}>חזרה לדף הבית</Button>
        </>
      )}

      {status === "error" && (
        <>
          <Title>שגיאה באימות ❌</Title>
          <Error>אירעה שגיאה בלתי צפויה במהלך האימות.</Error>
          <Button onClick={() => navigate("/")}>חזרה לדף הבית</Button>
        </>
      )}
    </Container>
  );
}

export default VerifyEmailPage;
