import React from 'react';
import { Routes, Route } from 'react-router-dom';
import CustomerLayout from '../layouts/CustomerLayout';

import Home from '../pages/customer/Home';
import Dashboard from '../pages/customer/Dashboard';

const CustomerRoutes = () => {
  return (
    <CustomerLayout>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="dashboard" element={<Dashboard />} />
      </Routes>
    </CustomerLayout>
  );
};

export default CustomerRoutes;