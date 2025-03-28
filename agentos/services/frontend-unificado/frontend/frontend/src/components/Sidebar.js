import React from 'react';
import NavLinkGroup from './NavLinkGroup';

const Sidebar = () => {
  const links = [
    { to: '/admin/dashboard', text: 'Dashboard' },
    { to: '/admin/people', text: 'People' },
    { to: '/admin/payments', text: 'Payments' },
    { to: '/admin/shifts', text: 'Shifts' }
  ];

  return (
    <aside className="sidebar">
      <nav>
        <NavLinkGroup links={links} />
      </nav>
    </aside>
  );
};

export default Sidebar;