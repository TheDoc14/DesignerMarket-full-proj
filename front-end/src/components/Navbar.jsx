// src/components/Navbar.jsx
import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  NavbarContainer,
  NavList,
  NavItem,
  NavLink,
  ProfileWrapper
} from './styled/StyledNavbar';
import { ProfileImage } from './styled/StyledProfileMenu';
import ProfileMenu from './ProfileMenu';

function Navbar({ user, setUser }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  const toggleMenu = () => {
    setMenuOpen((prev) => !prev);
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <NavbarContainer>
      <NavList>
        <NavItem>
          <NavLink className="text-primary" as={Link} to="/" >Home</NavLink>
        </NavItem>

        <NavItem ref={menuRef} style={{ position: 'relative' }}>
          <ProfileWrapper onClick={toggleMenu} style={{ position: 'relative' }}>
            <ProfileImage
              src={user?.profileImage && user.profileImage.trim() !== ''
                ? user.profileImage
                : '/images/defaultAvatar.png'}
              alt="Profile"
            />
          </ProfileWrapper>
          {menuOpen && <ProfileMenu user={user} setUser={setUser} />}
        </NavItem>
        <NavItem>
          <NavLink as={Link} to="/create-project">Create Project</NavLink>
        </NavItem>
           <NavItem>
          <NavLink as={Link} to="/projects">All Project</NavLink>
        </NavItem>
      </NavList>
    </NavbarContainer>
  );
}

export default Navbar;
