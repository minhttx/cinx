import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { connect } from 'react-redux';
import { movieAPI, showtimeAPI, bookingAPI } from '../services/api';
import { gatherAIContext, getRecommendationChips, getRecommendedMovies, getSmartShowtimeCount } from '../services/ai';
import { useAuth } from '../contexts/AuthContext';
import { createVnpayUrl } from '../utils/vnpay';
import MovieCard from '../components/MovieCard';
import MovieCardSkeleton from '../components/MovieCardSkeleton';
import MovieInfoSidebar from '../components/MovieInfoSidebar';
import ConfirmModal from '../components/ConfirmModal';
import DatVe from '../DatVe/DatVe';
import '../styles/BookingPage.css';
import '../styles/components/Card.css';

// --- Sub-component: Countdown Timer ---
const CountdownTimer = ({ minutes, onExpire }) => {
  const [timeLeft, setTimeLeft] = useState(minutes * 60);

  useEffect(() => {
    if (timeLeft <= 0) {
      onExpire();
      return;
    }
    const timer = setInterval(() => {
      setTimeLeft(prev => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [timeLeft, onExpire]);

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="countdown-timer">
      <span className="material-symbols-outlined">timer</span>
      <span className="time-value">{formatTime(timeLeft)}</span>
    </div>
  );
};

// --- Main Page Component ---
const BookingPage = ({ gheDangChon, tongTien, isSubmitting, dispatch }) => {
  const [searchParams] = useSearchParams();
  const [bookingStep, setBookingStep] = useState('movie'); // movie, showtime, seats, payment
  const [allMovies, setAllMovies] = useState([]);
  const [displayMovies, setDisplayMovies] = useState([]);
  const [showtimes, setShowtimes] = useState([]);
  const [selectedMovie, setSelectedMovie] = useState(null);
  const [selectedShowtime, setSelectedShowtime] = useState(null);
  const [loading, setLoading] = useState(true);
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [bookingId, setBookingId] = useState(null);
  const [isExpired, setIsExpired] = useState(false);
  const [aiChips, setAiChips] = useState([]);
  const [activeChip, setActiveChip] = useState('all');
  const [aiContext, setAiContext] = useState(null);
  const [isInfoSidebarOpen, setIsInfoSidebarOpen] = useState(false);
  const [sidebarMovie, setSidebarMovie] = useState(null);
  const [showCloseConfirm, setShowCloseConfirm] = useState(false);

  // Scroll tracking state
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const { user, userProfile } = useAuth();
  const navigate = useNavigate();
  const scrollRef = useRef(null);

  const checkScroll = () => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      setCanScrollLeft(scrollLeft > 1);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 1);
    }
  };

  useEffect(() => {
    const initPage = async () => {
      setLoading(true);
      const { data: movieData } = await movieAPI.getCurrentMovies();
      const currentMovies = movieData || [];
      setAllMovies(currentMovies);
      const context = await gatherAIContext(user, userProfile);
      setAiContext(context);
      const chips = await getRecommendationChips(context);
      setAiChips(chips);

      const movieId = searchParams.get('movie');
      const shouldOpenInfo = searchParams.get('info') === 'true';
      const directShowtimeId = searchParams.get('showtime');

      if (movieId && currentMovies.length > 0) {
        const movie = currentMovies.find(m => m.id.toString() === movieId);
        if (movie) {
          if (shouldOpenInfo) {
            setSidebarMovie(movie);
            setIsInfoSidebarOpen(true);
          } else {
            setSelectedMovie(movie);
            const { data: stData } = await showtimeAPI.getMovieShowtimes(movie.id);
            
            if (stData && stData.length > 0) {
              const sids = stData.map(st => st.id);
              const availabilityMap = await showtimeAPI.getBulkShowtimeAvailability(sids);
              const finalGrouped = groupShowtimesByDate(stData, availabilityMap);
              setShowtimes(finalGrouped);

              // Nếu có directShowtimeId, tìm và chọn nó
              if (directShowtimeId) {
                const targetSt = stData.find(s => s.id === directShowtimeId);
                if (targetSt) {
                  const available = availabilityMap[targetSt.id] || 0;
                  setSelectedShowtime({ ...targetSt, availableSeats: available });
                  setBookingStep('seats');
                } else {
                  setBookingStep('showtime');
                }
              } else {
                setBookingStep('showtime');
              }
            }
            dispatch({ type: 'SET_BOOKING_PROGRESS', inProgress: true });
          }
        }
      }

      setDisplayMovies(getRecommendedMovies(currentMovies, 'all', null, context));
      setLoading(false);
    };

    initPage();
    return () => document.body.classList.remove('booking-flow-active');
  }, [searchParams, user, userProfile, dispatch]);

  // Helper to group showtimes (moved out for reuse)
  const groupShowtimesByDate = (data, availabilityMap) => {
    const groupedByDate = {};
    data.forEach(st => {
      const date = st.show_date;
      const room = st.cinema_room || 'Phòng chiếu';
      const availableSeats = availabilityMap[st.id] || 0;
      if (!groupedByDate[date]) groupedByDate[date] = { date, rooms: {} };
      if (!groupedByDate[date].rooms[room]) groupedByDate[date].rooms[room] = { name: room, slots: [] };
      groupedByDate[date].rooms[room].slots.push({ ...st, availableSeats });
    });
    return Object.values(groupedByDate).map(day => ({ ...day, rooms: Object.values(day.rooms) }));
  };

  // Listen for AI-triggered movie info requests
  useEffect(() => {
    const handleOpenMovieInfo = (e) => {
      const { movieId } = e.detail;
      if (movieId && allMovies.length > 0) {
        const movie = allMovies.find(m => m.id === movieId);
        if (movie) {
          setSidebarMovie(movie);
          setIsInfoSidebarOpen(true);
        }
      }
    };

    const handleOpenShowtimeBooking = async (e) => {
      const { showtimeId, movieId } = e.detail;
      const movie = allMovies.find(m => m.id === movieId);
      if (movie) {
        setSelectedMovie(movie);
        setIsInfoSidebarOpen(false);
        setLoading(true);
        try {
          const { data: stData } = await showtimeAPI.getMovieShowtimes(movie.id);
          if (stData) {
            const availabilityMap = await showtimeAPI.getBulkShowtimeAvailability(stData.map(s => s.id));
            setShowtimes(groupShowtimesByDate(stData, availabilityMap));
            
            const targetSt = stData.find(s => s.id === showtimeId);
            if (targetSt) {
              setSelectedShowtime({ ...targetSt, availableSeats: availabilityMap[targetSt.id] || 0 });
              setBookingStep('seats');
              dispatch({ type: 'SET_BOOKING_PROGRESS', inProgress: true });
            }
          }
        } catch (err) { console.error(err); }
        finally { setLoading(false); }
      }
    };

    window.addEventListener('openMovieInfo', handleOpenMovieInfo);
    window.addEventListener('openShowtimeBooking', handleOpenShowtimeBooking);
    return () => {
      window.removeEventListener('openMovieInfo', handleOpenMovieInfo);
      window.removeEventListener('openShowtimeBooking', handleOpenShowtimeBooking);
    };
  }, [allMovies, dispatch]);

  useEffect(() => {
    checkScroll();
    window.addEventListener('resize', checkScroll);
    return () => window.removeEventListener('resize', checkScroll);
  }, [displayMovies, bookingStep]);

  useEffect(() => {
    if (selectedMovie) document.body.classList.add('booking-flow-active');
    else document.body.classList.remove('booking-flow-active');
  }, [selectedMovie]);

  const handleChipClick = (chip) => {
    setActiveChip(chip.id);
    const filtered = getRecommendedMovies(allMovies, chip.id, chip.value, aiContext);
    setDisplayMovies(filtered);
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ left: 0, behavior: 'smooth' });
    }
  };

  const scroll = (direction) => {
    if (scrollRef.current) {
      const { scrollLeft, clientWidth } = scrollRef.current;
      const scrollTo = direction === 'left' ? scrollLeft - clientWidth * 0.8 : scrollLeft + clientWidth * 0.8;
      scrollRef.current.scrollTo({ left: scrollTo, behavior: 'smooth' });
      setTimeout(checkScroll, 400);
    }
  };

  const loadMovieShowtimes = async (movieId) => {
    try {
      const { data } = await showtimeAPI.getMovieShowtimes(movieId);
      if (data && data.length > 0) {
        // Fetch seat availability for all these showtimes
        const sids = data.map(st => st.id);
        const availabilityMap = await showtimeAPI.getBulkShowtimeAvailability(sids);

        // Grouping logic: Date -> Room -> Showtimes
        const groupedByDate = {};
        
        data.forEach(st => {
          const date = st.show_date;
          const room = st.cinema_room || 'Phòng chiếu';
          const availableSeats = availabilityMap[st.id] || 0;
          
          if (!groupedByDate[date]) {
            groupedByDate[date] = { date, rooms: {} };
          }
          
          if (!groupedByDate[date].rooms[room]) {
            groupedByDate[date].rooms[room] = { name: room, slots: [] };
          }
          
          groupedByDate[date].rooms[room].slots.push({
            ...st,
            availableSeats
          });
        });

        // Convert to array for easier mapping
        const finalGrouped = Object.values(groupedByDate).map(day => ({
          ...day,
          rooms: Object.values(day.rooms)
        }));

        setShowtimes(finalGrouped);
      }
    } catch (err) { console.error(err); }
  };

  const handleMovieSelect = (movie) => {
    setSidebarMovie(movie);
    setIsInfoSidebarOpen(true);
  };

  const handleProceedFromSidebar = (movieId) => {
    // AUTH CHECK: Must be logged in to proceed to showtimes/seats
    if (!user) {
      navigate('/login', { state: { from: `/booking?movie=${movieId}` } });
      return;
    }

    // Find the movie from our list if needed
    const movie = allMovies.find(m => m.id === movieId) || sidebarMovie;
    if (!movie) return;
    
    setSelectedMovie(movie);
    loadMovieShowtimes(movie.id);
    setBookingStep('showtime');
    setIsInfoSidebarOpen(false);
    dispatch({ type: 'SET_BOOKING_PROGRESS', inProgress: true });
  };

  const handleShowtimeSelect = (st) => {
    setSelectedShowtime(st);
    setBookingStep('seats');
  };

  const handleProceedToPayment = async () => {
    if (!user) { navigate('/login'); return; }
    try {
      dispatch({ type: "SET_SUBMITTING", isSubmitting: true });
      const bookingData = {
        user_id: user?.id,
        showtime_id: selectedShowtime?.id,
        customer_name: userProfile?.name || user?.email,
        customer_email: user?.email,
        customer_phone: userProfile?.phone,
        seats: gheDangChon,
        total_amount: parseInt(tongTien) || 0,
        status: 'pending',
        showtime_info: JSON.stringify({
          date: selectedShowtime?.show_date,
          time: selectedShowtime?.show_time,
          movie_title: selectedMovie?.title,
          cinema_room: selectedShowtime?.cinema_room,
          seats: gheDangChon
        })
      };
      const { data, error } = await bookingAPI.createBooking(bookingData);
      if (error) throw error;
      setBookingId(data.id);
      dispatch({ type: 'SET_BOOKING_PROGRESS', inProgress: true, bookingId: data.id });
      setBookingStep('payment');
    } catch (error) {
      alert('Lỗi khởi tạo đơn hàng: ' + error.message);
    } finally {
      dispatch({ type: "SET_SUBMITTING", isSubmitting: false });
    }
  };

  const handleVnpayRedirect = async () => {
    try {
      const url = await createVnpayUrl({
        orderId: bookingId, amount: tongTien,
        orderInfo: `Thanh toan ve phim ${selectedMovie.title}`,
        ipAddr: '127.0.0.1'
      });
      window.location.href = url;
    } catch (err) { alert('Lỗi tạo liên kết thanh toán: ' + err.message); }
  };

  const handleExpire = () => setIsExpired(true);

  const handleRetryAfterExpire = async () => {
    if (bookingId) await bookingAPI.deleteBooking(bookingId);
    setBookingStep('seats');
    setBookingId(null);
    setIsExpired(false);
    dispatch({ type: 'SET_BOOKING_PROGRESS', inProgress: true, bookingId: null });
  };

  const handleBackStep = () => {
    if (bookingStep === 'payment') {
      setBookingStep('seats');
    } else if (bookingStep === 'seats') {
      dispatch({ type: "RESET_SEATS" });
      setBookingStep('showtime');
    } else if (bookingStep === 'showtime') {
      setSelectedShowtime(null);
      setBookingStep('movie');
      setSelectedMovie(null);
      dispatch({ type: 'SET_BOOKING_PROGRESS', inProgress: false });
    }
  };

  const handleCloseProcess = () => {
    setShowCloseConfirm(true);
  };

  const performCloseProcess = async () => {
    // If there's a pending booking in DB, try to clean it up (optional but good)
    if (bookingId) {
      await bookingAPI.deleteBooking(bookingId);
    }
    
    dispatch({ type: "RESET_SEATS" });
    dispatch({ type: 'SET_BOOKING_PROGRESS', inProgress: false, bookingId: null });
    setBookingStep('movie');
    setSelectedMovie(null);
    setSelectedShowtime(null);
    setBookingSuccess(false);
    setBookingId(null);
    setIsExpired(false);
    setShowCloseConfirm(false);
    document.body.classList.remove('booking-flow-active');
  };

  const renderProgress = () => {
    const steps = ['movie', 'showtime', 'seats', 'payment'];
    const currentIdx = steps.indexOf(bookingStep);
    return (
      <div className="drawer-header-content">
        <button className="drawer-back-btn" onClick={handleBackStep} title="Quay lại">
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
        
        <div className="booking-progress-bar">
          {steps.map((step, idx) => (
            <React.Fragment key={step}>
              <div className={`progress-step ${idx <= currentIdx ? 'active' : ''} ${idx === currentIdx ? 'current' : ''}`}>{idx + 1}</div>
              {idx < steps.length - 1 && <div className={`progress-line ${idx < currentIdx ? 'active' : ''}`}></div>}
            </React.Fragment>
          ))}
        </div>

        <button className="drawer-close-btn desktop-only-drawer" onClick={handleCloseProcess} title="Đóng">
          <span className="material-symbols-outlined">close</span>
        </button>
      </div>
    );
  };

  const showDrawerOnMobile = selectedMovie && bookingStep !== 'movie';

  return (
    <div className={`booking-page-layout ${selectedMovie ? 'full-screen-flow' : ''} step-${bookingStep}`}>
      <div className="booking-main-content">
        {bookingStep === 'movie' && (
          <div className="selection-centered-content">
            <div className="ai-recommendation-chips">
              {aiChips.length > 0 ? aiChips.map(chip => (
                <div key={chip.id} className={`ai-chip ${activeChip === chip.id ? 'active' : ''}`} onClick={() => handleChipClick(chip)}>{chip.label}</div>
              )) : (
                <><div className="ai-chip active">🎬 Tất cả</div><div className="ai-chip">🔥 Xu hướng</div></>
              )}
            </div>
            <div className="carousel-wrapper">
              <button className="nav-btn prev" onClick={() => scroll('left')} disabled={!canScrollLeft}>
                <span className="material-symbols-outlined">chevron_left</span>
              </button>
              <div className="movies-grid" ref={scrollRef} onScroll={checkScroll}>
                {loading ? (
                  Array.from({ length: 5 }).map((_, idx) => (
                    <MovieCardSkeleton key={`skeleton-${idx}`} />
                  ))
                ) : (displayMovies || []).map(movie => {
                  if (!movie) return null;
                  const movieShowtimes = aiContext?.allShowtimes?.filter(st => st.movie_id === movie.id) || [];
                  const matchCount = aiContext ? getSmartShowtimeCount(movieShowtimes, aiContext) : 0;
                  return (
                    <MovieCard key={movie.id} movie={movie} showReleaseDate={false} onShowInfo={handleMovieSelect} smartInfo={matchCount > 0 ? matchCount : null} />
                  );
                })}
              </div>
              <button className="nav-btn next" onClick={() => scroll('right')} disabled={!canScrollRight}>
                <span className="material-symbols-outlined">chevron_right</span>
              </button>
            </div>
          </div>
        )}
        {bookingStep === 'showtime' && (
          <div className="selection-centered-content">
            <div className="showtime-selection-wrapper">
              {aiContext?.preferences?.favoriteHours?.length > 0 && (
                <div className="smart-legend">
                  <span className="material-symbols-outlined">robot_2</span>
                  Màu tím: suất phù hợp với <strong>{userProfile?.name?.split(' ').pop() || 'bạn'}</strong>
                </div>
              )}
              
              <div className="showtime-scroll-container">
                {showtimes.map(day => (
                  <div key={day.date} className="date-group-section">
                    <div className="date-header-sticky">
                      <span className="material-symbols-outlined">calendar_today</span>
                      {new Date(day.date).toLocaleDateString('vi-VN', { weekday: 'long', day: 'numeric', month: 'numeric' })}
                    </div>
                    
                    <div className="rooms-grid-container">
                      {day.rooms.map(room => (
                        <div key={room.name} className="room-showtime-card">
                          <div className="room-title-mini">
                            <span className="material-symbols-outlined">meeting_room</span>
                            {room.name}
                          </div>
                          <div className="time-slots-compact">
                            {room.slots.map(st => {
                              const hour = parseInt(st.show_time.split(':')[0]);
                              const isSmartMatch = aiContext?.preferences?.favoriteHours?.some(fh => Math.abs(fh - hour) <= 1);
                              return (
                                <button 
                                  key={st.id} 
                                  className={`time-slot-btn ${selectedShowtime?.id === st.id ? 'active' : ''} ${isSmartMatch ? 'smart-match' : ''}`} 
                                  onClick={() => handleShowtimeSelect(st)}
                                >
                                  <span className="slot-time">{st.show_time.substring(0, 5)}</span>
                                  <span className="slot-availability">{st.availableSeats} ghế trống</span>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
        {bookingStep === 'seats' && (
          <div className="selection-centered-content full-width-selection">
            <DatVe movieInfo={selectedMovie} showtime={selectedShowtime} onBack={() => setBookingStep('showtime')} compactMode={true} />
          </div>
        )}
        {bookingStep === 'payment' && (
          <div className="selection-centered-content">
            <div className="payment-pending-view">
              <span className="material-symbols-outlined pending-icon animate-spin">sync</span>
              <h2>Đang chờ thanh toán...</h2>
              <p>Vui lòng hoàn tất thanh toán để nhận vé.</p>
            </div>
          </div>
        )}
      </div>

      <div className={`booking-process-drawer ${selectedMovie ? 'open' : ''} ${!showDrawerOnMobile ? 'mobile-hidden' : ''}`}>
        {/* Only render header on Desktop - Close button is now inside renderProgress for desktop */}
        <div className="drawer-header desktop-only-drawer">{renderProgress()}</div>
        
        {/* DESKTOP CONTENT */}
        <div className="drawer-body desktop-only-drawer">
          <div className="drawer-movie-info">
            <h2 className="drawer-title">{selectedMovie?.title || 'Đang chọn phim...'}</h2>
            <div className="drawer-user-info"><span className="label">Người đặt:</span><span className="value">{userProfile?.name || user?.email || 'Khách'}</span></div>
          </div>
          <div className="drawer-divider"></div>
          <div className="drawer-showtime-info">
            <div className="info-row"><span className="label">Ngày:</span><span className="value">{selectedShowtime ? new Date(selectedShowtime.show_date).toLocaleDateString('vi-VN') : '---'}</span></div>
            <div className="info-row"><span className="label">Giờ:</span><span className="value">{selectedShowtime?.show_time || '---'}</span></div>
            <div className="info-row"><span className="label">Phòng:</span><span className="value">{selectedShowtime?.cinema_room || '---'}</span></div>
          </div>
          <div className="drawer-divider"></div>
          <div className="drawer-seats-info"><span className="label">Ghế đang chọn:</span><div className="selected-seats-list">{gheDangChon.length > 0 ? gheDangChon.map(g => g.soGhe).join(', ') : 'Chưa chọn'}</div></div>
          
          <div className="drawer-bill-section">
            <div className="total-row"><span>Tổng thanh toán:</span><span className="total-amount">{tongTien.toLocaleString()} đ</span></div>
            {bookingStep === 'seats' && <button className="m3-btn m3-btn-filled confirm-booking-btn" disabled={gheDangChon.length === 0 || isSubmitting} onClick={handleProceedToPayment}>Tiến hành Thanh toán</button>}
            {bookingStep === 'payment' && (
              <div className="payment-drawer-content">
                {!isExpired ? (
                  <><CountdownTimer minutes={15} onExpire={handleExpire} /><p className="payment-hint">Vui lòng thanh toán để giữ chỗ.</p><button className="m3-btn m3-btn-filled vnpay-btn" onClick={handleVnpayRedirect}><img src={`${process.env.PUBLIC_URL}/img/vnpay.webp`} alt="VNPAY" height="24" />Thanh toán qua VNPAY</button></>
                ) : (
                  <div className="expiration-notice"><span className="material-symbols-outlined expire-icon">history_toggle_off</span><h3>Hết thời gian giữ chỗ</h3><p className="expire-text">Đơn hàng của bạn đã hết hạn thanh toán (15 phút).</p><button className="m3-btn m3-btn-filled retry-btn" onClick={handleRetryAfterExpire}>Thử đặt lại từ đầu</button></div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* MOBILE COMPACT CONTENT (REFINED) */}
        <div className="drawer-body mobile-only-drawer">
          <div className="mobile-header-row">
            <button className="mobile-drawer-back-btn" onClick={handleBackStep}>
              <span className="material-symbols-outlined">arrow_back</span>
            </button>
            <strong className="mobile-title">{selectedMovie?.title}</strong>
            <button className="mobile-close-btn" onClick={handleCloseProcess}>
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>

          <div className="mobile-drawer-divider"></div>

          <div className="mobile-meta-info">
            {selectedShowtime && (
              <>
                <span>{new Date(selectedShowtime.show_date).toLocaleDateString('vi-VN', {day:'numeric', month:'numeric'})}</span>
                <span className="dot-separator">•</span>
                <span>{selectedShowtime.show_time?.substring(0,5)}</span>
                <span className="dot-separator">•</span>
                <span>P{selectedShowtime.cinema_room}</span>
              </>
            )}
          </div>

          <div className="mobile-row-2">
            <div className="mobile-seats">{gheDangChon.length > 0 ? gheDangChon.map(g => g.soGhe).join(', ') : ''}</div>
          </div>
          <div className="mobile-actions">
            {bookingStep === 'seats' && gheDangChon.length > 0 && (
              <button className="m3-btn m3-btn-filled confirm-booking-btn" disabled={isSubmitting} onClick={handleProceedToPayment}>
                Thanh toán {tongTien.toLocaleString()} đ
              </button>
            )}
            {bookingStep === 'payment' && !isExpired && (
              <button className="m3-btn m3-btn-filled vnpay-btn-mini" onClick={handleVnpayRedirect}>
                <img src={`${process.env.PUBLIC_URL}/img/vnpay.webp`} alt="VNPAY" height="18" style={{ marginRight: '8px' }} />
                VNPAY {tongTien.toLocaleString()} đ
              </button>
            )}
            {isExpired && <button className="m3-btn m3-btn-text" onClick={handleRetryAfterExpire}>Thử lại</button>}
          </div>
        </div>
      </div>

      <MovieInfoSidebar 
        movie={sidebarMovie}
        isOpen={isInfoSidebarOpen}
        onClose={() => setIsInfoSidebarOpen(false)}
        onBookTicket={handleProceedFromSidebar}
      />

      <ConfirmModal 
        isOpen={showCloseConfirm}
        title="Thoát đặt vé?"
        message="Hành động này sẽ hủy bỏ các lựa chọn hiện tại của bạn. Bạn có chắc chắn muốn quay lại màn hình chọn phim không?"
        onConfirm={performCloseProcess}
        onCancel={() => setShowCloseConfirm(false)}
      />
    </div>
  );
};

const mapStateToProps = (state) => ({
  gheDangChon: state.datVeReducer.gheDangChon,
  tongTien: state.datVeReducer.tongTien,
  isSubmitting: state.datVeReducer.isSubmitting
});

export default connect(mapStateToProps)(BookingPage);
