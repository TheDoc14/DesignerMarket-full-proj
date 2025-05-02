import React from 'react';
import styled from 'styled-components';
import StyledButton from '../components/styled/StyledButton';

const ProfileContainer = styled.div`
  max-width: 500px;
  margin: 50px auto;
  background: white;
  padding: 30px;
  border-radius: 12px;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
  text-align: center;
`;

const ProfileImage = styled.img`
  width: 120px;
  height: 120px;
  border-radius: 50%;
  object-fit: cover;
  margin-bottom: 20px;
  border: 3px solid #4CAF50;
`;

const Username = styled.h2`
  color: #333;
  margin-bottom: 10px;
`;

const Email = styled.p`
  color: #666;
  margin-bottom: 10px;
`;

const Role = styled.p`
  font-weight: bold;
  color: #4CAF50;
`;

function ProfilePage() {
  const user = JSON.parse(localStorage.getItem('user'));

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
  };

  if (!user) {
    return <p style={{ textAlign: 'center' }}>משתמש לא מחובר</p>;
  }

  return (
    <ProfileContainer>
      {user.profileImage && (
        <ProfileImage src={user.profileImage} alt="Profile" />
      )}
      <Username>{user.username}</Username>
      <Email>{user.email}</Email>
      <Role>Role: {user.role}</Role>
      <br />
      <StyledButton onClick={handleLogout}>Logout</StyledButton>
    </ProfileContainer>
  );
}

export default ProfilePage;
