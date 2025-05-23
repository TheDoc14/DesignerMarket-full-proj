import React from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';

const Container = styled.div`
  min-height: 70vh;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  background-color: #e8f5e9;
  padding: 20px;
  text-align: center;
`;

const Title = styled.h2`
  color: #2e7d32;
  margin-bottom: 20px;
`;

const Message = styled.p`
  color: #388e3c;
  font-size: 16px;
  margin-bottom: 30px;
`;

const Button = styled.button`
  background-color: #4caf50;
  color: white;
  border: none;
  padding: 12px 24px;
  font-size: 14px;
  border-radius: 8px;
  cursor: pointer;

  &:hover {
    background-color: #43a047;
  }
`;

function EmailVerificationNotice() {
  const navigate = useNavigate();

  return (
    <Container>
      <Title>כמעט סיימנו!</Title>
      <Message>שלחנו אליך מייל לאימות. אנא בדוק את תיבת הדואר ולחץ על הקישור לאימות החשבון.</Message>
      <Button onClick={() => navigate('/login')}>מעבר להתחברות</Button>
    </Container>
  );
}

export default EmailVerificationNotice;
