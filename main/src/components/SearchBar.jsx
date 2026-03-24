import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import '../styles/SearchBar.css';

const SearchBar = ({ onCinxClick }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // Synchronize search bar with URL
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const q = params.get('q');
    
    if (q) {
      if (q !== searchQuery) {
        setSearchQuery(q);
      }
    } else {
      if (location.pathname !== '/search' && searchQuery !== '') {
        setSearchQuery('');
      }
    }
  }, [location.pathname, location.search]);

  // Live search logic
  useEffect(() => {
    // ONLY TRIGGER INSTANT SEARCH ON DESKTOP (> 768px)
    if (window.innerWidth <= 768) return;

    const trimmedQuery = searchQuery.trim();
    if (trimmedQuery.length < 2) return;

    const currentParams = new URLSearchParams(location.search);
    if (location.pathname === '/search' && currentParams.get('q') === trimmedQuery) {
      return;
    }

    let timeoutId;

    if (searchQuery.endsWith(' ')) {
      navigate(`/search?q=${encodeURIComponent(trimmedQuery)}`, { replace: true });
    } else {
      timeoutId = setTimeout(() => {
        navigate(`/search?q=${encodeURIComponent(trimmedQuery)}`, { replace: true });
      }, 600);
    }

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [searchQuery, navigate, location.pathname]);

  const handleInputChange = (e) => {
    setSearchQuery(e.target.value);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const trimmedQuery = searchQuery.trim();
    if (trimmedQuery) {
      navigate(`/search?q=${encodeURIComponent(trimmedQuery)}`);
    }
  };

  const handleClear = () => {
    setSearchQuery('');
    navigate('/', { replace: true });
    document.querySelector('.search-input')?.focus();
  };

  return (
    <form className="search-bar" onSubmit={handleSubmit}>
      <div className={`search-container ${isFocused ? 'focused' : ''}`}>
        <button type="submit" className="search-icon-button">
          <span className="material-symbols-outlined">search</span>
        </button>
        
        <input
          type="text"
          className="search-input"
          placeholder="Tìm phim, hoặc để CinX hỗ trợ bạn! -->"
          value={searchQuery}
          onChange={handleInputChange}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
        />

        {searchQuery && (
          <button 
            type="button" 
            className="clear-button" 
            onClick={handleClear}
            aria-label="Xóa tìm kiếm"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        )}

        {onCinxClick && (
          <div className="search-divider"></div>
        )}

        {onCinxClick && (
          <button 
            type="button" 
            className="cinx-inline-button" 
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onCinxClick();
            }}
            title="Hỏi CinX AI"
          >
            <span className="material-symbols-outlined">robot_2</span>
          </button>
        )}
      </div>
    </form>
  );
};

export default SearchBar;
