import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { bookingAPI } from '../services/api';
import GenericSkeleton from '../components/GenericSkeleton';
import '../styles/MyTicketsPage.css';

const MyTicketsPage = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();
  const scrollRef = useRef(null);

  // Scroll tracking state
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const checkScroll = () => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      setCanScrollLeft(scrollLeft > 1);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 1);
    }
  };

  useEffect(() => {
    const fetchBookings = async () => {
      if (!user) return;
      setLoading(true);
      const { data, error } = await bookingAPI.getUserBookings(user.id, user.email);
      if (!error) {
        const now = new Date();
        const validBookings = (data || []).filter(booking => {
          if (!booking.showtimes) return false;
          
          // Combine date and time string
          const showtimeStart = new Date(`${booking.showtimes.show_date}T${booking.showtimes.show_time}`);
          const duration = booking.showtimes.movies?.duration || 120; // Default 2 hours if missing
          
          // Expiry = Start Time + Duration
          const expiryTime = new Date(showtimeStart.getTime() + duration * 60000);
          
          return now <= expiryTime;
        });
        setBookings(validBookings);
      }
      setLoading(false);
    };
    fetchBookings();
  }, [user]);

  useEffect(() => {
    checkScroll();
    window.addEventListener('resize', checkScroll);
    return () => window.removeEventListener('resize', checkScroll);
  }, [bookings]);

  const handleShowDetails = (booking) => {
    setSelectedBooking(booking);
    setSidebarOpen(true);
  };

  const handleCloseSidebar = () => {
    setSidebarOpen(false);
    setTimeout(() => setSelectedBooking(null), 300);
  };

  const scroll = (direction) => {
    if (scrollRef.current) {
      const { scrollLeft, clientWidth } = scrollRef.current;
      const scrollTo = direction === 'left' ? scrollLeft - clientWidth * 0.8 : scrollLeft + clientWidth * 0.8;
      scrollRef.current.scrollTo({ left: scrollTo, behavior: 'smooth' });
      setTimeout(checkScroll, 400);
    }
  };

  const getSeatNumbers = (booking) => {
    if (booking.booking_seats?.length > 0) return booking.booking_seats.map(s => s.seat_number).join(', ');
    if (booking.parsed_info?.seats?.length > 0) return booking.parsed_info.seats.map(s => s.soGhe || s.seat_number).join(', ');
    return '';
  };

  if (loading && bookings.length === 0) return (
    <div className="my-tickets-page">
      <div className="carousel-wrapper">
        <div className="tickets-grid">
          {Array.from({ length: 3 }).map((_, idx) => (
            <div key={`skeleton-${idx}`} className="ticket-stub" style={{ cursor: 'default' }}>
              <GenericSkeleton width="100%" height="200px" borderRadius="12px 12px 0 0" />
              <div className="ticket-info-section">
                <div className="ticket-perforation"></div>
                <GenericSkeleton width="80%" height="20px" borderRadius="4px" />
                <div className="ticket-details-row" style={{ marginTop: '15px' }}>
                  <GenericSkeleton width="40%" height="12px" />
                  <GenericSkeleton width="40%" height="12px" />
                </div>
                <div className="ticket-details-row" style={{ marginTop: '10px' }}>
                  <GenericSkeleton width="30%" height="12px" />
                  <GenericSkeleton width="50%" height="12px" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <div className="my-tickets-page">
      {bookings.length > 0 ? (
        <div className="carousel-wrapper">
          <button 
            className="nav-btn prev" 
            onClick={() => scroll('left')}
            disabled={!canScrollLeft}
          >
            <span className="material-symbols-outlined">chevron_left</span>
          </button>

          <div 
            className="tickets-grid" 
            ref={scrollRef}
            onScroll={checkScroll}
          >
            {bookings.map((booking) => {
              const info = typeof booking.showtime_info === 'string' ? JSON.parse(booking.showtime_info) : booking.showtime_info;
              const movie = booking.showtimes?.movies;
              const date = new Date(booking.showtimes?.show_date).toLocaleDateString('vi-VN');
              const time = booking.showtimes?.show_time?.substring(0, 5);

              return (
                <div key={booking.id} className="ticket-stub animate-pop" onClick={() => handleShowDetails(booking)}>
                  <div className="ticket-poster-section">
                    <img src={movie?.poster} alt={movie?.title} className="ticket-poster-crop" />
                    <div className="ticket-overlay-gradient"></div>
                  </div>
                  <div className="ticket-info-section">
                    <div className="ticket-perforation"></div>
                    <h2 className="ticket-movie-title">{movie?.title}</h2>
                    <div className="ticket-details-row">
                      <div className="ticket-detail"><span className="detail-label">Ngày</span><span className="detail-value">{date}</span></div>
                      <div className="ticket-detail"><span className="detail-label">Giờ</span><span className="detail-value">{time}</span></div>
                    </div>
                    <div className="ticket-details-row">
                      <div className="ticket-detail"><span className="detail-label">Phòng</span><span className="detail-value">{booking.showtimes?.cinema_room}</span></div>
                      <div className="ticket-detail"><span className="detail-label">Ghế</span><span className="detail-value">{getSeatNumbers(booking)}</span></div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <button 
            className="nav-btn next" 
            onClick={() => scroll('right')}
            disabled={!canScrollRight}
          >
            <span className="material-symbols-outlined">chevron_right</span>
          </button>
        </div>
      ) : (
        <div className="no-tickets">
          <span className="material-symbols-outlined empty-icon">confirmation_number</span>
          <h3>Bạn chưa có vé nào</h3>
          <p>Hãy chọn phim và đặt vé ngay nhé!</p>
          <button className="m3-btn m3-btn-filled" style={{ marginTop: '24px' }} onClick={() => navigate('/booking')}>Đặt vé ngay</button>
        </div>
      )}

      {/* Sidebar Details */}
      <div className={`ticket-sidebar-overlay ${sidebarOpen ? 'open' : ''}`} onClick={handleCloseSidebar}></div>
      <div className={`ticket-sidebar ${sidebarOpen ? 'open' : ''}`}>
        <button className="sidebar-close-btn" onClick={handleCloseSidebar}><span className="material-symbols-outlined">close</span></button>
        {selectedBooking && (
          <div className="ticket-details-content">
            <h2 className="sidebar-title">Chi tiết vé</h2>
            <div className="qr-container">
              <img src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${selectedBooking.id}`} alt="QR Code" className="qr-image" />
              <p className="booking-id-text">Mã vé: {selectedBooking.id.slice(0, 8).toUpperCase()}</p>
            </div>
            <div className="booking-summary-details">
              <div className="summary-item"><span>Phim</span><strong>{selectedBooking.showtimes?.movies?.title}</strong></div>
              <div className="summary-item"><span>Ngày chiếu</span><strong>{new Date(selectedBooking.showtimes?.show_date).toLocaleDateString('vi-VN')}</strong></div>
              <div className="summary-item"><span>Suất chiếu</span><strong>{selectedBooking.showtimes?.show_time?.substring(0, 5)}</strong></div>
              <div className="summary-item"><span>Phòng</span><strong>{selectedBooking.showtimes?.cinema_room}</strong></div>
              <div className="summary-item"><span>Số ghế</span><strong>{getSeatNumbers(selectedBooking)}</strong></div>
              <div className="summary-item total"><span>Tổng thanh toán</span><strong>{selectedBooking.total_amount?.toLocaleString()} đ</strong></div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MyTicketsPage;
