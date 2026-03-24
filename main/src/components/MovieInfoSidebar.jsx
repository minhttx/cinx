import React, { useEffect, useState } from 'react';
import { commentAPI } from '../services/api';
import { splitCommaString } from '../utils/formatUtils';
import GenericSkeleton from './GenericSkeleton';
import '../styles/MovieInfoSidebar.css';

const MovieInfoSidebar = ({ movie, isOpen, onClose, onBookTicket }) => {
  // Comment States
  const [comments, setComments] = useState([]);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [rating, setRating] = useState(10);
  const [commentContent, setCommentContent] = useState('');
  const [authorName, setAuthorName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

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

  // Fetch comments when sidebar opens or movie changes
  useEffect(() => {
    if (isOpen && movie?.id) {
      const fetchComments = async () => {
        try {
          setCommentsLoading(true);
          const { data, error } = await commentAPI.getMovieComments(movie.id);
          if (!error) setComments(data || []);
        } catch (err) {
          console.error('Error fetching comments:', err);
        } finally {
          setCommentsLoading(false);
        }
      };
      fetchComments();
      // Reset form state
      setSubmitSuccess(false);
      setCommentContent('');
      setRating(10);
    }
  }, [isOpen, movie?.id]);

  if (!movie) return null;

  const handleSubmitComment = async (e) => {
    e.preventDefault();
    if (!commentContent.trim()) return;

    try {
      setIsSubmitting(true);
      const commentData = {
        movie_id: movie.id,
        author_name: authorName.trim() || 'Khách ẩn danh',
        content: commentContent.trim(),
        rating: rating,
        status: 'pending' 
      };

      const { error } = await commentAPI.postComment(commentData);
      if (error) throw error;

      setSubmitSuccess(true);
      setCommentContent('');
      setRating(10);
    } catch (err) {
      alert('Lỗi khi gửi bình luận: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStars = (currentRating, isInteractive = false) => {
    // If rating is 1-100, normalize to 1-10 for star display
    const normalizedRating = currentRating > 10 ? currentRating / 10 : currentRating;
    
    return Array.from({ length: 10 }).map((_, i) => {
      const starValue = i + 1;
      return (
        <button 
          key={starValue}
          type="button"
          className={`sidebar-star-btn ${starValue <= normalizedRating ? 'active' : ''}`}
          onClick={() => isInteractive && setRating(starValue * 10)}
          disabled={!isInteractive}
        >
          <span className="material-symbols-outlined" style={{ fontSize: isInteractive ? '24px' : '14px' }}>
            {starValue <= normalizedRating ? 'star' : 'star_outline'}
          </span>
        </button>
      );
    });
  };

  // Function to extract YouTube video ID and create embed URL
  const getEmbedUrl = (url) => {
    if (!url) return null;
    let videoId = '';
    if (url.includes('youtube.com/watch?v=')) {
      videoId = url.split('v=')[1].split('&')[0];
    } else if (url.includes('youtu.be/')) {
      videoId = url.split('youtu.be/')[1].split('?')[0];
    } else if (url.includes('youtube.com/embed/')) {
      return url;
    }
    return videoId ? `https://www.youtube.com/embed/${videoId}` : null;
  };

  const embedUrl = getEmbedUrl(movie.trailer_url);

  return (
    <>
      {/* Overlay */}
      <div 
        className={`movie-sidebar-overlay ${isOpen ? 'open' : ''}`}
        onClick={onClose}
      />
      
      {/* Sidebar */}
      <div className={`movie-sidebar ${isOpen ? 'open' : ''}`}>
        <button className="sidebar-close-btn" onClick={onClose} aria-label="Đóng">
          <span className="material-symbols-outlined">close</span>
        </button>
        
        <div className="sidebar-scroll-content">
          {embedUrl && (
            <div className="sidebar-trailer-header">
              <iframe
                src={embedUrl}
                title={`${movie.title} Trailer`}
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              ></iframe>
            </div>
          )}
          
          <div className={`sidebar-main-info ${!embedUrl ? 'no-trailer' : ''}`}>
            <h1 className="sidebar-movie-title">{movie.title}</h1>
            
            <div className="sidebar-meta-row">
              <span className="sidebar-rating">
                <span className="material-symbols-outlined">star</span>
                {movie.rating ? `${Math.round(movie.rating)}%` : 'N/A'}
              </span>
              <span className="sidebar-duration">
                <span className="material-symbols-outlined">schedule</span>
                {movie.duration} phút
              </span>
              {movie.age && (
                <span className={`sidebar-age-badge age-${movie.age.toLowerCase()}`}>
                  {movie.age}
                </span>
              )}
            </div>
            
            <div className="sidebar-genres-list">
              {splitCommaString(movie.genre).map((genre, index) => (
                <span key={index} className="sidebar-genre-tag">
                  {genre}
                </span>
              ))}
            </div>
            
            <div className="sidebar-section">
              <h3 className="section-label">Nội dung</h3>
              <p className="section-text">{movie.description || 'Chưa có mô tả cho phim này.'}</p>
            </div>
            
            {movie.actors && (
              <div className="sidebar-section">
                <h3 className="section-label">Diễn viên</h3>
                <div className="cast-list">
                  {splitCommaString(movie.actors).map((actor, index) => (
                    <span key={index} className="cast-tag">
                      {actor}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* INTEGRATED COMMENTS SECTION */}
            <div className="sidebar-divider"></div>
            
            <div className="sidebar-section comments-section">
              <h3 className="section-label" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>forum</span>
                Bình luận & Đánh giá
              </h3>

              {/* COMMENT FORM */}
              <div className="sidebar-comment-form">
                {submitSuccess ? (
                  <div className="sidebar-comment-success">
                    <span className="material-symbols-outlined">check_circle</span>
                    <p>Đã gửi bình luận! Đang chờ phê duyệt.</p>
                    <button className="m3-btn m3-btn-text m3-btn-sm" onClick={() => setSubmitSuccess(false)}>Gửi thêm</button>
                  </div>
                ) : (
                  <form onSubmit={handleSubmitComment}>
                    <div className="sidebar-rating-input">
                      <div className="sidebar-stars-row">
                        {renderStars(rating, true)}
                      </div>
                      <span className="rating-num">{rating}%</span>
                    </div>
                    <textarea 
                      className="sidebar-comment-textarea"
                      placeholder="Chia sẻ cảm nhận của bạn..."
                      value={commentContent}
                      onChange={(e) => setCommentContent(e.target.value)}
                      required
                    ></textarea>
                    <div className="sidebar-form-footer">
                      <input 
                        type="text" 
                        className="sidebar-author-input"
                        placeholder="Tên của bạn (tùy chọn)"
                        value={authorName}
                        onChange={(e) => setAuthorName(e.target.value)}
                      />
                      <button type="submit" className="m3-btn m3-btn-filled m3-btn-sm" disabled={isSubmitting || !commentContent.trim()}>
                        {isSubmitting ? <span className="loading-spinner-sm"></span> : 'Gửi'}
                      </button>
                    </div>
                  </form>
                )}
              </div>

              {/* COMMENTS LIST */}
              <div className="sidebar-comments-list">
                {commentsLoading ? (
                  <GenericSkeleton width="100%" height="80px" borderRadius="12px" />
                ) : comments.length > 0 ? (
                  comments.map(comment => (
                    <div key={comment.id} className="sidebar-comment-item">
                      <div className="comment-header">
                        <span className="author">{comment.author_name}</span>
                        <div className="rating">
                          <span className="material-symbols-outlined">star</span>
                          {comment.rating}%
                        </div>
                      </div>
                      <p className="content">{comment.content}</p>
                      <span className="date">{new Date(comment.created_at).toLocaleDateString('vi-VN')}</span>
                    </div>
                  ))
                ) : (
                  <p className="no-comments-msg">Chưa có bình luận nào được phê duyệt.</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {movie.status === 'showing' && (
          <div className="sidebar-actions">
            <button 
              className="m3-btn m3-btn-filled full-width-btn" 
              onClick={() => {
                onClose();
                onBookTicket(movie.id);
              }}
            >
              Đặt vé ngay
            </button>
          </div>
        )}
      </div>
    </>
  );
};

export default MovieInfoSidebar;
