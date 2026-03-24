import React, { useEffect } from 'react';
import { connect } from 'react-redux';
import { bookingAPI } from '../services/api';

const ChonGhe = ({ dispatch, danhSachGhe, gheDangChon, showtime }) => {
  
  useEffect(() => {
    const loadSeatsData = async () => {
      if (!showtime?.id) return;
      
      dispatch({ type: 'LOAD_SEATS_START' });
      const { data, error } = await bookingAPI.getSeats(showtime.id);
      
      if (error) {
        dispatch({ type: 'LOAD_SEATS_ERROR', error: error.message });
      } else {
        dispatch({ type: 'LOAD_SEATS', seats: data });
      }
    };

    loadSeatsData();
  }, [showtime?.id, dispatch]);

  const renderSeats = () => {
    // Standard rows A-H
    const rows = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
    
    return rows.map(rowLetter => {
      const rowData = danhSachGhe.find(item => item.hang === rowLetter);
      const seatsInRow = rowData?.danhSachGhe || [];
      
      // Determine how many items to render in this row
      const itemCount = (rowLetter === 'H') ? 6 : 12;

      return (
        <div key={rowLetter} className={`seat-row-minimal ${rowLetter === 'H' ? 'couple-row' : ''}`} data-row={rowLetter}>
          <span className="row-id">{rowLetter}</span>
          <div className="seats-container">
            {Array.from({ length: itemCount }).map((_, index) => {
              const seatNumber = `${rowLetter}${index + 1}`;
              const seat = seatsInRow.find(s => s.soGhe === seatNumber);
              
              const isSelected = gheDangChon.find(g => g.soGhe === seatNumber);
              const isBooked = seat?.daDat;
              const isAvailable = !!seat;
              const type = seat?.loaiGhe || (rowLetter === 'H' ? 'couple' : (['F', 'G'].includes(rowLetter) ? 'vip' : 'regular'));

              return (
                <button
                  key={seatNumber}
                  className={`minimal-seat ${type} ${isSelected ? 'selected' : ''} ${isBooked ? 'booked' : ''} ${!isAvailable ? 'unavailable' : ''}`}
                  disabled={isBooked || !isAvailable}
                  onClick={() => isAvailable && dispatch({ type: 'CHON_GHE', gheChon: seat })}
                  title={isAvailable ? `${seatNumber} - ${Number(seat.gia).toLocaleString()}đ` : 'Ghế không khả dụng'}
                >
                </button>
              );
            })}
          </div>
        </div>
      );
    });
  };

  return (
    <div className="minimal-seat-selection">
      <div className="seat-legend-minimal">
        <div className="legend-item"><span className="dot regular"></span> Thường</div>
        <div className="legend-item"><span className="dot vip"></span> VIP</div>
        <div className="legend-item"><span className="dot couple"></span> Đôi</div>
        <div className="legend-item"><span className="dot booked"></span> Đã được đặt</div>
      </div>

      <div className="screen-container">
        <div className="screen-line"></div>
        <p className="screen-text">MÀN HÌNH</p>
      </div>

      <div className="seat-grid-minimal">
        {renderSeats()}
      </div>
    </div>
  );
};

const mapStateToProps = (state) => ({
  danhSachGhe: state.datVeReducer.danhSachGhe,
  gheDangChon: state.datVeReducer.gheDangChon,
});

export default connect(mapStateToProps)(ChonGhe);
