import React, { useState } from 'react';
import '../../styles/admin/ContentManagement.css';

const ContentManagement = () => {
  const [activeSection, setActiveSection] = useState('news');
  
  const [news, setNews] = useState([
    {
      id: 1,
      title: 'Lễ hội điện ảnh Cannes 2024: Những bộ phim đáng chú ý',
      summary: 'Điểm qua những tác phẩm điện ảnh nổi bật tại liên hoan phim Cannes năm nay...',
      content: 'Nội dung chi tiết bài viết...',
      image: 'https://via.placeholder.com/400x250?text=Cannes+2024',
      publishDate: '2024-05-15',
      status: 'published',
      author: 'Admin'
    }
  ]);

  const [promotions, setPromotions] = useState([
    {
      id: 1,
      title: 'Giảm giá 50% vé xem phim cuối tuần',
      description: 'Áp dụng cho tất cả các suất chiếu từ thứ 6 đến chủ nhật',
      image: 'https://via.placeholder.com/400x250?text=Weekend+Sale',
      validFrom: '2024-01-01',
      validUntil: '2024-12-31',
      status: 'active'
    }
  ]);

  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({});

  const resetForm = () => {
    setFormData({});
    setShowForm(false);
    setEditingItem(null);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (activeSection === 'news') {
      if (editingItem) {
        setNews(prev => prev.map(item => 
          item.id === editingItem.id ? { ...formData, id: editingItem.id } : item
        ));
      } else {
        const newItem = {
          ...formData,
          id: Date.now(),
          publishDate: new Date().toISOString().split('T')[0],
          author: 'Admin',
          status: 'published'
        };
        setNews(prev => [...prev, newItem]);
      }
    } else {
      if (editingItem) {
        setPromotions(prev => prev.map(item => 
          item.id === editingItem.id ? { ...formData, id: editingItem.id } : item
        ));
      } else {
        const newItem = {
          ...formData,
          id: Date.now(),
          status: 'active'
        };
        setPromotions(prev => [...prev, newItem]);
      }
    }
    
    resetForm();
  };

  const handleEdit = (item) => {
    setFormData(item);
    setEditingItem(item);
    setShowForm(true);
  };

  const handleDelete = (id) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa mục này?')) {
      if (activeSection === 'news') {
        setNews(prev => prev.filter(item => item.id !== id));
      } else {
        setPromotions(prev => prev.filter(item => item.id !== id));
      }
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      published: { label: 'Đã xuất bản', class: 'status-published' },
      draft: { label: 'Bản nháp', class: 'status-draft' },
      active: { label: 'Đang hoạt động', class: 'status-active' },
      inactive: { label: 'Không hoạt động', class: 'status-inactive' }
    };
    
    const config = statusConfig[status] || statusConfig.draft;
    return <span className={`status-badge ${config.class}`}>{config.label}</span>;
  };

  const renderNewsForm = () => (
    <form onSubmit={handleSubmit} className="content-form">
      <div className="form-group">
        <label>Tiêu đề *</label>
        <input
          type="text"
          name="title"
          value={formData.title || ''}
          onChange={handleInputChange}
          required
          className="form-control"
        />
      </div>

      <div className="form-group">
        <label>Tóm tắt</label>
        <textarea
          name="summary"
          value={formData.summary || ''}
          onChange={handleInputChange}
          rows="3"
          className="form-control"
          placeholder="Tóm tắt nội dung bài viết..."
        />
      </div>

      <div className="form-group">
        <label>Nội dung *</label>
        <textarea
          name="content"
          value={formData.content || ''}
          onChange={handleInputChange}
          rows="8"
          required
          className="form-control"
          placeholder="Nội dung chi tiết bài viết..."
        />
      </div>

      <div className="form-group">
        <label>URL Hình ảnh</label>
        <input
          type="url"
          name="image"
          value={formData.image || ''}
          onChange={handleInputChange}
          className="form-control"
          placeholder="https://example.com/image.jpg"
        />
      </div>

      <div className="form-group">
        <label>Trạng thái</label>
        <select
          name="status"
          value={formData.status || 'draft'}
          onChange={handleInputChange}
          className="form-control"
        >
          <option value="published">Đã xuất bản</option>
          <option value="draft">Bản nháp</option>
        </select>
      </div>

      <div className="form-actions">
        <button type="button" className="btn btn-secondary" onClick={resetForm}>
          Hủy
        </button>
        <button type="submit" className="btn btn-primary">
          {editingItem ? 'Cập nhật' : 'Thêm mới'}
        </button>
      </div>
    </form>
  );

  const renderPromotionForm = () => (
    <form onSubmit={handleSubmit} className="content-form">
      <div className="form-group">
        <label>Tiêu đề *</label>
        <input
          type="text"
          name="title"
          value={formData.title || ''}
          onChange={handleInputChange}
          required
          className="form-control"
        />
      </div>

      <div className="form-group">
        <label>Mô tả</label>
        <textarea
          name="description"
          value={formData.description || ''}
          onChange={handleInputChange}
          rows="4"
          className="form-control"
          placeholder="Mô tả chi tiết khuyến mãi..."
        />
      </div>

      <div className="form-group">
        <label>URL Hình ảnh</label>
        <input
          type="url"
          name="image"
          value={formData.image || ''}
          onChange={handleInputChange}
          className="form-control"
          placeholder="https://example.com/promotion.jpg"
        />
      </div>

      <div className="form-grid">
        <div className="form-group">
          <label>Ngày bắt đầu</label>
          <input
            type="date"
            name="validFrom"
            value={formData.validFrom || ''}
            onChange={handleInputChange}
            className="form-control"
          />
        </div>

        <div className="form-group">
          <label>Ngày kết thúc</label>
          <input
            type="date"
            name="validUntil"
            value={formData.validUntil || ''}
            onChange={handleInputChange}
            className="form-control"
          />
        </div>
      </div>

      <div className="form-group">
        <label>Trạng thái</label>
        <select
          name="status"
          value={formData.status || 'active'}
          onChange={handleInputChange}
          className="form-control"
        >
          <option value="active">Đang hoạt động</option>
          <option value="inactive">Không hoạt động</option>
        </select>
      </div>

      <div className="form-actions">
        <button type="button" className="btn btn-secondary" onClick={resetForm}>
          Hủy
        </button>
        <button type="submit" className="btn btn-primary">
          {editingItem ? 'Cập nhật' : 'Thêm mới'}
        </button>
      </div>
    </form>
  );

  const currentData = activeSection === 'news' ? news : promotions;

  return (
    <div className="content-management">
      <div className="management-header">
        <h2>📰 Quản lý nội dung</h2>
        <div className="section-tabs">
          <button 
            className={`tab-btn ${activeSection === 'news' ? 'active' : ''}`}
            onClick={() => setActiveSection('news')}
          >
            📰 Tin tức
          </button>
          <button 
            className={`tab-btn ${activeSection === 'promotions' ? 'active' : ''}`}
            onClick={() => setActiveSection('promotions')}
          >
            🎁 Khuyến mãi
          </button>
        </div>
        <button 
          className="btn btn-primary"
          onClick={() => setShowForm(true)}
        >
          + Thêm mới
        </button>
      </div>

      {showForm && (
        <div className="modal-overlay">
          <div className="content-form-modal">
            <div className="modal-header">
              <h3>{editingItem ? 'Chỉnh sửa' : 'Thêm mới'} {activeSection === 'news' ? 'tin tức' : 'khuyến mãi'}</h3>
              <button className="close-btn" onClick={resetForm}>×</button>
            </div>
            {activeSection === 'news' ? renderNewsForm() : renderPromotionForm()}
          </div>
        </div>
      )}

      <div className="content-grid">
        {currentData.map(item => (
          <div key={item.id} className="content-card">
            {item.image && (
              <div className="content-image">
                <img src={item.image} alt={item.title} />
              </div>
            )}
            
            <div className="content-info">
              <h4>{item.title}</h4>
              <p className="content-summary">
                {activeSection === 'news' ? item.summary : item.description}
              </p>
              
              <div className="content-meta">
                {activeSection === 'news' ? (
                  <>
                    <span>📅 {item.publishDate}</span>
                    <span>👤 {item.author}</span>
                  </>
                ) : (
                  <>
                    <span>📅 {item.validFrom} - {item.validUntil}</span>
                  </>
                )}
                {getStatusBadge(item.status)}
              </div>
            </div>
            
            <div className="content-actions">
              <button 
                className="btn btn-sm btn-secondary"
                onClick={() => handleEdit(item)}
              >
                ✏️ Sửa
              </button>
              <button 
                className="btn btn-sm btn-danger"
                onClick={() => handleDelete(item.id)}
              >
                🗑️ Xóa
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ContentManagement;