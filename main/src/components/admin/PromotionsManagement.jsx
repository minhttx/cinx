import React, { useState, useEffect } from 'react';
import { contentAPI, logAPI } from '../../services/api';
import { generatePromotionFromPrompt } from '../../services/ai';
import GenericSkeleton from '../GenericSkeleton';
import '../../styles/admin/PromotionsManagement.css';
import '../../styles/components/Card.css';

const PromotionsManagement = () => {
  const [promotions, setPromotions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editingPromotion, setEditingPromotion] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    image_url: '',
    start_date: '',
    end_date: '',
    status: 'active'
  });
  const [sourceUrl, setSourceUrl] = useState('');
  const [isAIWriting, setIsAIWriting] = useState(false);

  const loadPromotions = async () => {
    try {
      setLoading(true);
      setError('');
      const { data, error } = await contentAPI.getPromotions(); 
      if (error) {
        setError('Không thể tải khuyến mãi: ' + (error.message || 'Unknown error'));
      } else {
        setPromotions(data || []);
      }
    } catch (err) {
      setError('Lỗi kết nối database');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPromotions();

    const handleGlobalAdd = () => {
      setEditingPromotion(null);
      setFormData({ title: '', description: '', image_url: '', start_date: '', end_date: '', status: 'active' });
      setSourceUrl('');
      setIsDrawerOpen(true);
    };

    const handleGlobalRefresh = () => loadPromotions();

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

      if (formData.start_date && formData.end_date) {
        if (new Date(formData.end_date) <= new Date(formData.start_date)) {
          setError('Ngày kết thúc phải sau ngày bắt đầu');
          setSubmitting(false);
          return;
        }
      }

      const promotionData = {
        ...formData,
        start_date: formData.start_date || null,
        end_date: formData.end_date || null
      };

      let result;
      if (editingPromotion) {
        result = await contentAPI.updatePromotion(editingPromotion.id, promotionData);
        if (result.error) throw result.error;
        await logAPI.logAdminAction('Cập nhật khuyến mãi', formData.title, 'promotion');
      } else {
        result = await contentAPI.createPromotion(promotionData);
        if (result.error) throw result.error;
        await logAPI.logAdminAction('Thêm khuyến mãi mới', formData.title, 'promotion');
      }

      setIsDrawerOpen(false);
      loadPromotions();
    } catch (err) {
      setError('Lỗi lưu khuyến mãi: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (promotion) => {
    setFormData({
      title: promotion.title || '',
      description: promotion.description || '',
      image_url: promotion.image_url || '',
      start_date: promotion.start_date ? promotion.start_date.split('T')[0] : '',
      end_date: promotion.end_date ? promotion.end_date.split('T')[0] : '',
      status: promotion.status || 'active'
    });
    setSourceUrl('');
    setEditingPromotion(promotion);
    setIsDrawerOpen(true);
  };

const handleAIWriting = async () => {
  if (!sourceUrl.trim()) {
    alert('Vui lòng nhập mô tả chủ đề khuyến mãi!');
    return;
  }

  try {
    setIsAIWriting(true);
    setError('');

    // Luôn dùng prompt mode cho promotions
    const result = await generatePromotionFromPrompt(sourceUrl.trim());

    if (result.error) {
      setError(result.error);
      return;
    }

    // Fill form
    setFormData(prev => ({
      ...prev,
      title: result.title || '',
      description: result.description || ''
    }));

  } catch (err) {
    console.error('AI Writing error:', err);
    setError('AI Writing gặp lỗi: ' + err.message);
  } finally {
    setIsAIWriting(false);
  }
};

  const handleDelete = async (id) => {
    const item = promotions.find(p => p.id === id);
    if (window.confirm('Bạn có chắc chắn muốn xóa khuyến mãi này?')) {
      try {
        const { error } = await contentAPI.deletePromotion(id);
        if (error) throw error;
        await logAPI.logAdminAction('Xóa khuyến mãi', item?.title || 'Unknown', 'promotion');
        loadPromotions();
      } catch (err) {
        setError('Lỗi xóa khuyến mãi: ' + err.message);
      }
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      active: { label: 'Đang hoạt động', class: 'status-active' },
      inactive: { label: 'Tạm dừng', class: 'status-inactive' },
      expired: { label: 'Đã hết hạn', class: 'status-expired' }
    };
    const config = statusConfig[status] || statusConfig.active;
    return <span className={`status-badge ${config.class}`}>{config.label}</span>;
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Không giới hạn';
    return new Date(dateString).toLocaleDateString('vi-VN');
  };

  if (loading && promotions.length === 0) {
    return (
      <div className="promotions-management">
        <div className="promotions-grid">
          {[1, 2, 3].map(i => <GenericSkeleton key={i} width="100%" height="250px" borderRadius="20px" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="promotions-management">
      {error && <div className="m3-alert error" style={{ marginBottom: '2rem' }}>{error}</div>}

      <div className="promotions-grid">
        {promotions.length === 0 ? (
          <div className="no-content">
            <span className="material-symbols-outlined">sell</span>
            <p>Chưa có khuyến mãi nào.</p>
          </div>
        ) : (
          promotions.map(promotion => (
            <div key={promotion.id} className="promotion-card">
              <div className="promotion-image">
                <img src={promotion.image_url || 'https://via.placeholder.com/400x200?text=No+Image'} alt={promotion.title} />
                {getStatusBadge(promotion.status)}
              </div>
              <div className="promotion-details">
                <h4>{promotion.title}</h4>
                <p className="promotion-description">{promotion.description}</p>
                <div className="promotion-validity">
                  <div className="validity-dates">
                    <span className="date-label">Từ:</span>
                    <span className="date-value">{formatDate(promotion.start_date)}</span>
                  </div>
                  <div className="validity-dates">
                    <span className="date-label">Đến:</span>
                    <span className="date-value">{formatDate(promotion.end_date)}</span>
                  </div>
                </div>
              </div>
              <div className="promotion-actions">
                <button className="m3-btn-sm m3-btn-outlined" onClick={() => handleEdit(promotion)}>Sửa</button>
                <button className="m3-btn-sm m3-btn-text" style={{ color: '#ff4444' }} onClick={() => handleDelete(promotion.id)}>Xóa</button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* DRAWER FORM */}
      <div className={`admin-drawer ${isDrawerOpen ? 'open' : ''}`}>
        <div className="drawer-header-main">
          <h3>{editingPromotion ? 'Chỉnh sửa khuyến mãi' : 'Thêm khuyến mãi mới'}</h3>
          <button onClick={() => setIsDrawerOpen(false)} className="close-btn"><span className="material-symbols-outlined">close</span></button>
        </div>
        <div className="drawer-body-main">
          <form onSubmit={handleSubmit} className="movie-form-vertical">
            <div className="m3-textfield" style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
<input 
  type="text" 
  value={sourceUrl} 
  onChange={(e) => setSourceUrl(e.target.value)} 
  placeholder="Nhập mô tả khuyến mãi (vd: 'giảm 20% vé cuối tuần cho sinh viên')..." 
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
              <input type="text" name="title" value={formData.title} onChange={handleInputChange} required placeholder="Tiêu đề khuyến mãi *" />
            </div>
            <div className="m3-textfield">
              <select name="status" value={formData.status} onChange={handleInputChange}>
                <option value="active">Đang hoạt động</option>
                <option value="inactive">Tạm dừng</option>
                <option value="expired">Đã hết hạn</option>
              </select>
            </div>
            <div className="m3-textfield">
              <input type="url" name="image_url" value={formData.image_url} onChange={handleInputChange} placeholder="URL Hình ảnh khuyến mãi" />
            </div>
            <div className="form-row-2col">
              <div className="m3-textfield">
                <input type="date" name="start_date" value={formData.start_date} onChange={handleInputChange} title="Ngày bắt đầu" />
              </div>
              <div className="m3-textfield">
                <input type="date" name="end_date" value={formData.end_date} onChange={handleInputChange} title="Ngày kết thúc" />
              </div>
            </div>
            <div className="m3-textfield full-width">
              <textarea name="description" value={formData.description} onChange={handleInputChange} rows="10" required placeholder="Mô tả chi tiết chương trình khuyến mãi *"></textarea>
            </div>
            <div className="drawer-actions-row">
              <button type="button" className="m3-btn m3-btn-text" onClick={() => setIsDrawerOpen(false)}>Hủy</button>
              <button type="submit" className="m3-btn m3-btn-filled" disabled={submitting}>
                {submitting ? <span className="loading-spinner-sm"></span> : (editingPromotion ? 'Cập nhật' : 'Tạo khuyến mãi')}
              </button>
            </div>
          </form>
        </div>
      </div>
      {isDrawerOpen && <div className="drawer-overlay-admin" onClick={() => setIsDrawerOpen(false)} />}
    </div>
  );
};

export default PromotionsManagement;
