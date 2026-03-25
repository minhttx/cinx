import React, { useState, useEffect } from 'react';
import { commentAPI, logAPI } from '../../services/api';
import { analyzeCommentSentiment } from '../../services/ai';
import GenericSkeleton from '../GenericSkeleton';
import '../../styles/admin/CommentModeration.css';

const CommentModeration = () => {
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isScanning, setIsScanning] = useState(false);
  const [aiResults, setAiResults] = useState({}); // { commentId: { score, label, reason } }
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('pending'); // pending, approved, hidden

  const loadComments = async () => {
    try {
      setLoading(true);
      setError('');
      
      const { data, error } = await commentAPI.getCommentsByStatus(filter);

      if (error) throw error;
      
      const initialResults = {};
      (data || []).forEach(c => {
        if (c.ai_sentiment_label) {
          initialResults[c.id] = {
            score: c.ai_sentiment_score,
            label: c.ai_sentiment_label,
            reason: c.ai_sentiment_reason
          };
        }
      });
      
      setComments(data || []);
      setAiResults(initialResults);
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

  const handleAIScan = async () => {
    if (comments.length === 0) return;
    setIsScanning(true);
    const results = { ...aiResults };

    try {
      // Quét từng bình luận một để tránh quá tải Local LLM
      for (const comment of comments) {
        if (!results[comment.id]) {
          const analysis = await analyzeCommentSentiment(comment.content);
          results[comment.id] = analysis;
          
          // LƯU KẾT QUẢ VÀO DATABASE NGAY LẬP TỨC
          await commentAPI.saveCommentSentiment(comment.id, analysis);
          
          setAiResults({ ...results }); // Cập nhật UI từng phần
        }
      }
    } catch (err) {
      console.error('AI Scan Error:', err);
    } finally {
      setIsScanning(false);
    }
  };

  const handleBulkApprove = async () => {
    const positiveIds = Object.entries(aiResults)
      .filter(([id, res]) => res.label === 'Positive' && res.score > 0.7)
      .map(([id]) => id);

    if (positiveIds.length === 0) {
      alert('Không có bình luận tích cực rõ rệt để phê duyệt nhanh.');
      return;
    }

    if (window.confirm(`Phê duyệt nhanh ${positiveIds.length} bình luận tích cực đã chọn?`)) {
      try {
        setLoading(true);
        await Promise.all(positiveIds.map(id => commentAPI.updateCommentStatus(id, 'approved')));
        await logAPI.logAdminAction('Duyệt nhanh AI', `Duyệt ${positiveIds.length} bình luận tích cực.`, 'comment');
        loadComments();
      } catch (err) {
        alert('Lỗi duyệt nhanh: ' + err.message);
      } finally {
        setLoading(false);
      }
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('vi-VN');
  };

  const getSentimentBadge = (id) => {
    const res = aiResults[id];
    if (!res) return null;

    const colorMap = {
      'Positive': '#4caf50',
      'Negative': '#f44336',
      'Neutral': '#9e9e9e'
    };

    return (
      <div className="ai-sentiment-badge" style={{ 
        backgroundColor: colorMap[res.label] + '22', 
        color: colorMap[res.label],
        borderColor: colorMap[res.label]
      }}>
        <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>
          {res.label === 'Positive' ? 'mood' : res.label === 'Negative' ? 'mood_bad' : 'sentiment_neutral'}
        </span>
        <span className="ai-badge-label">{Math.round(res.score * 100)}% {res.label === 'Positive' ? 'Tích cực' : res.label === 'Negative' ? 'Tiêu cực' : 'Trung lập'}</span>
        <div className="ai-reason-tooltip">{res.reason}</div>
      </div>
    );
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
      <div className="management-header" style={{ justifyContent: 'space-between', marginBottom: '1rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div className="moderation-filter-tabs">
          <button className={`mod-tab ${filter === 'pending' ? 'active' : ''}`} onClick={() => setFilter('pending')}>Chờ duyệt ({filter === 'pending' ? comments.length : '?'})</button>
          <button className={`mod-tab ${filter === 'approved' ? 'active' : ''}`} onClick={() => setFilter('approved')}>Đã hiện</button>
          <button className={`mod-tab ${filter === 'hidden' ? 'active' : ''}`} onClick={() => setFilter('hidden')}>Đã ẩn</button>
        </div>
        
        <div className="header-actions-group" style={{ display: 'flex', gap: '8px' }}>
          {filter === 'pending' && comments.length > 0 && (
            <>
              <button 
                className={`m3-btn ${isScanning ? 'm3-btn-text' : 'm3-btn-outlined'} m3-btn-sm`} 
                onClick={handleAIScan}
                disabled={isScanning}
              >
                <span className={`material-symbols-outlined ${isScanning ? 'rotating' : ''}`}>
                  {isScanning ? 'sync' : 'psychology'}
                </span>
                {isScanning ? 'Đang phân tích...' : 'AI Quét cảm xúc'}
              </button>
              
              {Object.keys(aiResults).length > 0 && (
                <button className="m3-btn m3-btn-filled m3-btn-sm" onClick={handleBulkApprove}>
                  <span className="material-symbols-outlined">auto_awesome</span> Duyệt nhanh AI
                </button>
              )}
            </>
          )}
          <button className="action-icon-btn" onClick={loadComments} title="Làm mới">
            <span className="material-symbols-outlined">refresh</span>
          </button>
        </div>
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
            <div key={comment.id} className={`admin-card moderation-card ${aiResults[comment.id]?.label?.toLowerCase() || ''}`}>
              <div className="mod-card-header">
                <div className="movie-tag">{comment.movies?.title || 'Phim đã xóa'}</div>
                <div className="header-right-meta" style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <div className="rating-tag">⭐ {comment.rating}%</div>
                </div>
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

              {/* AI Insight row - Hiển thị bên dưới các nút */}
              {aiResults[comment.id] && (
                <div className="ai-insight-row" style={{ marginTop: '12px', borderTop: '1px solid var(--md-sys-color-outline-variant)', paddingTop: '12px' }}>
                  {getSentimentBadge(comment.id)}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default CommentModeration;
