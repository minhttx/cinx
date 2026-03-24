import React, { useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import '../styles/NewsSidebar.css'; // Reusing the same styles

const PromotionSidebar = ({ promotion, isOpen, onClose }) => {
  // Lock body scroll when sidebar is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [isOpen]);

  if (!promotion) return null;

  const formatDate = (dateString) => {
    if (!dateString) return 'Không giới hạn';
    return new Date(dateString).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <>
      {/* Overlay */}
      <div 
        className={`news-sidebar-overlay ${isOpen ? 'open' : ''}`}
        onClick={onClose}
      />
      
      {/* Sidebar */}
      <div className={`news-sidebar ${isOpen ? 'open' : ''}`}>
        <button className="sidebar-close-btn" onClick={onClose} aria-label="Đóng">
          <span className="material-symbols-outlined">close</span>
        </button>
        
        <div className="sidebar-content">
          {promotion.image_url && (
            <div className="news-image-container">
              <img src={promotion.image_url} alt={promotion.title} className="news-image" />
            </div>
          )}
          
          <div className="news-content">
            <h1 className="news-title">{promotion.title}</h1>
            
            <div className="news-meta">
              <span className="news-date">
                Có hiệu lực: {formatDate(promotion.start_date)} - {formatDate(promotion.end_date)}
              </span>
            </div>
            
            <div className="news-body" style={{ marginTop: '24px' }}>
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {promotion.description}
              </ReactMarkdown>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default PromotionSidebar;
