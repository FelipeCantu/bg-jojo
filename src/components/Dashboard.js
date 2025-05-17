// src/components/Dashboard.js
import React from 'react';
import { useAuth } from '../context/AuthContext';
import styled from 'styled-components';
import { FaUser, FaHeart, FaShoppingCart, FaEnvelope } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';

const DashboardContainer = styled.div`
  padding: 2rem;
  max-width: 1200px;
  margin: 0 auto;
`;

const CardGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 1.5rem;
  margin-top: 2rem;
`;

const DashboardCard = styled.div`
  background: white;
  border-radius: 8px;
  padding: 1.5rem;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
  cursor: pointer;
  transition: transform 0.2s;
  
  &:hover {
    transform: translateY(-5px);
  }
  
  svg {
    font-size: 2rem;
    color: #4f46e5;
    margin-bottom: 1rem;
  }
`;

const Dashboard = () => {
  const { currentUser } = useAuth();
    const navigate = useNavigate();

  return (
    <DashboardContainer>
      <h1>Welcome Back, {currentUser?.displayName || 'User'}</h1>
      <p>Manage your account and activities</p>
      
      <CardGrid>
        <DashboardCard onClick={() => navigate('/profile')}>
          <FaUser />
          <h3>Your Profile</h3>
          <p>Update your personal information</p>
        </DashboardCard>

        <DashboardCard onClick={() => navigate('/')}>
          <FaHeart />
          <h3>Your Tributes</h3>
          <p>View and manage memorials</p>
        </DashboardCard>

        <DashboardCard onClick={() => navigate('/')}>
          <FaShoppingCart />
          <h3>Orders</h3>
          <p>View purchase history</p>
        </DashboardCard>

        <DashboardCard onClick={() => navigate('/')}>
          <FaEnvelope />
          <h3>Messages</h3>
          <p>Check your inbox</p>
        </DashboardCard>
      </CardGrid>

      {/* Recent Activity Section */}
      <section style={{ marginTop: '3rem' }}>
        <h2>Recent Activity</h2>
        {/* Map through recent activities */}
      </section>
    </DashboardContainer>
  );
};

export default Dashboard;