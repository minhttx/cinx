import React from 'react';
import '../styles/MovieCardSkeleton.css';

const MovieCardSkeleton = () => {
  return (
    <div className="movie-card-skeleton">
      <div className="poster-skeleton"></div>
      <div className="info-skeleton">
        <div className="title-skeleton"></div>
        <div className="genre-skeleton"></div>
      </div>
    </div>
  );
};

export default MovieCardSkeleton;
