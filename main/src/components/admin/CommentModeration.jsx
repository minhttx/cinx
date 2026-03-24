import React, { useState, useEffect } from 'react';
import { commentAPI, logAPI } from '../../services/api';
import GenericSkeleton from '../GenericSkeleton';
import '../../styles/admin/CommentModeration.css';

const CommentModeration = () => {
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('pending'); // pending, approved, hidden

  const loadComments = async () => {
    try {
      setLoading(true);
      setError('');
      
      const { data, error } = await commentAPI.getCommentsByStatus(filter);

      if (error) throw error;
      setComments(data || []);
    } catch (err) {
      console.error('Moderation load error:', err);
      setError('Lỗi khi tải danh sách bình luận: ' + (err.message || JSON.stringify(err)));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadComments();
    
    const handleGlobalRefresh = () => loadComments();
    window.addEventListener('admin-action-refresh', handleGlobalRefresh);
    return () => window.removeEventListener('admin-action-refresh', handleGlobalRefresh);
  }, [filter]);

  const handleStatusUpdate = async (comment, newStatus) => {
    try {
      const { error } = await commentAPI.updateCommentStatus(comment.id, newStatus);
      if (error) throw error;

      // Log action
      const actionText = newStatus === 'approved' ? 'Duyệt bình luận' : 'Ẩn bình luận';
      await logAPI.logAdminAction(actionText, `${comment.author_name}: ${comment.content.substring(0, 30)}...`, 'comment');

      // Update local state
      setComments(prev => prev.filter(c => c.id !== comment.id));
      
    } catch (err) {
      alert('Lỗi cập nhật: ' + err.message);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('vi-VN');
  };

  if (loading && comments.length === 0) {
    return (
      <div className="comment-moderation">
        <div className="moderation-grid">
          {[1, 2, 3].map(i => <GenericSkeleton key={i} width="100%" height="200px" borderRadius="20px" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="comment-moderation">
      <div className="management-header" style={{ justifyContent: 'space-between', marginBottom: '1rem' }}>
        <div className="moderation-filter-tabs">
          <button className={`mod-tab ${filter === 'pending' ? 'active' : ''}`} onClick={() => setFilter('pending')}>Chờ duyệt ({filter === 'pending' ? comments.length : '?'})</button>
          <button className={`mod-tab ${filter === 'approved' ? 'active' : ''}`} onClick={() => setFilter('approved')}>Đã hiện</button>
          <button className={`mod-tab ${filter === 'hidden' ? 'active' : ''}`} onClick={() => setFilter('hidden')}>Đã ẩn</button>
        </div>
        <button className="action-icon-btn" onClick={loadComments} title="Làm mới">
          <span className="material-symbols-outlined">refresh</span>
        </button>
      </div>

      {error && <div className="m3-alert error" style={{ marginBottom: '1rem', color: '#ff4444' }}>{error}</div>}

      <div className="moderation-grid">
        {comments.length === 0 ? (
          <div className="empty-moderation">
            <span className="material-symbols-outlined">auto_awesome</span>
            <p>Không có bình luận nào trong danh mục này.</p>
          </div>
        ) : (
          comments.map(comment => (
            <div key={comment.id} className="admin-card moderation-card">
              <div className="mod-card-header">
                <div className="movie-tag">{comment.movies?.title || 'Phim đã xóa'}</div>
                <div className="rating-tag">⭐ {comment.rating}%</div>
              </div>
              
              <div className="mod-card-body">
                <div className="author-row">
                  <span className="author-name">{comment.author_name}</span>
                  <span className="post-date">{formatDate(comment.created_at)}</span>
                </div>
                <p className="comment-text-content">"{comment.content}"</p>
              </div>

              <div className="mod-card-actions">
                {filter !== 'approved' && (
                  <button className="m3-btn m3-btn-filled m3-btn-sm" onClick={() => handleStatusUpdate(comment, 'approved')}>
                    <span className="material-symbols-outlined">check</span> Duyệt
                  </button>
                )}
                {filter !== 'hidden' && (
                  <button className="m3-btn m3-btn-outlined m3-btn-sm danger-btn" onClick={() => handleStatusUpdate(comment, 'hidden')}>
                    <span className="material-symbols-outlined">block</span> Ẩn
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default CommentModeration;
