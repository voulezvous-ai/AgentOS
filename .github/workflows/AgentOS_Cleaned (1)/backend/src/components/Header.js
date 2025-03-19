import React from 'react';
import { NavLink } from 'react-router-dom';

const Header = ({ variant = 'admin' }) => {
  return (
    <header className={`header header-${variant}`}>
      <div className="logo">AgentOS</div>
      <nav className="nav">
        {variant === 'admin' && (
          <>
            <NavLink to="/" end className="nav-link">Landing</NavLink>
            <NavLink to="/admin" className="nav-link">Admin</NavLink>
            <NavLink to="/admin/people" className="nav-link">People</NavLink>
            <NavLink to="/admin/payments" className="nav-link">Payments</NavLink>
            <NavLink to="/admin/shifts" className="nav-link">Shifts</NavLink>
            <NavLink to="/customer" className="nav-link">Customer</NavLink>
          </>
        )}
        {variant === 'customer' && (
          <>
            <NavLink to="/" end className="nav-link">Landing</NavLink>
            <NavLink to="/customer" className="nav-link">Home</NavLink>
            <NavLink to="/customer/dashboard" className="nav-link">Dashboard</NavLink>
            <NavLink to="/admin" className="nav-link">Admin</NavLink>
          </>
        )}
      </nav>
    </header>
  );
};

export default Header;