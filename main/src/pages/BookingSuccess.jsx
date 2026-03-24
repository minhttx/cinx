import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import '../styles/BookingSuccess.css';

const BookingSuccess = () => {
  const location = useLocation();
  const navigate = useNavigate();
  
  // Get booking data from navigation state
  const { bookingId, totalAmount } = location.state || {};
  
  const handleGoHome = () => {
    navigate('/');
  };
  
  const handleBookAgain = () => {
    navigate('/booking');
  };
  
  // If no booking data, redirect to home
  if (!bookingId) {
    navigate('/');
    return null;
  }
  
  return (
    <div className="booking-success-page">
      <div className="success-container">
        <div className="success-content">
          <div className="success-icon">
            <span className="material-symbols-outlined">check_circle</span>
          </div>
          
          <h1 className="success-title">Đặt vé thành công!</h1>
          
          <div className="booking-details">
            <div className="detail-item">
              <span className="detail-label">Mã đặt vé:</span>
              <span className="detail-value">{bookingId}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Tổng tiền:</span>
              <span className="detail-value">{totalAmount?.toLocaleString('vi-VN')}đ</span>
            </div>
          </div>
          
          <div className="success-message">
            <p>Cảm ơn bạn đã đặt vé! Vui lòng đến rạp trước giờ chiếu 15 phút để nhận vé.</p>
          </div>
          
          <div className="success-actions">
            <button 
              className="m3-btn m3-btn-filled"
              onClick={handleGoHome}
            >
              <span className="material-symbols-outlined">home</span>
              Quay về trang chủ
            </button>
            
            <button 
              className="m3-btn m3-btn-tonal"
              onClick={handleBookAgain}
            >
              <span className="material-symbols-outlined">movie</span>
              Đặt vé phim khác
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookingSuccess;