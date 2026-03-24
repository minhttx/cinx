import React, { useState, useEffect, useCallback } from 'react';
import { contentAPI } from '../../services/api';
import GenericSkeleton from '../GenericSkeleton';
import '../../styles/admin/CarouselManagement.css';

// A simple modal component
const Modal = ({ children, onClose }) => (
  <div className="cm-modal-backdrop" onClick={onClose}>
    <div className="cm-modal-content" onClick={e => e.stopPropagation()}>
      <button className="cm-modal-close" onClick={onClose}>&times;</button>
      {children}
    </div>
  </div>
);

const CarouselManagement = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentItem, setCurrentItem] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');

  const loadItems = useCallback(async () => {
    setLoading(true);
    const { data, error } = await contentAPI.getAllCarouselItems();
    if (error) {
      setError('Failed to load carousel items.');
      console.error(error);
    } else {
      setItems(data || []);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    loadItems();
  }, [loadItems]);

  const openModal = (item = null) => {
    setCurrentItem(item ? { ...item } : { title: '', description: '', image_url: '', link_url: '', display_order: 0, is_active: true });
    setImagePreview(item ? item.image_url : '');
    setImageFile(null);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setCurrentItem(null);
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setCurrentItem(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!currentItem.title || (!currentItem.image_url && !imageFile)) {
      alert('Title and Image are required.');
      return;
    }

    setLoading(true);
    let imageUrl = currentItem.image_url;

    if (imageFile) {
      const { publicUrl, error: uploadError } = await contentAPI.uploadCarouselImage(imageFile);
      if (uploadError) {
        setError('Failed to upload image.');
        setLoading(false);
        return;
      }
      imageUrl = publicUrl;
    }

    const itemData = { ...currentItem, image_url: imageUrl };
    
    let result;
    if (itemData.id) {
      // Update
      result = await contentAPI.updateCarouselItem(itemData.id, itemData);
    } else {
      // Create
      result = await contentAPI.createCarouselItem(itemData);
    }

    if (result.error) {
      setError(`Failed to ${itemData.id ? 'update' : 'create'} item.`);
    } else {
      closeModal();
      await loadItems(); // Refresh list
    }
    setLoading(false);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this item?')) {
      setLoading(true);
      const { error } = await contentAPI.deleteCarouselItem(id);
      if (error) {
        setError('Failed to delete item.');
      }
      await loadItems();
      setLoading(false);
    }
  };

  const handleToggleActive = async (item) => {
    const updatedItem = { ...item, is_active: !item.is_active };
    const { error } = await contentAPI.updateCarouselItem(item.id, { is_active: updatedItem.is_active });
    if (error) {
      setError('Failed to update status.');
    } else {
      setItems(items.map(i => i.id === item.id ? updatedItem : i));
    }
  };

  if (loading && items.length === 0) {
    return (
      <div className="carousel-management">
        <div className="cm-header">
          <GenericSkeleton width="200px" height="32px" />
        </div>
        <div className="cm-item-list">
          {Array.from({ length: 3 }).map((_, idx) => (
            <div key={`skeleton-${idx}`} className="cm-item">
              <GenericSkeleton width="120px" height="80px" borderRadius="8px" />
              <div className="cm-item-info">
                <GenericSkeleton width="60%" height="20px" />
                <div style={{ marginTop: '10px' }}><GenericSkeleton width="40%" height="14px" /></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return <div className="cm-error">Error: {error}</div>;
  }

  return (
    <div className="carousel-management">
      <div className="cm-header" style={{ justifyContent: 'flex-end' }}>
        <button className="cm-btn-add" onClick={() => openModal()}>Add New Item</button>
      </div>

      <div className="cm-item-list">
        {items.map(item => (
          <div key={item.id} className={`cm-item ${!item.is_active ? 'inactive' : ''}`}>
            <img src={item.image_url} alt={item.title} className="cm-item-thumbnail" />
            <div className="cm-item-info">
              <h3>{item.title}</h3>
              <p>Order: {item.display_order}</p>
            </div>
            <div className="cm-item-actions">
              <label className="cm-switch">
                <input type="checkbox" checked={item.is_active} onChange={() => handleToggleActive(item)} />
                <span className="cm-slider"></span>
              </label>
              <button className="cm-btn-edit" onClick={() => openModal(item)}>Edit</button>
              <button className="cm-btn-delete" onClick={() => handleDelete(item.id)}>Delete</button>
            </div>
          </div>
        ))}
      </div>

      {isModalOpen && (
        <Modal onClose={closeModal}>
          <form onSubmit={handleSubmit} className="cm-form">
            <h2>{currentItem.id ? 'Edit' : 'Add'} Carousel Item</h2>
            
            <div className="cm-form-group">
              <label>Title</label>
              <input type="text" name="title" value={currentItem.title} onChange={handleInputChange} required />
            </div>
            
            <div className="cm-form-group">
              <label>Description</label>
              <textarea name="description" value={currentItem.description} onChange={handleInputChange}></textarea>
            </div>

            <div className="cm-form-group">
              <label>Image</label>
              <input type="file" onChange={handleFileChange} accept="image/*" />
              {imagePreview && <img src={imagePreview} alt="Preview" className="cm-image-preview" />}
            </div>

            <div className="cm-form-group">
              <label>Link URL (optional)</label>
              <input type="text" name="link_url" value={currentItem.link_url} onChange={handleInputChange} placeholder="/booking?movie=123" />
            </div>

            <div className="cm-form-group">
              <label>Display Order</label>
              <input type="number" name="display_order" value={currentItem.display_order} onChange={handleInputChange} />
            </div>

            <div className="cm-form-group-inline">
              <label>Active</label>
              <input type="checkbox" name="is_active" checked={currentItem.is_active} onChange={handleInputChange} />
            </div>

            <div className="cm-form-actions">
              <button type="button" className="cm-btn-cancel" onClick={closeModal}>Cancel</button>
              <button type="submit" className="cm-btn-save" disabled={loading}>
                {loading ? <span className="loading-spinner-sm"></span> : null}
                {currentItem.id ? 'Cập nhật' : 'Thêm mới'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

export default CarouselManagement;
