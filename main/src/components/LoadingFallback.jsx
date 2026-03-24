import React, { useState, useEffect } from 'react';

const LoadingFallback = ({ 
  timeout = 15000, 
  onTimeout = null 
}) => {
  const [showTimeout, setShowTimeout] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowTimeout(true);
      if (onTimeout) onTimeout();
    }, timeout);

    return () => clearTimeout(timer);
  }, [timeout, onTimeout]);

  if (showTimeout) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        flexDirection: 'column',
        textAlign: 'center',
        padding: '2rem',
        backgroundColor: '#1E1814'
      }}>
        <div style={{
          backgroundColor: 'rgba(228, 189, 102, 0.05)',
          border: '1px solid rgba(228, 189, 102, 0.2)',
          borderRadius: '24px',
          padding: '40px',
          maxWidth: '500px'
        }}>
          <span className="material-symbols-outlined" style={{ fontSize: '48px', color: '#E4BD66', marginBottom: '20px' }}>timer</span>
          <h3 style={{ color: '#E4BD66', marginBottom: '10px' }}>Kết nối chậm</h3>
          <p style={{ marginBottom: '20px', color: 'rgba(255,255,255,0.7)', fontSize: '14px' }}>
            Hệ thống đang cố gắng kết nối với máy chủ. Vui lòng kiểm tra lại đường truyền internet của bạn.
          </p>
          <button 
            onClick={() => window.location.reload()}
            className="m3-btn m3-btn-filled"
            style={{ width: '100%' }}
          >
            Thử lại ngay
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '100vh',
      flexDirection: 'column',
      backgroundColor: '#1E1814'
    }}>
      <div className="cinema-loader">
        <div className="inner-dot"></div>
      </div>
      <style>{`
        .cinema-loader {
          width: 60px;
          height: 60px;
          border: 2px solid rgba(228, 189, 102, 0.1);
          border-top: 2px solid #E4BD66;
          border-radius: 50%;
          animation: spin 1s cubic-bezier(0.4, 0, 0.2, 1) infinite;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .inner-dot {
          width: 8px;
          height: 8px;
          background-color: #E4BD66;
          border-radius: 50%;
          box-shadow: 0 0 15px #E4BD66;
        }
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default LoadingFallback;
