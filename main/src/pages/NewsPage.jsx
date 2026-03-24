import React, { useState, useEffect } from 'react';
import { contentAPI } from '../services/api';
import NewsSidebar from '../components/NewsSidebar';
import '../styles/components/Card.css';
import '../styles/NewsPage.css';

const NewsPage = () => {
  const [newsItems, setNewsItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedNews, setSelectedNews] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const fetchNews = async () => {
      const { data, error } = await contentAPI.getNews();
      if (error) {
        console.error('Failed to load news:', error);
      } else {
        setNewsItems(data || []);
      }
      setLoading(false);
    };

    fetchNews();
  }, []);

  const handleNewsClick = (newsItem) => {
    setSelectedNews(newsItem);
    setSidebarOpen(true);
  };

  const handleCloseSidebar = () => {
    setSidebarOpen(false);
    // Wait for animation to complete before clearing selected news
    setTimeout(() => setSelectedNews(null), 300);
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

  if (!newsItems.length) {
    return (
      <div className="news-page">
        <div className="empty-state">
          <span className="empty-icon material-symbols-outlined">article</span>
          <h2 className="empty-title">Chưa có tin tức nào</h2>
          <p className="empty-description">Các tin tức mới nhất sẽ được cập nhật sớm nhất.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="news-page">
      <div className="cards-grid">
        {newsItems.map((newsItem) => (
          <article key={newsItem.id} className="card news-card" onClick={() => handleNewsClick(newsItem)}>
            <div className="news-card-image-container">
              {newsItem.image_url ? (
                <img src={newsItem.image_url} alt={newsItem.title} className="news-card-image" />
              ) : (
                <div className="news-card-image-placeholder">
                  <span className="material-symbols-outlined">article</span>
                </div>
              )}
            </div>
            
            <div className="card-content">
              <h2 className="news-card-title">{newsItem.title}</h2>
              {newsItem.summary && (
                <p className="news-card-summary">{newsItem.summary}</p>
              )}
              <div className="news-card-meta">
                <span className="news-card-date">
                  {new Date(newsItem.publish_date).toLocaleDateString('vi-VN')}
                </span>
              </div>
            </div>
          </article>
        ))}
      </div>
      
      <NewsSidebar 
        newsItem={selectedNews}
        isOpen={sidebarOpen}
        onClose={handleCloseSidebar}
      />
    </div>
  );
};

export default NewsPage;
