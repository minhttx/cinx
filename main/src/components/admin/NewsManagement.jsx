import React, { useState, useEffect } from 'react';
import { contentAPI, logAPI } from '../../services/api';
import { generateNewsFromURL, generateNewsFromText } from '../../services/ai';
import GenericSkeleton from '../GenericSkeleton';
import ConfirmModal from '../ConfirmModal';
import '../../styles/admin/NewsManagement.css';
import '../../styles/components/Card.css';

const NewsManagement = () => {
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editingNews, setEditingNews] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  
  // Confirm Modal state
  const [confirmModal, setConfirmModal] = useState({ 
    isOpen: false, title: '', message: '', action: null 
  });

  const [formData, setFormData] = useState({
    title: '',
    summary: '',
    content: '',
    image_url: '',
    status: 'published'
  });
  const [sourceUrl, setSourceUrl] = useState('');
  const [isAIWriting, setIsAIWriting] = useState(false);

  const loadNews = async () => {
    try {
      setLoading(true);
      setError('');
      const { data, error } = await contentAPI.getNews();
      if (error) {
        setError('Không thể tải tin tức: ' + (error.message || 'Unknown error'));
      } else {
        setNews(data || []);
      }
    } catch (err) {
      setError('Lỗi kết nối database');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNews();

    const handleGlobalAdd = () => {
      setEditingNews(null);
      setFormData({ title: '', summary: '', content: '', image_url: '', status: 'published' });
      setSourceUrl('');
      setIsDrawerOpen(true);
    };
    
    const handleGlobalRefresh = () => loadNews();

    window.addEventListener('admin-action-add', handleGlobalAdd);
    window.addEventListener('admin-action-refresh', handleGlobalRefresh);
    
    return () => {
      window.removeEventListener('admin-action-add', handleGlobalAdd);
      window.removeEventListener('admin-action-refresh', handleGlobalRefresh);
    };
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      setError('');

      const newsData = {
        ...formData,
        publish_date: editingNews ? editingNews.publish_date : new Date().toISOString()
      };

      let result;
      if (editingNews) {
        result = await contentAPI.updateNews(editingNews.id, newsData);
        if (result.error) throw result.error;
        await logAPI.logAdminAction('Cập nhật tin tức', formData.title, 'news');
      } else {
        result = await contentAPI.createNews(newsData);
        if (result.error) throw result.error;
        await logAPI.logAdminAction('Thêm tin tức mới', formData.title, 'news');
      }

      setIsDrawerOpen(false);
      loadNews();
    } catch (err) {
      setError('Lỗi lưu tin tức: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (newsItem) => {
    setFormData({
      title: newsItem.title || '',
      summary: newsItem.summary || '',
      content: newsItem.content || '',
      image_url: newsItem.image_url || '',
      status: newsItem.status || 'published'
    });
    setSourceUrl('');
    setEditingNews(newsItem);
    setIsDrawerOpen(true);
  };

  const handleAIWriting = async () => {
    if (!sourceUrl.trim()) {
      alert('Vui lòng nhập URL hoặc mô tả chủ đề tin tức!');
      return;
    }

    try {
      setIsAIWriting(true);
      setError('');

      let result;
      const input = sourceUrl.trim();
      const isUrl = input.startsWith('http://') || input.startsWith('https://');
      
      if (isUrl) {
        result = await generateNewsFromURL(input);
      } else {
        result = await generateNewsFromText(input);
      }

      if (result.error) {
        setError(result.error);
        return;
      }

      setFormData(prev => ({
        ...prev,
        title: result.title || '',
        summary: result.summary || '',
        content: result.content || ''
      }));

    } catch (err) {
      console.error('AI Writing error:', err);
      setError('AI Writing gặp lỗi: ' + err.message);
    } finally {
      setIsAIWriting(false);
    }
  };

  const handleDelete = async (id) => {
    const item = news.find(n => n.id === id);
    try {
      const { error } = await contentAPI.deleteNews(id);
      if (error) throw error;
      await logAPI.logAdminAction('Xóa tin tức', item?.title || 'Unknown', 'news');
      loadNews();
      setConfirmModal(prev => ({ ...prev, isOpen: false }));
    } catch (err) {
      setError('Lỗi xóa tin tức: ' + err.message);
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      published: { label: 'Đã xuất bản', class: 'status-published' },
      draft: { label: 'Bản nháp', class: 'status-draft' },
      archived: { label: 'Lưu trữ', class: 'status-archived' }
    };
    const config = statusConfig[status] || statusConfig.published;
    return <span className={`status-badge ${config.class}`}>{config.label}</span>;
  };

  if (loading && news.length === 0) {
    return (
      <div className="news-management">
        <div className="news-grid">
          {[1, 2, 3].map(i => <GenericSkeleton key={i} width="100%" height="250px" borderRadius="20px" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="news-management">
      {error && <div className="m3-alert error" style={{ marginBottom: '2rem' }}>{error}</div>}

      <div className="news-grid">
        {news.length === 0 ? (
          <div className="no-content">
            <span className="material-symbols-outlined">newspaper</span>
            <p>Chưa có tin tức nào.</p>
          </div>
        ) : (
          news.map(newsItem => (
            <div key={newsItem.id} className="news-card">
              <div className="news-image">
                <img src={newsItem.image_url || 'https://via.placeholder.com/400x200?text=No+Image'} alt={newsItem.title} />
                {getStatusBadge(newsItem.status)}
              </div>
              <div className="news-details">
                <h4>{newsItem.title}</h4>
                <p className="news-summary">{newsItem.summary || 'Không có tóm tắt'}</p>
                <div className="news-meta">
                  <span>📅 {new Date(newsItem.publish_date).toLocaleDateString('vi-VN')}</span>
                </div>
              </div>
              <div className="news-actions">
                <button className="m3-btn m3-btn-filled m3-btn-sm" onClick={() => handleEdit(newsItem)}>
                  <span className="material-symbols-outlined">edit</span> Sửa
                </button>
                <button className="m3-btn m3-btn-outlined m3-btn-sm danger-btn" onClick={() => setConfirmModal({
                  isOpen: true,
                  title: 'Xóa tin tức?',
                  message: `Bạn có chắc muốn xóa bài viết "${newsItem.title}"?`,
                  action: () => handleDelete(newsItem.id)
                })}>
                  <span className="material-symbols-outlined">delete</span> Xóa
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* DRAWER FORM */}
      <div className={`admin-drawer ${isDrawerOpen ? 'open' : ''}`}>
        <div className="drawer-header-main">
          <h3>{editingNews ? 'Chỉnh sửa tin tức' : 'Thêm tin tức mới'}</h3>
          <button onClick={() => setIsDrawerOpen(false)} className="close-btn"><span className="material-symbols-outlined">close</span></button>
        </div>
        <div className="drawer-body-main">
          <form onSubmit={handleSubmit} className="movie-form-vertical">
            <div className="m3-textfield" style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
              <input 
                type="text" 
                value={sourceUrl} 
                onChange={(e) => setSourceUrl(e.target.value)} 
                placeholder="Dán URL bài gốc hoặc chủ đề tại đây..." 
                style={{ flex: 1 }}
              />
              <button 
                type="button" 
                className="m3-btn m3-btn-tonal m3-btn-sm" 
                onClick={handleAIWriting}
                disabled={isAIWriting}
                style={{ height: '48px', padding: '0 16px', borderRadius: '12px' }}
              >
                {isAIWriting ? <span className="loading-spinner-sm" style={{ margin: 0 }}></span> : <span className="material-symbols-outlined">psychology</span>}
                <span style={{ fontSize: '12px' }}>AI Writing</span>
              </button>
            </div>

            <div className="drawer-divider" style={{ margin: '1rem 0', opacity: 0.1 }}></div>

            <div className="m3-textfield">
              <input type="text" name="title" value={formData.title} onChange={handleInputChange} required placeholder="Tiêu đề bài viết *" />
            </div>
            <div className="m3-textfield">
              <select name="status" value={formData.status} onChange={handleInputChange}>
                <option value="published">Đã xuất bản</option>
                <option value="draft">Bản nháp</option>
                <option value="archived">Lưu trữ</option>
              </select>
            </div>
            <div className="m3-textfield">
              <input type="url" name="image_url" value={formData.image_url} onChange={handleInputChange} placeholder="URL Hình ảnh minh họa" />
            </div>
            <div className="m3-textfield">
              <textarea name="summary" value={formData.summary} onChange={handleInputChange} rows="2" placeholder="Tóm tắt ngắn gọn"></textarea>
            </div>
            <div className="m3-textfield full-width">
              <textarea name="content" value={formData.content} onChange={handleInputChange} rows="10" required placeholder="Nội dung chi tiết bài viết *"></textarea>
            </div>
            <div className="drawer-actions-row">
              <button type="button" className="m3-btn m3-btn-text" onClick={() => setIsDrawerOpen(false)}>Hủy</button>
              <button type="submit" className="m3-btn m3-btn-filled" disabled={submitting}>
                {submitting ? <span className="loading-spinner-sm"></span> : (editingNews ? 'Cập nhật' : 'Đăng bài')}
              </button>
            </div>
          </form>
        </div>
      </div>
      {isDrawerOpen && <div className="drawer-overlay-admin" onClick={() => setIsDrawerOpen(false)} />}

      <ConfirmModal 
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        message={confirmModal.message}
        onConfirm={confirmModal.action}
        onCancel={() => setConfirmModal({ ...confirmModal, isOpen: false })}
      />
    </div>
  );
};

export default NewsManagement;