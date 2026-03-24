import React from 'react';
import '../styles/MovieCardSkeleton.css'; // Reusing pulse animation

const GenericSkeleton = ({ width = '100%', height = '20px', borderRadius = '4px', className = '' }) => {
  return (
    <div 
      className={`generic-skeleton ${className}`}
      style={{ 
        width, 
        height, 
        borderRadius,
        backgroundColor: 'rgba(228, 189, 102, 0.05)',
        animation: 'cinema-pulse 1.5s infinite ease-in-out',
        border: '1px solid rgba(228, 189, 102, 0.05)'
      }}
    />
  );
};

export default GenericSkeleton;
