import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import MovieCard from '../components/MovieCard';
import MovieCardSkeleton from '../components/MovieCardSkeleton';
import MovieInfoSidebar from '../components/MovieInfoSidebar';
import { movieAPI } from '../services/api';
import '../styles/HomePage.css';
import '../styles/SearchPage.css';

const SearchPage = () => {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedMovie, setSelectedMovie] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  // Extract query from URL: /search?q=...
  const query = new URLSearchParams(location.search).get('q') || '';

  useEffect(() => {
    if (query) {
      performSearch(query);
      window.scrollTo(0, 0); // Scroll to top when search results update
    } else {
      setResults([]);
    }
  }, [query]);

  const performSearch = async (searchQuery) => {
    try {
      setLoading(true);
      setError('');
      
      const { data, error: apiError } = await movieAPI.searchMovies(searchQuery);
      
      if (apiError) throw apiError;
      
      setResults(data || []);
    } catch (err) {
      console.error('Search error:', err);
      setError('Đã xảy ra lỗi khi tìm kiếm phim. Vui lòng thử lại sau.');
    } finally {
      setLoading(false);
    }
  };

  const handleShowInfo = (movie) => {
    setSelectedMovie(movie);
    setSidebarOpen(true);
  };

  const handleCloseSidebar = () => {
    setSidebarOpen(false);
    setTimeout(() => setSelectedMovie(null), 300);
  };

  const handleBookTicket = (movieId) => {
    navigate(`/booking?movie=${movieId}`);
  };

  return (
    <div className="homepage search-page">
      <main>
        <div className="search-header-actions">
          <button className="back-btn" onClick={() => navigate(-1)}>
            <span className="material-symbols-outlined">arrow_back</span>
            Quay lại
          </button>
        </div>

        <section className="movies-section">
          <div className="section-header">
            <h2>Kết quả tìm kiếm cho: "{query}"</h2>
            <span className="results-count">{results.length} phim được tìm thấy</span>
          </div>

          {loading ? (
            <div className="movies-grid">
              {Array.from({ length: 10 }).map((_, index) => (
                <MovieCardSkeleton key={index} />
              ))}
            </div>
          ) : error ? (
            <div className="error-container">
              <div className="error-box">
                <h3>⚠️ Lỗi</h3>
                <p>{error}</p>
                <button onClick={() => performSearch(query)} className="retry-btn">
                  🔄 Thử lại
                </button>
              </div>
            </div>
          ) : (
            <div className="movies-grid">
              {results.length > 0 ? (
                results.map(movie => (
                  <MovieCard key={movie.id} movie={movie} onShowInfo={handleShowInfo} />
                ))
              ) : (
                <div className="no-content search-empty">
                  <div className="empty-icon">
                    <span className="material-symbols-outlined">search_off</span>
                  </div>
                  <h3>Không tìm thấy kết quả</h3>
                  <p>Chúng tôi không tìm thấy phim nào khớp với từ khóa <strong>"{query}"</strong>.</p>
                  <p>Gợi ý:</p>
                  <ul className="search-suggestions">
                    <li>Kiểm tra lại chính tả của từ khóa.</li>
                    <li>Thử tìm kiếm với tên phim tiếng Việt hoặc tiếng Anh.</li>
                    <li>Sử dụng các từ khóa ngắn gọn hơn (ví dụ: "Hành động", "Marvel").</li>
                  </ul>
                  <button onClick={() => navigate('/')} className="m3-btn m3-btn-filled mt-4">
                    Về trang chủ
                  </button>
                </div>
              )}
            </div>
          )}
        </section>

        {/* Movie Info Sidebar */}
        <MovieInfoSidebar 
          movie={selectedMovie}
          isOpen={sidebarOpen}
          onClose={handleCloseSidebar}
          onBookTicket={handleBookTicket}
        />
      </main>
    </div>
  );
};

export default SearchPage;
