// src/components/styled/StyledNavbar.jsx
import styled from 'styled-components';

export const NavbarContainer = styled.nav`
  background-color: #4CAF50;
  padding: 10px 20px;
  display: flex;
  justify-content: center;
  overflow: visible; /* <-- מאפשר הצגת תפריטים שנפתחים החוצה */
`;

export const NavList = styled.ul`
  list-style: none;
  display: flex;
  gap: 20px;
  align-items: center;
  margin: 0;
  padding: 0;
`;

export const NavItem = styled.li`
  position: relative; /* <-- חשוב מאוד בשביל מיקום אבסולוטי של ProfileMenu */
`;

export const NavLink = styled.a`
  text-decoration: none;
  color: white;
  font-weight: bold;
  cursor: pointer;
`;

export const ProfileWrapper = styled.div`
  cursor: pointer;
`;
