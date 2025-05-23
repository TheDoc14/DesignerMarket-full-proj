import styled from 'styled-components';

export const MenuWrapper = styled.div`
  position: absolute;
  top: 50px;
  right: 0;
  background-color: white;
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 12px;
  min-width: 180px;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
  z-index: 1000;
`;

export const MenuHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  border-bottom: 1px solid #ccc;
  padding-bottom: 8px;
  margin-bottom: 8px;
`;

export const MenuItem = styled.div`
  padding: 8px;
  cursor: pointer;
  transition: background-color 0.2s;
  font-size: 14px;

  &:hover {
    background-color: #f5f5f5;
  }
`;

export const AuthLinks = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

export const LogoutButton = styled.button`
  width: 100%;
  background-color: #f44336;
  color: white;
  padding: 8px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  margin-top: 10px;
`;

export const ProfileImage = styled.img`
  width: 40px;
  height: 40px;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid #4CAF50;
`;
