import React from 'react';
import Header from '../components/Header';
import Sidebar from '../components/Sidebar';

const AdminLayout = ({ children }) => {
  return (
    <div className="admin-layout">
      <Header variant="admin" />
      <div className="admin-main-content">
        <Sidebar />
        <div className="admin-page-content">
          {children}
        </div>
      </div>
    </div>
  );
};

export default AdminLayout;