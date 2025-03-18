import React from 'react';
import { Link } from 'react-router-dom';

const Home = () => {
  return (
    <section className="customer-home">
      <h1>Welcome to AgentOS (Customer)</h1>
      <p>This is your home page. Explore your dashboard, chat with an agent, etc.</p>
      <Link to="/customer/dashboard" className="btn">Go to Dashboard</Link>
    </section>
  );
};

export default Home;