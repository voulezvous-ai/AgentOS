import React, { useEffect, useState } from 'react';
import { apiGet } from '../../services/api';
import Spinner from '../../components/Spinner';

const Dashboard = () => {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const data = await apiGet('/office/admin/metrics');
        setMetrics(data);
      } catch (err) {
        console.error('Error fetching metrics:', err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) return <Spinner />;
  if (!metrics) return <p>Failed to load metrics.</p>;

  return (
    <div className="admin-dashboard">
      <h2>Admin Dashboard</h2>
      <div className="metrics">
        <div className="metric-card">
          <h3>Orders</h3>
          <p>{metrics.orders}</p>
        </div>
        <div className="metric-card">
          <h3>People</h3>
          <p>{metrics.people}</p>
        </div>
        <div className="metric-card">
          <h3>Payments</h3>
          <p>{metrics.payments}</p>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;