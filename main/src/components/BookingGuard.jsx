import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { bookingAPI } from '../services/api';
import ConfirmModal from './ConfirmModal';

const BookingGuard = ({ children }) => {
  const [showModal, setShowModal] = useState(false);
  const [pendingPath, setPendingPath] = useState(null);
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  
  const { bookingInProgress, pendingBookingId } = useSelector(state => state.datVeReducer);

  useEffect(() => {
    const handleGlobalClick = (e) => {
      if (!bookingInProgress) return;

      // Find if the click is on an anchor or something that triggers navigation
      const target = e.target.closest('a') || e.target.closest('button[data-nav]');
      if (!target) return;

      // Ignore CinX Assistant
      if (target.classList.contains('cinx-nav-item') || target.closest('.cinx-nav-item') || target.closest('.cinx-chat-window')) {
        return;
      }

      // Extract destination URL
      let targetHref = target.href;
      if (!targetHref && target.getAttribute('data-nav')) {
          targetHref = window.location.origin + target.getAttribute('data-nav');
      }
      if (!targetHref) return;

      try {
        const url = new URL(targetHref, window.location.origin);
        
        // If it's an internal link and different from current page
        if (url.origin === window.location.origin && (url.pathname !== location.pathname || url.search !== location.search)) {
          // BLOCK EVERYTHING IMMEDIATELY
          e.preventDefault();
          e.stopPropagation();
          e.stopImmediatePropagation();
          
          setPendingPath(url.pathname + url.search);
          setShowModal(true);
        }
      } catch (err) {
        console.error("Navigation check error:", err);
      }
    };

    // Use capturing phase (true) to intercept BEFORE React Router
    window.addEventListener('click', handleGlobalClick, true);

    const handleBeforeUnload = (e) => {
      if (bookingInProgress) {
        e.preventDefault();
        e.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('click', handleGlobalClick, true);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [bookingInProgress, location.pathname, location.search]);

  const handleConfirmExit = async () => {
    // 1. Close modal first
    setShowModal(false);
    
    // 2. Clear remote pending status if exists
    if (pendingBookingId) {
      try {
        await bookingAPI.deleteBooking(pendingBookingId);
      } catch (err) {
        console.error("Cleanup error:", err);
      }
    }

    // 3. Reset local states
    dispatch({ type: 'SET_BOOKING_PROGRESS', inProgress: false, bookingId: null });
    dispatch({ type: "RESET_SEATS" });

    // 4. Perform the delayed navigation
    if (pendingPath) {
      navigate(pendingPath);
    }
  };

  const handleCancelExit = () => {
    setShowModal(false);
    setPendingPath(null);
  };

  return (
    <>
      {children}
      <ConfirmModal 
        isOpen={showModal}
        title="Dừng đặt vé?"
        message="Bạn đang trong quy trình đặt vé. Nếu rời khỏi trang này, các ghế bạn đã chọn sẽ được giải phóng cho người khác. Bạn có chắc chắn muốn thoát?"
        onConfirm={handleConfirmExit}
        onCancel={handleCancelExit}
      />
    </>
  );
};

export default BookingGuard;
