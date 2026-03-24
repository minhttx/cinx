import React from 'react';
import { Outlet } from 'react-router-dom';
import Header from '../components/Header';
import Navigation from '../components/Navigation';
import '../styles/MainLayout.css';

const MainLayout = () => {
  return (
    <div className="main-layout">
      <Header />
      <div className="layout-body">
        <Navigation />
        <main className="main-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default MainLayout;
