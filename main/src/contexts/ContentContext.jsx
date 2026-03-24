import React, { createContext, useContext, useState, useEffect } from 'react';
import { contentAPI } from '../services/api';

const ContentContext = createContext();

export const useContent = () => {
  const context = useContext(ContentContext);
  if (!context) {
    throw new Error('useContent must be used within a ContentProvider');
  }
  return context;
};

export const ContentProvider = ({ children }) => {
  const [news, setNews] = useState([]);
  const [promotions, setPromotions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadContent();
  }, []);

  const loadContent = async () => {
    try {
      setLoading(true);
      
      const [newsResult, promotionsResult] = await Promise.all([
        contentAPI.getNews(3), // Get latest 3 news items
        contentAPI.getPromotions(true) // Get active promotions only
      ]);
      
      if (!newsResult.error) {
        setNews(newsResult.data || []);
      }
      
      if (!promotionsResult.error) {
        setPromotions(promotionsResult.data || []);
      }
      
    } catch (err) {
      console.error('Error loading content:', err);
    } finally {
      setLoading(false);
    }
  };

  const value = {
    news,
    promotions,
    loading,
    refreshContent: loadContent
  };

  return (
    <ContentContext.Provider value={value}>
      {children}
    </ContentContext.Provider>
  );
};