// src/components/StyledNavbar.jsx
import styled from 'styled-components';

export const NavbarContainer = styled.nav`
  background: white;
  padding: 10px 0;
`;

export const NavList = styled.ul`
  display: flex;
  justify-content: center;
  margin: 0;
  padding: 0;
  list-style: none;
`;

export const NavItem = styled.li`
  margin: 0 20px;
`;

export const NavLink = styled.a`
  text-decoration: none;
  color: #333;
  font-weight: bold;
  cursor: pointer;

  &:hover {
    color: #4CAF50;
  }
`;
