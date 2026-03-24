import React from 'react';
import '../styles/MovieCard.css';
import '../styles/components/Card.css';

const MovieCard = ({ movie, isComingSoon = false, onShowInfo, showReleaseDate = true, smartInfo }) => {
  const formatRating = (rating) => {
    return rating ? `${Math.round(rating)}%` : 'N/A';
  };

  const formatDuration = (duration) => {
    if (!duration) return 'N/A';
    if (typeof duration === 'number') return `${duration} phút`;
    return duration;
  };

  const formatDate = (date) => {
    if (!date) return 'N/A';
    try {
      return new Date(date).toLocaleDateString('vi-VN');
    } catch (error) {
      return date;
    }
  };

  const getAgeLabelClass = (age) => {
    if (!age) return '';
    const cleanAge = age.toUpperCase();
    switch (cleanAge) {
      case 'P': return 'age-p';
      case 'K': return 'age-k';
      case 'T13': return 'age-t13';
      case 'T16': return 'age-t16';
      case 'T18': return 'age-t18';
      default: return '';
    }
  };

  return (
    <div 
      className="movie-card-enhanced" 
      onClick={() => onShowInfo && onShowInfo(movie)}
      style={{ cursor: 'pointer' }}
    >
      <div className="movie-poster">
        <img 
          src={movie.poster || 'https://images.unsplash.com/photo-1485846234645-a62644f84728?q=80&w=500&auto=format&fit=crop'} 
          alt={movie.title}
          loading="lazy"
          onError={(e) => {
            e.target.src = 'https://images.unsplash.com/photo-1485846234645-a62644f84728?q=80&w=500&auto=format&fit=crop';
          }}
        />
        {movie.age && (
          <div className={`age-badge ${getAgeLabelClass(movie.age)}`}>
            {movie.age}
          </div>
        )}
        {movie.rating !== undefined && movie.rating !== null && (
          <div className="movie-rating">
            ⭐ {formatRating(Number(movie.rating))}
          </div>
        )}
      </div>
      
      <div className="movie-info">
        <h3 className="movie-title">{movie.title}</h3>
        <p className="movie-genre">{movie.genre}</p>
        <div className="movie-details">
          { (movie.status === 'coming' || isComingSoon) ? (
            <span className="movie-status-tag coming">SẮP CHIẾU</span>
          ) : (
            <div className="duration-smart-container">
              <span className="movie-duration">🕐 {formatDuration(movie.duration)}</span>
              {smartInfo && (
                <div className="smart-match-info">
                  <span className="material-symbols-outlined">robot_2</span>
                  Có {smartInfo} suất phù hợp cho bạn!
                </div>
              )}
            </div>
          )}
          {showReleaseDate && (
            <span className="movie-release">📅 {formatDate(movie.release_date || movie.releaseDate)}</span>
          )}
        </div>
      </div>
    </div>
  );
};

export default MovieCard;
