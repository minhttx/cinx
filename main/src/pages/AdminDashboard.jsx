import React, { useState } from 'react';
import AdminOverview from '../components/admin/AdminOverview';
import MovieManagement from '../components/admin/MovieManagement';
import UserManagement from '../components/admin/UserManagement';
import Analytics from '../components/admin/Analytics';
import SeatingPricingManagement from '../components/admin/SeatingPricingManagement';
import NewsManagement from '../components/admin/NewsManagement';
import PromotionsManagement from '../components/admin/PromotionsManagement';
import CinemaRoomManagement from '../components/admin/CinemaRoomManagement';
import CommentModeration from '../components/admin/CommentModeration';

import '../styles/AdminDashboard.css';

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [timeRange, setTimeRange] = useState('7');
  const [isScreenTooSmall, setIsScreenTooSmall] = useState(window.innerWidth < 1024);

  React.useEffect(() => {
    const handleResize = () => {
      setIsScreenTooSmall(window.innerWidth < 1024);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Using Material Symbols for icons
  const tabItems = [
    { id: 'overview', label: 'Tổng quan', icon: 'dashboard' },
    { id: 'movies', label: 'Phim', icon: 'theaters' },
    { id: 'seating', label: 'Cấu hình giá', icon: 'event_seat' },
    { id: 'rooms', label: 'Phòng chiếu', icon: 'meeting_room' },
    { id: 'news', label: 'Tin tức', icon: 'newspaper' },
    { id: 'promotions', label: 'Khuyến mãi', icon: 'sell' },
    { id: 'comments', label: 'Bình luận', icon: 'forum' },
    { id: 'users', label: 'Người dùng', icon: 'group' },
    { id: 'analytics', label: 'Doanh thu', icon: 'payments' },
  ];

  const triggerAction = (actionType) => {
    window.dispatchEvent(new CustomEvent(`admin-action-${actionType}`));
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'overview': return <AdminOverview onTabChange={setActiveTab} />;
      case 'movies': return <MovieManagement />;
      case 'seating': return <SeatingPricingManagement />;
      case 'rooms': return <CinemaRoomManagement />;
      case 'news': return <NewsManagement />;
      case 'promotions': return <PromotionsManagement />;
      case 'comments': return <CommentModeration />;
      case 'users': return <UserManagement />;
      case 'analytics': return <Analytics timeRange={timeRange} />;
      default: return <AdminOverview />;
    }
  };

  const currentTabLabel = tabItems.find(item => item.id === activeTab)?.label;

  if (isScreenTooSmall) {
    return (
      <div className="mobile-restriction-overlay">
        <div className="restriction-card">
          <span className="material-symbols-outlined restriction-icon">desktop_windows</span>
          <h2>Yêu cầu máy tính</h2>
          <p>Trang quản trị (CinX Admin Panel) yêu cầu màn hình lớn để hiển thị đầy đủ các công cụ quản lý phức tạp. Vui lòng truy cập bằng máy tính để có trải nghiệm tốt nhất.</p>
          <a href="/" className="m3-btn m3-btn-filled">
            <span className="material-symbols-outlined">home</span>
            Quay về trang chủ
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-dashboard-layout">
      {/* Standalone Admin Header */}
      <header className="admin-header">
        <div className="admin-header-left">
          <span className="material-symbols-outlined admin-logo-icon">shield_person</span>
          <div className="admin-breadcrumb">
            <h1 className="admin-header-title">CinX Admin Panel</h1>
            <span className="breadcrumb-separator">keyboard_arrow_right</span>
            <span className="admin-module-title">{currentTabLabel}</span>
          </div>

          {/* Module-specific Actions */}
          <div className="admin-header-actions">
            {['movies', 'news', 'promotions'].includes(activeTab) && (
              <button className="action-icon-btn" onClick={() => triggerAction('add')} title="Thêm mới">
                <span className="material-symbols-outlined">add_circle</span>
              </button>
            )}
            
            {activeTab === 'overview' && (
              <button className="action-icon-btn" onClick={() => triggerAction('refresh')} title="Làm mới">
                <span className="material-symbols-outlined">refresh</span>
              </button>
            )}

            {activeTab === 'analytics' && (
              <div className="header-filter-wrapper" style={{ display: 'flex', gap: '12px' }}>
                <button className="action-icon-btn" onClick={() => triggerAction('export')} title="Xuất báo cáo Excel">
                  <span className="material-symbols-outlined">download</span>
                </button>
                <select 
                  className="header-select" 
                  value={timeRange} 
                  onChange={(e) => setTimeRange(e.target.value)}
                >
                  <option value="7">7 ngày qua</option>
                  <option value="30">30 ngày qua</option>
                  <option value="90">90 ngày qua</option>
                  <option value="365">1 năm qua</option>
                </select>
              </div>
            )}
          </div>
        </div>
        
        <div className="admin-header-right">
          <a href="/" target="_blank" rel="noopener noreferrer" className="m3-btn m3-btn-tonal open-site-btn">
            <span className="material-symbols-outlined">open_in_new</span>
            <span>Open Website</span>
          </a>
        </div>
      </header>

      <div className="admin-body">
        <aside className="admin-sidebar">
          <nav className="admin-nav">
            {tabItems.map(item => (
              <button
                key={item.id}
                className={`admin-nav-item ${activeTab === item.id ? 'active' : ''}`}
                onClick={() => setActiveTab(item.id)}
              >
                <span className="material-symbols-outlined">{item.icon}</span>
                <span className="nav-label">{item.label}</span>
              </button>
            ))}
          </nav>
        </aside>

        <main className="admin-main-content">
          {renderContent()}
        </main>
      </div>
    </div>
  );
};

export default AdminDashboard;
