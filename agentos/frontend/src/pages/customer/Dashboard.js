import React, { useEffect, useState } from 'react';
import { apiGet } from '../../services/api';
import Spinner from '../../components/Spinner';

const Dashboard = () => {
  const [account, setAccount] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const data = await apiGet('/office/customer/account');
        setAccount(data);
      } catch (err) {
        console.error('Error fetching customer data:', err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) return <Spinner />;
  if (!account) return <p>Could not load account details.</p>;

  return (
    <div className="customer-dashboard">
      <h2>Your Dashboard</h2>
      <div className="account-info">
        <p><strong>Name:</strong> {account.name}</p>
        <p><strong>Email:</strong> {account.email}</p>
      </div>
      <div className="order-history">
        <h3>Recent Orders</h3>
        {/* Render your order list here */}
      </div>
    </div>
  );
};

export default Dashboard;