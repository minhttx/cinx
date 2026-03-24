import React, { useEffect } from 'react';
import SearchBar from '../components/SearchBar';
import '../styles/HomePage.css';

const HomePage = () => {
  useEffect(() => {
    // Basic cleanup just in case
    return () => document.body.classList.remove('booking-flow-active');
  }, []);

  const handleOpenCinx = () => {
    window.dispatchEvent(new CustomEvent('openCinxChat'));
  };

  return (
    <div className="homepage">
      <main className="homepage-main">
        {/* Hero Section Only */}
        <section className="hero-section" style={{ 
          backgroundImage: `linear-gradient(rgba(30, 24, 20, 0.4), rgba(30, 24, 20, 0.9)), url(${process.env.PUBLIC_URL}/img/hero-bg.jpg)`,
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        }}>
          <div className="hero-content">
            <h1 className="hero-title">CinX (づ ￣ ³￣)づ</h1>
            <p className="hero-subtitle">Trải nghiệm nền tảng AI Cinema hàng đầu Việt Nam</p>
            <div className="hero-search-wrapper">
              <SearchBar onCinxClick={handleOpenCinx} />
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default HomePage;
