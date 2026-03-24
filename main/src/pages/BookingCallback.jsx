import React, { useEffect, useState, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { bookingAPI } from '../services/api';
import { verifyVnpaySignature } from '../utils/vnpay';
import '../styles/BookingPage.css'; // Reuse layout styles
import '../styles/MyTicketsPage.css'; // Reuse ticket stub styles

const BookingCallback = () => {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState('processing');
  const [bookingData, setBookingData] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const processed = useRef(false);

  useEffect(() => {
    const handleCallback = async () => {
      if (processed.current) return;
      processed.current = true;

      const params = Object.fromEntries(searchParams.entries());
      const isVerified = await verifyVnpaySignature(params);

      if (!isVerified) {
        setStatus('error');
        setErrorMessage('Chữ ký thanh toán không hợp lệ.');
        return;
      }

      const responseCode = params['vnp_ResponseCode'];
      const bookingId = params['vnp_TxnRef'];

      if (responseCode === '00') {
        try {
          const { data: currentBooking } = await bookingAPI.getBookingById(bookingId);
          if (!currentBooking) throw new Error('Không tìm thấy đơn hàng.');

          let seats = [];
          if (currentBooking.seats) {
            seats = typeof currentBooking.seats === 'string' ? JSON.parse(currentBooking.seats) : currentBooking.seats;
          }

          await bookingAPI.updateBookingStatus(bookingId, 'confirmed', seats);
          
          // CLEAR BOOKING PROGRESS
          dispatch({ type: 'SET_BOOKING_PROGRESS', inProgress: false, bookingId: null });

          setBookingData(currentBooking);
          setStatus('success');
        } catch (err) {
          setStatus('error');
          setErrorMessage('Lỗi cập nhật vé: ' + err.message);
        }
      } else {
        setStatus('error');
        setErrorMessage(`Thanh toán thất bại (Mã lỗi: ${responseCode})`);
      }
    };
    handleCallback();
  }, [searchParams, dispatch]);

  // Helper to format seats
  const getSeatNumbers = (booking) => {
    if (booking?.booking_seats?.length > 0) return booking.booking_seats.map(s => s.seat_number).join(', ');
    if (booking?.seats) {
        const s = typeof booking.seats === 'string' ? JSON.parse(booking.seats) : booking.seats;
        return s.map(x => x.soGhe || x.seat_number).join(', ');
    }
    return '';
  };

  const renderTicketStub = () => {
    const info = bookingData;
    const movie = info?.showtimes?.movies;
    const date = new Date(info?.showtimes?.show_date).toLocaleDateString('vi-VN');
    const time = info?.showtimes?.show_time?.substring(0, 5);
    
    return (
      <div className="ticket-confirmation-view">
        <div className="ticket-stub large-stub animate-pop">
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
              <div className="ticket-detail"><span className="detail-label">Phòng</span><span className="detail-value">{info?.showtimes?.cinema_room}</span></div>
              <div className="ticket-detail"><span className="detail-label">Ghế</span><span className="detail-value">{getSeatNumbers(info)}</span></div>
            </div>
            <div className="ticket-id-footer">
                <span>ORDER ID: {info?.id?.slice(0, 8).toUpperCase()}</span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="booking-page-layout full-screen-flow">
      <div className="booking-main-content" style={{display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
        {status === 'processing' && <div className="loading-view"><div className="spinner"></div><p>Đang xác thực giao dịch...</p></div>}
        
        {status === 'success' && renderTicketStub()}

        {status === 'error' && (
          <div className="payment-error-view">
            <span className="material-symbols-outlined error-icon">error</span>
            <h2>Giao dịch thất bại</h2>
            <p>{errorMessage}</p>
          </div>
        )}
      </div>

      <div className="booking-process-drawer open">
        <div className="drawer-header">
            <div className="booking-progress-bar">
                <div className="progress-step active">1</div>
                <div className="progress-line active"></div>
                <div className="progress-step active">2</div>
                <div className="progress-line active"></div>
                <div className="progress-step active">3</div>
                <div className="progress-line active"></div>
                <div className="progress-step active">4</div>
            </div>
        </div>
        <div className="drawer-body">
          {status === 'success' ? (
            <div className="success-message-panel">
              <span className="material-symbols-outlined success-check-icon">verified</span>
              <h2 className="drawer-title">Thanh toán thành công!</h2>
              <p className="success-desc">Vé của bạn đã được xác nhận. Vui lòng xuất trình mã QR tại quầy vé.</p>
              
              <div className="qr-box-drawer">
                <img 
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${bookingData?.id}`} 
                  alt="QR Code" 
                />
                <p className="booking-id-small">#{bookingData?.id?.slice(0, 8).toUpperCase()}</p>
              </div>

              <div className="drawer-divider"></div>
              
              <div className="summary-item"><span>Tổng tiền</span><strong>{bookingData?.total_amount?.toLocaleString()} đ</strong></div>
              <div className="summary-item"><span>Phương thức</span><strong>VNPAY</strong></div>

              <div className="drawer-bill-section">
                <button className="m3-btn m3-btn-filled confirm-booking-btn" onClick={() => navigate('/my-tickets')}>Xem vé của tôi</button>
                <button className="m3-btn m3-btn-text" style={{marginTop: '12px', width: '100%'}} onClick={() => navigate('/')}>Quay về trang chủ</button>
              </div>
            </div>
          ) : (
            <div className="error-message-panel">
               <h2 className="drawer-title">Thông tin thanh toán</h2>
               <p>Có lỗi xảy ra trong quá trình xử lý giao dịch của bạn.</p>
               <div className="drawer-bill-section">
                <button className="m3-btn m3-btn-filled confirm-booking-btn" onClick={() => navigate('/booking')}>Thử lại</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BookingCallback;
