// src/components/ProfileMenu.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  MenuWrapper,
  MenuHeader,
  MenuItem,
  ProfileImage,
  AuthLinks,
  LogoutButton
} from './styled/StyledProfileMenu';

function ProfileMenu({ user, setUser }) {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    navigate('/');
    window.location.reload();
  };

  return (
    <MenuWrapper>
      {user ? (
        <>
          <MenuHeader>
            <ProfileImage
              src={
                user.profileImage && user.profileImage.trim() !== ''
                  ? user.profileImage
                  : '/images/defaultAvatar.png'
              }
              alt="profile"
            />
            <p>שלום, {user.username}!</p>
          </MenuHeader>
          <MenuItem onClick={() => navigate('/profile')}>אזור אישי</MenuItem>
          <LogoutButton onClick={handleLogout}>התנתק</LogoutButton>
        </>
      ) : (
        <AuthLinks>
          <MenuItem onClick={() => navigate('/login')}>התחברות</MenuItem>
          <MenuItem onClick={() => navigate('/register')}>הרשמה</MenuItem>
        </AuthLinks>
      )}
    </MenuWrapper>
  );
}

export default ProfileMenu;
