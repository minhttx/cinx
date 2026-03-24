import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import SearchBar from './SearchBar';
import ProfileButton from './ProfileButton';
import '../styles/Header.css';

const Header = () => {
  const location = useLocation();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 80);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Map routes to page titles
  const getPageTitle = () => {
    const path = location.pathname;
    if (path === '/my-tickets') return 'Vé Của Tôi';
    if (path === '/upcoming') return 'Phim Sắp Chiếu';
    if (path === '/news') return 'Tin Tức Điện Ảnh';
    if (path === '/promotions') return 'Khuyến Mãi';
    if (path === '/profile') return 'Hồ Sơ Cá Nhân';
    if (path === '/booking') return 'Đặt Vé Xem Phim';
    if (path.startsWith('/movie/')) return 'Thông Tin Phim';
    return null; // No title for home or unknown pages
  };

  const pageTitle = getPageTitle();
  const hideSearch = location.pathname === '/' && !scrolled;

  const handleOpenCinx = () => {
    window.dispatchEvent(new CustomEvent('openCinxChat'));
  };

  return (
    <header className={`app-header ${location.pathname === '/' ? 'is-home' : ''}`}>
      <div className="header-container">
        {/* Page Title on the left (where logo used to be) */}
        <div className="header-title-section">
          {pageTitle && <h1 className="header-page-title">{pageTitle}</h1>}
        </div>

        {/* Search bar visibility logic controlled by CSS class based on hideSearch */}
        <div className={`header-search ${hideSearch ? 'hidden-on-hero' : ''}`}>
          <SearchBar onCinxClick={handleOpenCinx} />
        </div>

        {/* Profile button on the right on desktop */}
        <div className="header-actions">
          <ProfileButton />
        </div>
      </div>
    </header>
  );
};

export default Header;