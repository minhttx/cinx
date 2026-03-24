import React, { useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import '../styles/NewsSidebar.css';

const NewsSidebar = ({ newsItem, isOpen, onClose }) => {
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

  if (!newsItem) return null;

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
          {newsItem.image_url && (
            <div className="news-image-container">
              <img src={newsItem.image_url} alt={newsItem.title} className="news-image" />
            </div>
          )}
          
          <div className="news-content">
            <h1 className="news-title">{newsItem.title}</h1>
            
            <div className="news-meta">
              <span className="news-date">
                {new Date(newsItem.publish_date).toLocaleDateString('vi-VN', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </span>
            </div>
            
            {newsItem.summary && (
              <div className="news-summary">
                {newsItem.summary}
              </div>
            )}
            
            <div className="news-body">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {newsItem.content}
              </ReactMarkdown>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default NewsSidebar;