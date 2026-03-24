import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { movieAPI, commentAPI } from '../services/api';
import GenericSkeleton from '../components/GenericSkeleton';
import '../styles/HomePage.css'; 
import '../styles/MovieDetails.css';

const MovieDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [movie, setMovie] = useState(null);
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [commentsLoading, setCommentsLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Comment Form State
  const [rating, setRating] = useState(10);
  const [commentContent, setCommentContent] = useState('');
  const [authorName, setAuthorName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  useEffect(() => {
    const fetchMovieDetails = async () => {
      try {
        setLoading(true);
        const { data, error } = await movieAPI.getMovie(id);
        if (error) throw error;
        setMovie(data);
      } catch (err) {
        console.error('Error fetching movie details:', err);
        setError('Không thể tải thông tin phim. Vui lòng thử lại sau.');
      } finally {
        setLoading(false);
      }
    };

    const fetchComments = async () => {
      try {
        setCommentsLoading(true);
        const { data, error } = await commentAPI.getMovieComments(id);
        if (!error) setComments(data || []);
      } catch (err) {
        console.error('Error fetching comments:', err);
      } finally {
        setCommentsLoading(false);
      }
    };

    if (id) {
      fetchMovieDetails();
      fetchComments();
    }
  }, [id]);

  const handleSubmitComment = async (e) => {
    e.preventDefault();
    if (!commentContent.trim()) return;

    try {
      setIsSubmitting(true);
      const commentData = {
        movie_id: id,
        author_name: authorName.trim() || 'Khách ẩn danh',
        content: commentContent.trim(),
        rating: rating,
        status: 'pending' // Always pending first
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
    return Array.from({ length: 10 }).map((_, i) => {
      const starValue = i + 1;
      return (
        <button 
          key={starValue}
          type="button"
          className={`star-btn ${starValue <= currentRating ? 'active' : ''}`}
          onClick={() => isInteractive && setRating(starValue)}
          disabled={!isInteractive}
        >
          <span className="material-symbols-outlined" style={{ fontSize: isInteractive ? '28px' : '18px' }}>
            {starValue <= currentRating ? 'star' : 'star_outline'}
          </span>
        </button>
      );
    });
  };

  if (loading) return (
    <div className="homepage movie-details-page">
      <main><GenericSkeleton width="100%" height="600px" borderRadius="24px" /></main>
    </div>
  );
  
  if (error) return <div className="homepage"><p className="error-text">{error}</p></div>;
  if (!movie) return <div className="homepage"><p>Không tìm thấy thông tin phim.</p></div>;

  return (
    <div className="movie-details-container">
      <main className="movie-details-main">
        <button className="back-btn" onClick={() => navigate(-1)} style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px', background: 'none', border: 'none', color: 'var(--md-sys-color-primary)', cursor: 'pointer', fontWeight: '600' }}>
          <span className="material-symbols-outlined">arrow_back</span>
          Quay lại
        </button>

        <div className="movie-details-content" style={{ display: 'flex', gap: '40px', flexWrap: 'wrap' }}>
          <div className="movie-poster-large" style={{ flex: '0 0 320px' }}>
            <img 
              src={movie.poster || 'https://via.placeholder.com/300x450'} 
              alt={movie.title} 
              style={{ width: '100%', borderRadius: '20px', boxShadow: '0 20px 50px rgba(0,0,0,0.5)' }}
            />
          </div>
          
          <div className="movie-info-detailed" style={{ flex: '1', minWidth: '300px' }}>
            <h1 style={{ fontSize: '40px', marginBottom: '8px', fontWeight: '900' }}>{movie.title}</h1>
            <div style={{ display: 'flex', gap: '12px', marginBottom: '24px', alignItems: 'center' }}>
               <span className="card-badge" style={{ position: 'static', background: 'rgba(228, 189, 102, 0.1)', color: 'var(--md-sys-color-primary)', border: '1px solid rgba(228, 189, 102, 0.2)' }}>{movie.rooms?.name || '2D'}</span>
               <p style={{ fontSize: '18px', color: 'var(--md-sys-color-primary)', fontWeight: '700', margin: 0 }}>{movie.genre}</p>
            </div>
            
            <div className="meta-info" style={{ marginBottom: '32px', display: 'flex', gap: '24px', opacity: 0.8 }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><span className="material-symbols-outlined" style={{ color: '#FFD700' }}>star</span> {movie.rating?.toFixed(1) || 'N/A'}</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><span className="material-symbols-outlined">schedule</span> {movie.duration} phút</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><span className="material-symbols-outlined">calendar_today</span> {new Date(movie.release_date).toLocaleDateString('vi-VN')}</span>
            </div>

            <div className="description" style={{ marginBottom: '40px' }}>
              <h3 style={{ fontSize: '20px', marginBottom: '12px', color: 'var(--md-sys-color-primary)' }}>Nội dung phim</h3>
              <p style={{ lineHeight: '1.8', color: 'rgba(255,255,255,0.7)', fontSize: '16px' }}>
                {movie.description || 'Chưa có mô tả cho phim này.'}
              </p>
            </div>

            {movie.status === 'showing' && (
              <button 
                onClick={() => navigate(`/booking?movie=${movie.id}`)}
                className="m3-btn m3-btn-filled"
                style={{ height: '56px', padding: '0 40px', fontSize: '16px' }}
              >
                <span className="material-symbols-outlined">confirmation_number</span>
                Đặt vé ngay
              </button>
            )}
          </div>
        </div>

        {/* COMMENTS SECTION */}
        <section className="movie-comments-section">
          <div className="section-title-group">
            <span className="material-symbols-outlined" style={{ color: 'var(--md-sys-color-primary)', fontSize: '32px' }}>forum</span>
            <h2>Bình luận & Đánh giá</h2>
            {comments.length > 0 && <span className="comment-count">{comments.length}</span>}
          </div>

          <div className="comments-layout" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '3rem', alignItems: 'start' }}>
            
            {/* COMMENT FORM */}
            <div className="comment-form-column">
              <div className="m3-card comment-form-card">
                {submitSuccess ? (
                  <div className="comment-success-overlay">
                    <span className="material-symbols-outlined">check_circle</span>
                    <h4>Cảm ơn bạn đã đánh giá!</h4>
                    <p>Bình luận của bạn đã được gửi và đang chờ Ban quản trị phê duyệt để hiển thị công khai.</p>
                    <button className="m3-btn m3-btn-tonal" onClick={() => setSubmitSuccess(false)}>Viết bình luận khác</button>
                  </div>
                ) : (
                  <>
                    <div className="form-header">
                      <h3>Chia sẻ cảm nhận của bạn</h3>
                      <p>Trải nghiệm của bạn sẽ giúp ích cho những người xem sau.</p>
                    </div>

                    <form onSubmit={handleSubmitComment} className="comment-input-area">
                      <div className="rating-input-box">
                        <p style={{ fontSize: '14px', fontWeight: '700', marginBottom: '12px', opacity: 0.7 }}>Bạn đánh giá phim này mấy sao?</p>
                        <div className="rating-input-wrapper">
                          <div className="rating-stars">
                            {renderStars(rating, true)}
                          </div>
                          <span className="rating-label">{rating}/10</span>
                        </div>
                      </div>

                      <textarea 
                        className="comment-textarea" 
                        placeholder="Viết nhận xét của bạn về phim (nội dung, diễn viên, kỹ xảo...)"
                        value={commentContent}
                        onChange={(e) => setCommentContent(e.target.value)}
                        required
                      ></textarea>

                      <div className="form-footer">
                        <input 
                          type="text" 
                          className="author-input-minimal" 
                          placeholder="Tên của bạn (tùy chọn)"
                          value={authorName}
                          onChange={(e) => setAuthorName(e.target.value)}
                        />
                        <button type="submit" className="m3-btn m3-btn-filled" disabled={isSubmitting || !commentContent.trim()}>
                          {isSubmitting ? <span className="loading-spinner-sm"></span> : 'Gửi đánh giá'}
                        </button>
                      </div>
                    </form>
                  </>
                )}
              </div>
            </div>

            {/* COMMENTS LIST */}
            <div className="comments-list-column">
              <div className="comments-list">
                {commentsLoading ? (
                  [1,2].map(i => <GenericSkeleton key={i} width="100%" height="150px" borderRadius="20px" />)
                ) : comments.length > 0 ? (
                  comments.map(comment => (
                    <div key={comment.id} className="comment-item">
                      <div className="comment-top-row">
                        <div className="commenter-info">
                          <span className="commenter-name">{comment.author_name}</span>
                          <span className="comment-date">{new Date(comment.created_at).toLocaleDateString('vi-VN')}</span>
                        </div>
                        <div className="comment-rating-badge">
                          <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>star</span>
                          {comment.rating}/10
                        </div>
                      </div>
                      <p className="comment-content">{comment.content}</p>
                    </div>
                  ))
                ) : (
                  <div className="no-comments-state">
                    <span className="material-symbols-outlined">rate_review</span>
                    <p>Chưa có bình luận nào đã được duyệt cho phim này. Hãy là người đầu tiên!</p>
                  </div>
                )}
              </div>
            </div>

          </div>
        </section>
      </main>
    </div>
  );
};

export default MovieDetails;
