import React, { useEffect, useState, useRef } from 'react';
import { bookingAPI, logAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import '../styles/CheckinScanner.css';

// Dynamically load the QR scanner script
const useExternalScript = (url) => {
  const [isLoaded, setIsLoaded] = useState(false);
  useEffect(() => {
    if (!url) return;
    const script = document.createElement('script');
    script.src = url;
    script.onload = () => setIsLoaded(true);
    document.body.appendChild(script);
    return () => {
      document.body.removeChild(script);
    };
  }, [url]);
  return isLoaded;
};

const CheckinScanner = () => {
  const { user, userProfile, isAdmin } = useAuth();
  const scriptLoaded = useExternalScript("https://unpkg.com/html5-qrcode");
  const [result, setResult] = useState({ status: null, message: '', detail: '' });
  const [isScanning, setIsScanning] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [historyLogs, setHistoryLogs] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const scannerRef = useRef(null);

  const loadMyHistory = async () => {
    if (!user) return;
    try {
      setLoadingHistory(true);
      const { data } = await logAPI.getCheckinLogs(20, user.id);
      setHistoryLogs(data || []);
    } catch (err) {
      console.error("Error loading checkin history:", err);
    } finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => {
    if (isHistoryOpen) loadMyHistory();
  }, [isHistoryOpen]);

  // This effect only initializes the scanner object, it does not start it.
  useEffect(() => {
    if (scriptLoaded && !scannerRef.current) {
      const html5QrcodeScanner = new window.Html5Qrcode("qr-reader");
      scannerRef.current = html5QrcodeScanner;
    }
  }, [scriptLoaded]);
  
  const startScanner = () => {
    if (!scannerRef.current) {
      console.error("Scanner not initialized yet.");
      return;
    }

    const onScanSuccess = async (decodedText, decodedResult) => {
      if (scannerRef.current.isScanning) {
        scannerRef.current.pause();
        await handleQrCode(decodedText);
        setTimeout(() => {
          if (scannerRef.current?.getState() === window.Html5QrcodeScannerState.PAUSED) {
            scannerRef.current.resume();
          }
        }, 3000);
      }
    };
    
    const config = { fps: 10, qrbox: { width: 250, height: 250 } };
    setIsScanning(true);

    // More robust camera selection for mobile
    window.Html5Qrcode.getCameras().then(cameras => {
      if (cameras && cameras.length) {
        // Find the back camera ('environment')
        const backCameras = cameras.filter(camera => camera.label.toLowerCase().includes('back'));
        const cameraId = backCameras.length > 0 ? backCameras[0].id : cameras[0].id; // Fallback to first camera

        scannerRef.current.start(
          cameraId, 
          config, 
          onScanSuccess
        ).catch(err => {
          console.error("Failed to start scanner with specific camera:", err);
          setResult({ status: 'error', message: 'Lỗi Camera', detail: 'Không thể khởi động camera. Vui lòng kiểm tra quyền và thử lại.' });
          setIsScanning(false);
        });
      } else {
        // Fallback for browsers that don't support getCameras well
        scannerRef.current.start({ facingMode: "environment" }, config, onScanSuccess)
          .catch(err => {
            console.error("Fallback camera start failed:", err);
            setResult({ status: 'error', message: 'Lỗi Camera', detail: 'Không tìm thấy camera hoặc không thể truy cập. Vui lòng cấp quyền trong cài đặt trình duyệt.' });
            setIsScanning(false);
          });
      }
    }).catch(err => {
      console.error("Error getting camera list:", err);
      setResult({ status: 'error', message: 'Lỗi Camera', detail: 'Không thể liệt kê danh sách camera. Vui lòng đảm bảo bạn đang dùng HTTPS.' });
      setIsScanning(false);
    });
  };

  useEffect(() => {
    // Cleanup on unmount
    return () => {
      if (scannerRef.current && scannerRef.current.isScanning) {
        scannerRef.current.clear().catch(err => console.error("Failed to clear scanner on unmount.", err));
      }
    };
  }, []);

  const handleQrCode = async (bookingId) => {
    try {
      const { data: booking, error } = await bookingAPI.getBookingForCheckin(bookingId);
      
      if (error || !booking) {
        throw new Error('Mã vé không hợp lệ hoặc không tồn tại.');
      }
      
      if (booking.status === 'checked_in') {
        setResult({ status: 'warning', message: 'Vé đã Check-in', detail: `Vé của phim "${booking.showtimes.movies.title}" đã được sử dụng.` });
        return;
      }
      
      if (booking.status !== 'confirmed') {
        throw new Error(`Vé chưa được thanh toán (Trạng thái: ${booking.status}).`);
      }

      const showtimeStart = new Date(`${booking.showtimes.show_date}T${booking.showtimes.show_time}`);
      const movieDuration = booking.showtimes.movies.duration; // in minutes
      const showtimeEnd = new Date(showtimeStart.getTime() + movieDuration * 60000);
      
      if (new Date() > showtimeEnd) {
        throw new Error('Suất chiếu đã kết thúc.');
      }
      
      // If we reach here, the ticket is valid. Let's check it in.
      const { error: updateError } = await bookingAPI.updateBookingStatus(booking.id, 'checked_in');
      if (updateError) {
        throw new Error('Lỗi cập nhật trạng thái vé. Vui lòng thử lại.');
      }

      // LOG ACTION
      await logAPI.logCheckin(
        user.id, 
        userProfile?.name || user.email, 
        booking.showtimes.movies.title, 
        `${booking.showtimes.show_date} ${booking.showtimes.show_time}`
      );
      
      setResult({ status: 'success', message: 'Check-in Thành Công', detail: `Phim: ${booking.showtimes.movies.title}
${booking.booking_seats.length} ghế: ${booking.booking_seats.map(s => s.seat_number).join(', ')}`});

    } catch (err) {
      setResult({ status: 'error', message: 'Vé Không Hợp Lệ', detail: err.message });
    }
  };

  return (
    <div className="checkin-scanner-page">
      <header className="checkin-header">
        <div className="checkin-title-group">
          <span className="checkin-logo">qr_code_scanner</span>
          <h1 className="checkin-title">CinX Checkin</h1>
        </div>
        <div className="checkin-actions">
          <button className="m3-btn m3-btn-text m3-btn-sm" onClick={() => setIsHistoryOpen(true)} title="Lịch sử quét">
            <span className="material-symbols-outlined">history</span>
          </button>
          {isAdmin() ? (
            <a href="/admin" className="m3-btn m3-btn-outlined m3-btn-sm" title="Về Admin">
              <span className="material-symbols-outlined">arrow_back</span>
            </a>
          ) : (
            <a href="/" className="m3-btn m3-btn-outlined m3-btn-sm" title="Trang chủ">
              <span className="material-symbols-outlined">home</span>
            </a>
          )}
        </div>
      </header>
      
      <div id="qr-reader" style={{ display: isScanning ? 'block' : 'none' }}></div>

      {!isScanning && scriptLoaded && (
        <div className="start-scan-container">
          <p>Nhấn nút để bắt đầu quét vé</p>
          <button className="m3-btn m3-btn-filled start-scan-btn" onClick={startScanner}>
            <span className="material-symbols-outlined">qr_code_scanner</span>
            Bắt đầu Quét
          </button>
        </div>
      )}

      <div 
        className={`checkin-result-overlay ${result.status ? 'visible' : ''}`}
        onClick={() => setResult({ status: null, message: '', detail: '' })}
      >
        <div className={`result-card ${result.status || ''}`}>
          <span className="result-icon material-symbols-outlined">
            {result.status === 'success' && 'check_circle'}
            {result.status === 'error' && 'cancel'}
            {result.status === 'warning' && 'warning'}
          </span>
          <h2 className="result-message">{result.message}</h2>
          <p className="result-detail">{result.detail}</p>
        </div>
      </div>

      {/* HISTORY DRAWER */}
      <div className={`admin-drawer ${isHistoryOpen ? 'open' : ''}`}>
        <div className="drawer-header-main">
          <h3>Lịch sử quét của bạn</h3>
          <button onClick={() => setIsHistoryOpen(false)} className="close-btn">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>
        <div className="drawer-body-main">
          {loadingHistory ? (
            <p>Đang tải...</p>
          ) : historyLogs.length === 0 ? (
            <div className="empty-state">Chưa có lịch sử quét nào.</div>
          ) : (
            <div className="checkin-history-list">
              {historyLogs.map(log => (
                <div key={log.id} className="history-item-minimal">
                  <div className="history-icon-small"><span className="material-symbols-outlined">qr_code_2</span></div>
                  <div className="history-info-small">
                    <div className="history-detail-small">{log.detail}</div>
                    <div className="history-time-small">{new Date(log.created_at).toLocaleString('vi-VN')}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      {isHistoryOpen && <div className="drawer-overlay-admin" onClick={() => setIsHistoryOpen(false)} />}
    </div>
  );
};

export default CheckinScanner;
