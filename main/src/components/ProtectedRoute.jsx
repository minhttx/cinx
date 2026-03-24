import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import LoadingFallback from './LoadingFallback';

const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const { user, userProfile, loading } = useAuth();
  const location = useLocation();

  // Show cinematic loader while checking auth
  if (loading) {
    return (
      <LoadingFallback 
        timeout={15000}
        onTimeout={() => {
          console.error('❌ Auth loading timeout');
        }}
      />
    );
  }

  // If no user, redirect to login
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // If roles restriction required
  if (allowedRoles.length > 0) {
    // If user profile hasn't loaded yet, wait
    if (user && !userProfile) {
      return (
        <LoadingFallback 
          timeout={12000}
          onTimeout={() => {
            console.error('❌ User profile load timeout');
          }}
        />
      );
    }
    
    // Check if user's role is in the allowed list
    if (!allowedRoles.includes(userProfile?.role)) {
      return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        flexDirection: 'column',
        backgroundColor: '#1E1814',
        padding: '2rem'
      }}>
        <div style={{
          textAlign: 'center',
          padding: '40px',
          backgroundColor: 'rgba(228, 189, 102, 0.05)',
          borderRadius: '24px',
          border: '1px solid rgba(228, 189, 102, 0.2)',
          maxWidth: '500px',
          width: '100%'
        }}>
          <span className="material-symbols-outlined" style={{ fontSize: '64px', color: '#ff4444', marginBottom: '20px' }}>block</span>
          <h2 style={{ color: '#ffffff', marginBottom: '10px' }}>Truy cập bị từ chối</h2>
          <p style={{ color: 'rgba(255,255,255,0.7)', marginBottom: '32px' }}>
            Bạn không có quyền truy cập vào khu vực này. Vui lòng liên hệ quản trị viên để được hỗ trợ.
          </p>
          <button
            onClick={() => window.history.back()}
            className="m3-btn m3-btn-filled"
            style={{ width: '100%' }}
          >
            Quay lại
          </button>
        </div>
      </div>
      );
    }
  }

  return children;
};

export default ProtectedRoute;
