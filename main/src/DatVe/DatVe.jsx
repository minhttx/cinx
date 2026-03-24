import React from 'react';
import { connect } from 'react-redux';
import ChonGhe from './ChonGhe';
import ThongTinDatVe from './ThongTinDatVe'; // This will be the new summary component

const DatVe = ({ movieInfo, showtime, onBack, dispatch, compactMode = false }) => {
  const handleBack = () => {
    // Reset seats when going back to showtime selection
    dispatch({ type: "RESET_SEATS" });
    onBack();
  };

  return (
    <div className={`seat-selection-layout ${compactMode ? 'compact' : ''}`}>
      {!compactMode && (
        <div className="seat-selection-header">
          <button className="m3-btn m3-btn-text back-button" onClick={handleBack}>&larr; Chọn lại suất chiếu</button>
          <div className="header-info">
            <h1>{movieInfo.title}</h1>
            <p>{new Date(showtime.date).toLocaleDateString('vi-VN', { weekday: 'long', day: 'numeric', month: 'numeric' })} - {showtime.time}</p>
          </div>
        </div>
      )}
      <div className="seat-selection-main">
        <ChonGhe showtime={showtime} movieInfo={movieInfo} />
        {!compactMode && <ThongTinDatVe movieInfo={movieInfo} showtime={showtime} />}
      </div>
    </div>
  );
};

export default connect()(DatVe);