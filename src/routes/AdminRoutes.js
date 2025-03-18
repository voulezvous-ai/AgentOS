import React from 'react';
import { Routes, Route } from 'react-router-dom';
import AdminLayout from '../layouts/AdminLayout';

import Dashboard from '../pages/admin/Dashboard';
import People from '../pages/admin/People';
import Payments from '../pages/admin/Payments';
import Shifts from '../pages/admin/Shifts';

const AdminRoutes = () => {
  return (
    <AdminLayout>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="people" element={<People />} />
        <Route path="payments" element={<Payments />} />
        <Route path="shifts" element={<Shifts />} />
      </Routes>
    </AdminLayout>
  );
};

export default AdminRoutes;