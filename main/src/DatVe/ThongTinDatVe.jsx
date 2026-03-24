import React from 'react';
import { connect } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { bookingAPI } from '../services/api';

const ThongTinDatVe = ({ gheDangChon, tongTien, isSubmitting, dispatch, movieInfo, showtime }) => {
  const { user, userProfile } = useAuth();
  const navigate = useNavigate();

  const handleConfirmBooking = async () => {
    if (!user) {
      alert('Vui lòng đăng nhập để hoàn tất đặt vé.');
      return;
    }

    try {
      // Set loading state
      dispatch({ type: "SET_SUBMITTING", isSubmitting: true });

      // Prepare booking data with proper schema
      const bookingData = {
        user_id: user?.id,
        showtime_id: showtime?.id || null, // Keep original type (UUID or integer)
        customer_name: userProfile?.name || user?.email || 'Guest User',
        customer_email: user?.email,
        customer_phone: userProfile?.phone || null,
        seats: gheDangChon,
        total_amount: parseInt(tongTien) || 0
      };

      console.log('🔍 Debug booking data types:', {
        user_id: `${user?.id} (${typeof user?.id})`,
        showtime_id: `${bookingData.showtime_id} (${typeof bookingData.showtime_id})`,
        total_amount: `${bookingData.total_amount} (${typeof bookingData.total_amount})`,
        showtime_raw: showtime
      });

      // Always save showtime_info as backup (contains movie title, showtime details, and seats)
      bookingData.showtime_info = JSON.stringify({
        date: showtime?.date,
        time: showtime?.time,
        movie_title: movieInfo?.title,
        cinema_room: movieInfo?.cinema_room ? `Phòng ${movieInfo.cinema_room}` : 'Phòng chiếu',
        showtime_id: showtime?.id || null,
        movie_id: movieInfo?.id || null,
        seats: gheDangChon // Include selected seats info
      });

      // Add movie_id for fallback when showtime_id is null
      if (!showtime?.id && movieInfo?.id) {
        bookingData.movie_id = parseInt(movieInfo.id);
      }

      console.log('🎫 Creating booking:', bookingData);

      // Save booking to database
      const { data, error } = await bookingAPI.createBooking(bookingData);

      if (error) {
        console.error('Booking error:', error);
        alert('Lỗi khi đặt vé: ' + error.message);
        return;
      }

      console.log('✅ Booking successful:', data);

      // Navigate to success page with booking details
      const bookingId = data?.id || data?.[0]?.id || 'N/A';
      navigate('/booking-success', {
        state: {
          bookingId: bookingId,
          totalAmount: tongTien
        }
      });

      // Confirm booking in Redux (marks seats as booked)
      dispatch({ type: "XAC_NHAN" });

    } catch (error) {
      console.error('Booking failed:', error);
      alert('Lỗi khi đặt vé. Vui lòng thử lại sau.');
    } finally {
      // Stop loading
      dispatch({ type: "SET_SUBMITTING", isSubmitting: false });
    }
  };

  // Group selected seats by price
  const groupedSeats = gheDangChon.reduce((acc, seat) => {
    const price = seat.gia;
    if (!acc[price]) {
      acc[price] = [];
    }
    acc[price].push(seat.soGhe);
    return acc;
  }, {});

  return (
    <div className="m3-card booking-summary-card">
      <div className="summary-content">
        <h3 className="card-title">Tóm tắt đơn hàng</h3>
        
        <div className="summary-section user-info">
          <p><strong>Người đặt:</strong> {userProfile?.name || user?.email}</p>
        </div>

        <div className="summary-section movie-info">
          <h4>Thông tin phim</h4>
          <p><strong>Tên phim:</strong> {movieInfo?.title}</p>
          <p><strong>Ngày chiếu:</strong> {showtime?.date ? new Date(showtime.date).toLocaleDateString('vi-VN', { weekday: 'long', day: 'numeric', month: 'numeric', year: 'numeric' }) : 'N/A'}</p>
          <p><strong>Giờ chiếu:</strong> {showtime?.time}</p>
          {movieInfo?.cinema_room && (
            <p><strong>Phòng chiếu:</strong> Phòng {movieInfo.cinema_room}</p>
          )}
        </div>

        <div className="summary-section">
          <h4>Ghế đã chọn</h4>
          {gheDangChon.length > 0 ? (
            <div className="grouped-seats-list">
              {Object.entries(groupedSeats).map(([price, seats]) => (
                <div key={price} className="seat-group-row">
                  <div className="seat-group-info">
                    <span className="seat-group-label">Ghế ({seats.length} x {Number(price).toLocaleString('vi-VN')}đ)</span>
                    <span className="seat-group-numbers">{seats.join(', ')}</span>
                  </div>
                  <span className="seat-group-total">{(seats.length * price).toLocaleString('vi-VN')}đ</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="no-seats-text">Vui lòng chọn ghế từ sơ đồ.</p>
          )}
        </div>

        <div className="summary-section total-section">
          <div className="total-row">
            <span>Tổng cộng</span>
            <span className="total-price">{tongTien.toLocaleString('vi-VN')}đ</span>
          </div>
        </div>

        <button 
          className="m3-btn m3-btn-filled confirm-button"
          disabled={gheDangChon.length === 0 || isSubmitting}
          onClick={handleConfirmBooking}
        >
          {isSubmitting ? 'Đang xử lý...' : 'Xác nhận đặt vé'}
        </button>
      </div>

      <div className="seat-legend">
        <h4>Chú thích</h4>
        <div className="legend-item"><div className="seat-btn-demo regular"></div> Ghế thường</div>
        <div className="legend-item"><div className="seat-btn-demo couple"></div> Ghế đôi</div>
        <div className="legend-item"><div className="seat-btn-demo vip"></div> Ghế VIP</div>
        <div className="legend-item"><div className="seat-btn-demo selected"></div> Đang chọn</div>
        <div className="legend-item"><div className="seat-btn-demo booked"></div> Đã đặt</div>
      </div>
    </div>
  );
};

const mapStateToProps = (state) => ({
  gheDangChon: state.datVeReducer.gheDangChon,
  tongTien: state.datVeReducer.tongTien,
  isSubmitting: state.datVeReducer.isSubmitting,
});

export default connect(mapStateToProps)(ThongTinDatVe);
