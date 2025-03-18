import React from 'react';
import { Link } from 'react-router-dom';

const Landing = () => {
  return (
    <section className="landing">
      <h1>AgentOS Unified Landing</h1>
      <p>Welcome! Please choose an area below:</p>
      <div style={{ marginTop: '20px' }}>
        <Link to="/admin" className="btn">Go to Admin</Link>
        <Link to="/customer" className="btn" style={{ marginLeft: '8px' }}>Go to Customer</Link>
      </div>
    </section>
  );
};

export default Landing;