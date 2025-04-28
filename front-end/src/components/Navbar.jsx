// src/components/Navbar.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import { NavbarContainer, NavList, NavItem, NavLink } from './styled/StyledNavbar';

function Navbar() {
  return (
    <NavbarContainer>
      <NavList>
        <NavItem>
          <NavLink as={Link} to="/">Home</NavLink>
        </NavItem>
        <NavItem>
          <NavLink as={Link} to="/login">Login</NavLink>
        </NavItem>
        <NavItem>
          <NavLink as={Link} to="/register">Register</NavLink>
        </NavItem>
      </NavList>
    </NavbarContainer>
  );
}

export default Navbar;
