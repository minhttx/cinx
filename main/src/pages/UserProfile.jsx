import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { bookingAPI, movieAPI } from '../services/api';
import GenericSkeleton from '../components/GenericSkeleton';
import '../styles/UserProfile.css';
import '../styles/components/Card.css';

const UserProfile = () => {
  const { user, userProfile, updateProfile, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  
  // States for UI
  const [isInfoDrawerOpen, setIsInfoDrawerOpen] = useState(false);
  const [isHistoryDrawerOpen, setIsHistoryDrawerOpen] = useState(false);
  const [formData, setFormData] = useState({ name: '', phone: '', address: '', birth_year: '' });
  const [bookingHistory, setBookingHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const initFormData = useCallback(() => {
    if (userProfile) {
      setFormData({
        name: userProfile.name || '',
        phone: userProfile.phone || '',
        address: userProfile.address || '',
        birth_year: userProfile.birth_year || '',
      });
    }
  }, [userProfile]);

  useEffect(() => {
    if (user && userProfile) {
      initFormData();
      loadBookingHistory();
      setLoading(false);
    } else if (!authLoading) {
      setLoading(false);
    }
  }, [user, userProfile, authLoading, initFormData]);

  const loadBookingHistory = async () => {
    if (!user?.id) return;
    try {
      setLoading(true);
      const { data, error } = await bookingAPI.getUserBookings(user.id, user.email);
      if (!error) {
        setBookingHistory(data || []);
      }
    } catch (err) {
      console.error('Booking history load error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    const { error } = await updateProfile(formData);
    if (!error) {
      setIsInfoDrawerOpen(false);
    } else {
      alert('Lỗi cập nhật thông tin: ' + error.message);
    }
    setSubmitting(false);
  };

  const formatCurrency = (amount) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  const formatDate = (dateStr) => new Date(dateStr).toLocaleDateString('vi-VN');

  if (loading && !userProfile) {
    return (
      <div className="user-profile-page">
        <div className="profile-cards-container">
          <GenericSkeleton width="400px" height="550px" borderRadius="24px" />
          <GenericSkeleton width="400px" height="550px" borderRadius="24px" />
        </div>
      </div>
    );
  }

  if (!user && !authLoading) {
    return (
      <div className="user-profile-page">
        <div className="no-access-container">
          <span className="material-symbols-outlined large-icon">lock</span>
          <p>Vui lòng đăng nhập để xem thông tin cá nhân.</p>
          <button className="m3-btn m3-btn-filled" onClick={() => navigate('/login')}>Đăng nhập</button>
        </div>
      </div>
    );
  }

  const recentBookings = bookingHistory.slice(0, 5);

  return (
    <div className="user-profile-page">
      <div className="profile-cards-container">
        {/* INFORMATION CARD */}
        <div className="profile-main-card info-card" onClick={() => setIsInfoDrawerOpen(true)}>
          <div className="card-top-half">
            <div className="avatar-wrapper">
              {userProfile?.avatar_url ? (
                <img src={userProfile.avatar_url} alt="Avatar" className="profile-avatar-large" />
              ) : (
                <div className="avatar-placeholder">
                  <span className="material-symbols-outlined">person</span>
                </div>
              )}
              <div className="edit-badge">
                <span className="material-symbols-outlined">edit</span>
              </div>
            </div>
          </div>
          <div className="card-bottom-half">
            <h2 className="profile-name-display">{userProfile?.name || 'Cập nhật họ tên'}</h2>
            <div className="profile-info-list">
              <div className="info-item"><span className="material-symbols-outlined">mail</span> {user?.email}</div>
              <div className="info-item"><span className="material-symbols-outlined">phone</span> {userProfile?.phone || 'Chưa cập nhật'}</div>
              <div className="info-item"><span className="material-symbols-outlined">location_on</span> {userProfile?.address || 'Chưa cập nhật'}</div>
              <div className="info-item"><span className="material-symbols-outlined">cake</span> {userProfile?.birth_year || 'Chưa cập nhật'}</div>
            </div>
          </div>
        </div>

        {/* HISTORY CARD */}
        <div className="profile-main-card history-card" onClick={() => setIsHistoryDrawerOpen(true)}>
          <div className="history-card-header">
            <span className="material-symbols-outlined">history</span>
            <h3>Lịch sử đặt vé</h3>
          </div>
          <div className="history-preview-list">
            {recentBookings.length > 0 ? (
              recentBookings.map(booking => {
                const info = typeof booking.showtime_info === 'string' ? JSON.parse(booking.showtime_info) : booking.showtime_info;
                return (
                  <div key={booking.id} className="history-mini-item">
                    <div className="mini-item-info">
                      <span className="mini-movie-title">{info?.movie_title || 'Phim'}</span>
                      <span className="mini-date">{formatDate(booking.booking_date || booking.created_at)}</span>
                    </div>
                    <div className="mini-item-amount">{formatCurrency(booking.total_amount)}</div>
                  </div>
                );
              })
            ) : (
              <div className="empty-history-preview">
                <p>Chưa có giao dịch nào.</p>
              </div>
            )}
          </div>
          <div className="history-card-footer">
            <span>Xem tất cả lịch sử</span>
            <span className="material-symbols-outlined">arrow_forward</span>
          </div>
        </div>
      </div>

      {/* INFO EDIT DRAWER */}
      <div className={`profile-drawer ${isInfoDrawerOpen ? 'open' : ''}`}>
        <div className="drawer-header">
          <h2>Chỉnh sửa thông tin</h2>
          <button className="drawer-close-btn" onClick={() => setIsInfoDrawerOpen(false)}>
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>
        <div className="drawer-body">
          <form onSubmit={handleSave} className="profile-edit-form">
            <div className="m3-textfield">
              <input type="text" id="name" name="name" value={formData.name} onChange={handleInputChange} required placeholder="Họ và tên" />
            </div>
            <div className="m3-textfield">
              <input type="tel" id="phone" name="phone" value={formData.phone} onChange={handleInputChange} placeholder="Số điện thoại" />
            </div>
            <div className="m3-textfield">
              <input type="text" id="address" name="address" value={formData.address} onChange={handleInputChange} placeholder="Địa chỉ" />
            </div>
            <div className="m3-textfield">
              <input type="number" id="birth_year" name="birth_year" value={formData.birth_year} onChange={handleInputChange} placeholder="Năm sinh" min="1900" max={new Date().getFullYear()} />
            </div>
            <button type="submit" className="m3-btn m3-btn-filled save-btn" disabled={submitting}>
              {submitting ? <span className="loading-spinner-sm"></span> : 'Lưu thông tin'}
            </button>
          </form>
        </div>
      </div>

      {/* FULL HISTORY DRAWER */}
      <div className={`profile-drawer history-drawer ${isHistoryDrawerOpen ? 'open' : ''}`}>
        <div className="drawer-header">
          <h2>Toàn bộ lịch sử</h2>
          <button className="drawer-close-btn" onClick={() => setIsHistoryDrawerOpen(false)}>
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>
        <div className="drawer-body">
          <div className="full-history-list">
            {bookingHistory.map(booking => {
              const info = typeof booking.showtime_info === 'string' ? JSON.parse(booking.showtime_info) : booking.showtime_info;
              return (
                <div key={booking.id} className="history-full-item">
                  <div className="item-header">
                    <span className="movie-title">{info?.movie_title}</span>
                  </div>
                  <div className="item-details">
                    <div className="detail-row"><span>Ngày:</span> <span>{formatDate(booking.booking_date || booking.created_at)}</span></div>
                    <div className="detail-row"><span>Suất:</span> <span>{booking.showtimes?.show_time?.substring(0, 5)}</span></div>
                    <div className="detail-row"><span>Tổng:</span> <strong>{formatCurrency(booking.total_amount)}</strong></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className={`drawer-overlay ${(isInfoDrawerOpen || isHistoryDrawerOpen) ? 'show' : ''}`} onClick={() => { setIsInfoDrawerOpen(false); setIsHistoryDrawerOpen(false); }} />
    </div>
  );
};

export default UserProfile;
