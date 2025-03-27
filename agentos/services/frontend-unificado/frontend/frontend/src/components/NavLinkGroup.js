import React from 'react';
import { NavLink } from 'react-router-dom';

const NavLinkGroup = ({ links }) => {
  return (
    <ul>
      {links.map((link) => (
        <li key={link.to}>
          <NavLink to={link.to} className="sidebar-link">
            {link.text}
          </NavLink>
        </li>
      ))}
    </ul>
  );
};

export default NavLinkGroup;