import React, { useState, useEffect } from 'react';
import { contentAPI } from '../services/api';
import PromotionSidebar from '../components/PromotionSidebar';
import '../styles/components/Card.css';
import '../styles/NewsPage.css'; // Reusing NewsPage layout styles

const PromotionsPage = () => {
  const [promotions, setPromotions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPromotion, setSelectedPromotion] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const fetchPromotions = async () => {
      const { data, error } = await contentAPI.getPromotions();
      if (error) {
        console.error('Failed to load promotions:', error);
      } else {
        setPromotions(data || []);
      }
      setLoading(false);
    };

    fetchPromotions();
  }, []);

  const handlePromotionClick = (promotion) => {
    setSelectedPromotion(promotion);
    setSidebarOpen(true);
  };

  const handleCloseSidebar = () => {
    setSidebarOpen(false);
    setTimeout(() => setSelectedPromotion(null), 300);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Dài hạn';
    return new Date(dateString).toLocaleDateString('vi-VN');
  };

  if (loading) {
    return (
      <div className="news-page">
        <div className="cards-grid loading">
          {[...Array(6)].map((_, index) => (
            <div key={index} className="news-card skeleton" />
          ))}
        </div>
      </div>
    );
  }

  if (!promotions.length) {
    return (
      <div className="news-page">
        <div className="empty-state">
          <span className="empty-icon material-symbols-outlined">sell</span>
          <h2 className="empty-title">Chưa có khuyến mãi nào</h2>
          <p className="empty-description">Các ưu đãi hấp dẫn nhất sẽ được cập nhật sớm nhất.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="news-page">
      <div className="cards-grid">
        {promotions.map((promotion) => (
          <article key={promotion.id} className="card news-card" onClick={() => handlePromotionClick(promotion)}>
            <div className="news-card-image-container">
              {promotion.image_url ? (
                <img src={promotion.image_url} alt={promotion.title} className="news-card-image" />
              ) : (
                <div className="news-card-image-placeholder">
                  <span className="material-symbols-outlined">sell</span>
                </div>
              )}
            </div>
            
            <div className="card-content">
              <h2 className="news-card-title">{promotion.title}</h2>
              <p className="news-card-summary" style={{ WebkitLineClamp: 2 }}>{promotion.description}</p>
              <div className="news-card-meta">
                <span className="news-card-date">
                  Hạn dùng: {formatDate(promotion.end_date)}
                </span>
              </div>
            </div>
          </article>
        ))}
      </div>
      
      <PromotionSidebar 
        promotion={selectedPromotion}
        isOpen={sidebarOpen}
        onClose={handleCloseSidebar}
      />
    </div>
  );
};

export default PromotionsPage;
