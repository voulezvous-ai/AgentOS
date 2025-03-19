import React from 'react';
import Header from '../components/Header';
import ChatWidget from '../pages/customer/ChatWidget';

const CustomerLayout = ({ children }) => {
  return (
    <div className="customer-layout">
      <Header variant="customer" />
      <div className="customer-content">
        {children}
      </div>
      <ChatWidget />
    </div>
  );
};

export default CustomerLayout;