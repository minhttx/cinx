import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import MovieInfoSidebar from '../components/MovieInfoSidebar';
import GenericSkeleton from '../components/GenericSkeleton';
import { movieAPI } from '../services/api';
import '../styles/UpcomingPage.css';

const UpcomingPage = () => {
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMovie, setSelectedMovie] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();
  const scrollRef = useRef(null);

  // Scroll tracking state
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const checkScroll = () => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      setCanScrollLeft(scrollLeft > 1);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 1);
    }
  };

  useEffect(() => {
    const fetchUpcomingMovies = async () => {
      setLoading(true);
      const { data, error } = await movieAPI.getComingSoonMovies();
      if (!error) {
        const sorted = (data || []).sort((a, b) => 
          new Date(a.release_date || a.releaseDate) - new Date(b.release_date || b.releaseDate)
        );
        setMovies(sorted);
      }
      setLoading(false);
    };
    fetchUpcomingMovies();
  }, []);

  useEffect(() => {
    checkScroll();
    window.addEventListener('resize', checkScroll);
    return () => window.removeEventListener('resize', checkScroll);
  }, [movies]);

  const handleShowInfo = (movie) => {
    setSelectedMovie(movie);
    setSidebarOpen(true);
  };

  const handleCloseSidebar = () => {
    setSidebarOpen(false);
    setTimeout(() => setSelectedMovie(null), 300);
  };

  const scroll = (direction) => {
    if (scrollRef.current) {
      const { scrollLeft, clientWidth } = scrollRef.current;
      const scrollTo = direction === 'left' ? scrollLeft - clientWidth * 0.8 : scrollLeft + clientWidth * 0.8;
      scrollRef.current.scrollTo({ left: scrollTo, behavior: 'smooth' });
      setTimeout(checkScroll, 400);
    }
  };

  if (loading && movies.length === 0) {
    return (
      <div className="upcoming-page">
        <div className="timeline-outer-wrapper">
          <div className="timeline-container">
            <div className="timeline-line"></div>
            <div className="timeline-items">
              {Array.from({ length: 5 }).map((_, idx) => (
                <div key={`skeleton-${idx}`} className={`timeline-item ${idx % 2 === 0 ? 'top' : 'bottom'}`}>
                  <div className="timeline-dot"></div>
                  <div className="timeline-content">
                    <GenericSkeleton width="60px" height="14px" borderRadius="4px" />
                    <div className="mini-movie-card">
                      <GenericSkeleton width="110px" height="165px" borderRadius="8px" />
                      <div className="mini-info" style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'center', marginTop: '10px' }}>
                        <GenericSkeleton width="120px" height="16px" />
                        <GenericSkeleton width="80px" height="12px" />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="upcoming-page">
      <div className="timeline-outer-wrapper">
        <div 
          className="timeline-container" 
          ref={scrollRef}
          onScroll={checkScroll}
        >
          <div className="timeline-line"></div>
          
          <div className="timeline-items">
            {movies.length > 0 ? (
              movies.map((movie, index) => {
                const isEven = index % 2 === 0;
                const releaseDate = new Date(movie.release_date || movie.releaseDate);
                
                return (
                  <div key={movie.id} className={`timeline-item ${isEven ? 'top' : 'bottom'}`}>
                    <div className="timeline-dot"></div>
                    
                    <div className="timeline-content" onClick={() => handleShowInfo(movie)}>
                      <div className="timeline-date">
                        {releaseDate.toLocaleDateString('vi-VN', { month: 'short', day: 'numeric' })}
                      </div>
                      <div className="mini-movie-card">
                        <img src={movie.poster} alt={movie.title} className="mini-poster" />
                        <div className="mini-info">
                          <h3 className="mini-title">{movie.title}</h3>
                          <p className="mini-genre">{movie.genre}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="no-upcoming">
                <p>Hiện tại chưa có thông tin phim sắp chiếu.</p>
              </div>
            )}
          </div>
        </div>

        <button 
          className="nav-btn prev" 
          onClick={() => scroll('left')}
          disabled={!canScrollLeft}
        >
          <span className="material-symbols-outlined">chevron_left</span>
        </button>
        <button 
          className="nav-btn next" 
          onClick={() => scroll('right')}
          disabled={!canScrollRight}
        >
          <span className="material-symbols-outlined">chevron_right</span>
        </button>
      </div>

      <MovieInfoSidebar 
        movie={selectedMovie}
        isOpen={sidebarOpen}
        onClose={handleCloseSidebar}
        onBookTicket={(id) => navigate(`/booking?movie=${id}`)}
      />
    </div>
  );
};

export default UpcomingPage;
