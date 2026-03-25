import React, { useState, useEffect, useCallback } from 'react';
import { movieAPI, showtimeManagementAPI, showtimeAPI, roomAPI, logAPI } from '../../services/api';
import { tmdbService } from '../../services/tmdb';
import GenericSkeleton from '../GenericSkeleton';
import ConfirmModal from '../ConfirmModal';
import '../../styles/admin/MovieManagement.css';

// --- SUB-COMPONENT: Movie Form (Slide Drawer Style Content) ---
const MovieForm = ({ movie, onSave, onCancel, submitting, onDeleteSchedule, onRegenerateSchedule, scheduleCount }) => {
  const [formData, setFormData] = useState({
    title: '', genre: '', duration: '', rating: '', status: 'showing',
    release_date: '', poster: '', description: '',
    actors: '', trailer_url: '', age: 'P',
    is_hot: false, is_imax: false, is_4dx: false
  });
  const [isFetchingTMDB, setIsFetchingTMDB] = useState(false);
  const [rooms, setRooms] = useState([]);

  useEffect(() => {
    const fetchRooms = async () => {
      const { data } = await roomAPI.getRooms();
      setRooms(data || []);
    };
    fetchRooms();
  }, []);

  useEffect(() => {
    if (movie) {
      setFormData({
        title: movie.title || '',
        genre: movie.genre || '',
        duration: movie.duration?.toString() || '',
        rating: movie.rating?.toString() || '',
        status: movie.status || 'showing',
        release_date: movie.release_date || '',
        poster: movie.poster || '',
        description: movie.description || '',
        actors: movie.actors || '',
        trailer_url: movie.trailer_url || '',
        age: movie.age || 'P',
        is_hot: !!movie.is_hot,
        is_imax: !!movie.is_imax,
        is_4dx: !!movie.is_4dx
      });
    } else {
      // RESET FORM FOR ADD NEW
      setFormData({
        title: '', genre: '', duration: '', rating: '', status: 'showing',
        release_date: '', poster: '', description: '',
        actors: '', trailer_url: '', age: 'P',
        is_hot: false, is_imax: false, is_4dx: false
      });
    }
  }, [movie]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({ 
      ...prev, 
      [name]: type === 'checkbox' ? checked : value 
    }));
  };

  const fetchFromTMDB = async () => {
    if (!formData.title.trim()) {
      alert('Vui lòng nhập tên phim trước!');
      return;
    }

    try {
      setIsFetchingTMDB(true);
      const searchResult = await tmdbService.searchMovie(formData.title);
      
      if (!searchResult) {
        alert('Không tìm thấy phim này trên TMDB.');
        return;
      }

      const details = await tmdbService.getFullMovieDetails(searchResult.id);
      if (details) {
        setFormData(prev => ({
          ...prev,
          ...details,
          // Keep the local status and room settings
          status: prev.status,
          is_hot: prev.is_hot,
          is_imax: prev.is_imax,
          is_4dx: prev.is_4dx
        }));
      }
    } catch (err) {
      console.error(err);
      alert('Lỗi khi lấy thông tin từ TMDB.');
    } finally {
      setIsFetchingTMDB(false);
    }
  };

  return (
    <div className="movie-edit-drawer-content">
      <form onSubmit={(e) => { e.preventDefault(); onSave(formData); }} className="movie-form-vertical">
        <div className="m3-textfield" style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <input type="text" name="title" value={formData.title} onChange={handleInputChange} required placeholder="Tên phim *" style={{ flex: 1 }} />
          <button 
            type="button" 
            className="m3-btn m3-btn-tonal m3-btn-sm" 
            onClick={fetchFromTMDB}
            disabled={isFetchingTMDB}
            title="Lấy thông tin tự động từ TMDB"
            style={{ height: '48px', padding: '0 16px', borderRadius: '12px' }}
          >
            {isFetchingTMDB ? <span className="loading-spinner-sm" style={{ margin: 0 }}></span> : <span className="material-symbols-outlined">auto_fix</span>}
            <span style={{ fontSize: '12px' }}>Auto-fill</span>
          </button>
        </div>
        
        <div className="m3-textfield">
          <input type="date" name="release_date" value={formData.release_date} onChange={handleInputChange} placeholder="Ngày khởi chiếu" />
        </div>

        <div className="m3-textfield">
          <select name="status" value={formData.status} onChange={handleInputChange}>
            <option value="showing">Đang chiếu</option>
            <option value="coming">Sắp chiếu</option>
            <option value="ended">Ngừng chiếu</option>
          </select>
        </div>

        <div className="form-section-label">Đặc tính phim</div>
        <div className="movie-attributes-grid">
          <label className="attribute-checkbox-wrapper">
            <input type="checkbox" name="is_hot" checked={formData.is_hot} onChange={handleInputChange} />
            <div className="checkbox-content">
              <span className="material-symbols-outlined">local_fire_department</span>
              <span>Phim HOT</span>
            </div>
          </label>
          <label className="attribute-checkbox-wrapper">
            <input type="checkbox" name="is_imax" checked={formData.is_imax} onChange={handleInputChange} />
            <div className="checkbox-content">
              <span className="material-symbols-outlined">aspect_ratio</span>
              <span>IMAX</span>
            </div>
          </label>
          <label className="attribute-checkbox-wrapper">
            <input type="checkbox" name="is_4dx" checked={formData.is_4dx} onChange={handleInputChange} />
            <div className="checkbox-content">
              <span className="material-symbols-outlined">waves</span>
              <span>4DX</span>
            </div>
          </label>
        </div>

        <div className="form-row-2col">
          <div className="m3-textfield">
            <input type="number" name="duration" value={formData.duration} onChange={handleInputChange} placeholder="Thời lượng (phút)" />
          </div>
          <div className="m3-textfield">
            <input type="number" step="1" max="100" min="0" name="rating" value={formData.rating} onChange={handleInputChange} placeholder="Điểm số (0-100%)" />
          </div>
        </div>

        <div className="form-row-2col">
          <div className="m3-textfield">
            <input type="text" name="age" value={formData.age} onChange={handleInputChange} placeholder="Xếp loại (P, PG-13, R...)" />
          </div>
          <div className="m3-textfield">
            <input type="text" name="genre" value={formData.genre} onChange={handleInputChange} placeholder="Thể loại" />
          </div>
        </div>

        <div className="m3-textfield">
          <input type="url" name="poster" value={formData.poster} onChange={handleInputChange} placeholder="URL Poster" />
        </div>

        <div className="m3-textfield">
          <input type="url" name="trailer_url" value={formData.trailer_url} onChange={handleInputChange} placeholder="URL Trailer (YouTube)" />
        </div>

        <div className="m3-textfield full-width">
          <input type="text" name="actors" value={formData.actors} onChange={handleInputChange} placeholder="Diễn viên (cách nhau bởi dấu phẩy)" />
        </div>
        
        <div className="m3-textfield full-width">
          <textarea name="description" value={formData.description} onChange={handleInputChange} rows="3" placeholder="Mô tả phim"></textarea>
        </div>

        <div className="drawer-actions-row">
          <button type="button" className="m3-btn m3-btn-text" onClick={onCancel}>Hủy</button>
          <button type="submit" className="m3-btn m3-btn-filled" disabled={submitting}>
            {submitting ? <span className="loading-spinner-sm"></span> : 'Lưu thông tin'}
          </button>
        </div>
      </form>

      {movie && movie.status === 'showing' && (
        <div className="schedule-management-box">
          <h4>Quản lý lịch chiếu</h4>
          <p className="schedule-status-info">Hiện có: <strong>{scheduleCount}</strong> suất chiếu</p>
          <div className="schedule-btns-group">
            <button className="m3-btn m3-btn-tonal" onClick={() => onRegenerateSchedule(movie.id)}>
              <span className="material-symbols-outlined">sync</span> Tạo lại lịch chiếu
            </button>
            {scheduleCount > 0 && (
              <button className="m3-btn m3-btn-text" style={{ color: '#ff4444' }} onClick={() => onDeleteSchedule(movie.id)}>
                <span className="material-symbols-outlined">delete</span> Xóa lịch chiếu
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// --- MAIN COMPONENT ---
const MovieManagement = () => {
  const [movies, setMovies] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('showing'); // showing, coming, ended
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editingMovie, setEditingMovie] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [movieScheduleStatus, setMovieScheduleStatus] = useState({});
  const [movieRooms, setMovieRooms] = useState({});
  
  // Confirm Modal state
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, title: '', message: '', action: null });

  const loadMovies = useCallback(async () => {
    setLoading(true);
    const [{ data: movieData }, { data: roomData }] = await Promise.all([
      movieAPI.getMovies(),
      roomAPI.getRooms()
    ]);
    
    const movieItems = movieData || [];
    setMovies(movieItems);
    setRooms(roomData || []);
    
    // Check schedules and rooms
    const statusMap = {};
    const roomsMap = {};
    for (const movie of movieItems) {
      if (movie.status === 'showing') {
        const { data: sts } = await showtimeAPI.getMovieShowtimes(movie.id);
        const showtimes = sts || [];
        statusMap[movie.id] = showtimes.length;
        
        // Extract unique room names
        const uniqueRooms = [...new Set(showtimes.map(s => s.cinema_room))].filter(Boolean);
        roomsMap[movie.id] = uniqueRooms;
      }
    }
    setMovieScheduleStatus(statusMap);
    setMovieRooms(roomsMap);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadMovies();
    const handleGlobalAdd = () => {
      setEditingMovie(null);
      setIsDrawerOpen(true);
    };
    window.addEventListener('admin-action-add', handleGlobalAdd);
    return () => window.removeEventListener('admin-action-add', handleGlobalAdd);
  }, [loadMovies]);

  const handleOpenEdit = (movie) => {
    setEditingMovie(movie);
    setIsDrawerOpen(true);
  };

  const handleSaveMovie = async (formData) => {
    // 1. CAPACITY CHECK
    if (formData.status === 'showing') {
      const isIMAX = formData.is_imax;
      const is4DX = formData.is_4dx;
      const isRegular = !isIMAX && !is4DX;

      const roomCount = rooms.filter(r => {
        if (isIMAX) return r.type === 'IMAX';
        if (is4DX) return r.type === '4DX';
        return r.type === '2D/3D';
      }).length;

      const currentlyShowing = movies.filter(m => {
        // Don't count the movie we are currently editing if it's already showing
        if (editingMovie && m.id === editingMovie.id) return false;
        if (m.status !== 'showing') return false;
        
        if (isIMAX) return m.is_imax;
        if (is4DX) return m.is_4dx;
        return !m.is_imax && !m.is_4dx;
      }).length;

      if (currentlyShowing >= roomCount) {
        const typeLabel = isIMAX ? 'IMAX' : (is4DX ? '4DX' : '2D/3D');
        askConfirm(
          'Giới hạn phòng chiếu',
          `Rạp hiện chỉ có ${roomCount} phòng ${typeLabel}, và tất cả đều đã được gán phim "Đang chiếu". Vui lòng gỡ bớt 1 phim ${typeLabel} khác hoặc thêm phòng mới trước khi tiếp tục.`,
          () => setConfirmModal({ ...confirmModal, isOpen: false })
        );
        return;
      }
    }

    setSubmitting(true);
    const cleaned = { ...formData, duration: parseInt(formData.duration) || null, rating: parseInt(formData.rating) || null };
    const result = editingMovie ? await movieAPI.updateMovie(editingMovie.id, cleaned) : await movieAPI.createMovie(cleaned);
    
    if (!result.error) {
      // Log Action
      const isNewMovie = !editingMovie;
      const movieTitle = formData.title;
      const newMovieData = result.data?.[0] || result.data;

      await logAPI.logAdminAction(
        isNewMovie ? 'Thêm phim mới' : 'Cập nhật phim',
        movieTitle,
        'movie'
      );
      
      setIsDrawerOpen(false);
      await loadMovies();
    } else {
      alert('Lỗi: ' + result.error.message);
    }
    setSubmitting(false);
  };

  const askConfirm = (title, message, action) => {
    setConfirmModal({ isOpen: true, title, message, action });
  };

  const executeEndMovie = async (id) => {
    const movie = movies.find(m => m.id === id);
    const { error } = await movieAPI.updateMovie(id, { status: 'ended' });
    if (error) {
      alert('Lỗi: ' + error.message);
    } else {
      await logAPI.logAdminAction('Ngừng chiếu phim', movie?.title || 'Unknown', 'movie');
      loadMovies();
    }
    setConfirmModal({ ...confirmModal, isOpen: false });
  };

  const executeClearSchedule = async (id) => {
    const movie = movies.find(m => m.id === id);
    await showtimeManagementAPI.clearMovieSchedule(id);
    await logAPI.logAdminAction('Xóa lịch chiếu', movie?.title || 'Unknown', 'movie');
    loadMovies();
    setConfirmModal({ ...confirmModal, isOpen: false });
  };

  const executeRegenerateSchedule = async (id) => {
    const movie = movies.find(m => m.id === id);
    await showtimeManagementAPI.setupMovieSchedule(id, { force: true });
    await logAPI.logAdminAction('Tạo lại lịch chiếu', movie?.title || 'Unknown', 'movie');
    loadMovies();
    setConfirmModal({ ...confirmModal, isOpen: false });
  };

  const executeWeeklySchedule = async () => {
    try {
      setSubmitting(true);
      const result = await showtimeManagementAPI.generateWeeklySchedule();
      await logAPI.logAdminAction('Tạo chương trình tuần', `Đã tạo ${result.count} suất chiếu mới cho toàn rạp`, 'system');
      alert(`Thành công! Đã tạo ${result.count} suất chiếu và sơ đồ ghế cho toàn bộ phòng chiếu.`);
      loadMovies();
    } catch (err) {
      alert('Lỗi lập lịch: ' + err.message);
    } finally {
      setSubmitting(false);
      setConfirmModal({ ...confirmModal, isOpen: false });
    }
  };

  const filteredMovies = movies.filter(m => m.status === activeFilter);

  if (loading) {
    return <div className="movie-management-container"><div className="movies-cards-grid">{[1,2,3].map(i => <GenericSkeleton key={i} width="300px" height="450px" borderRadius="20px" />)}</div></div>;
  }

  return (
    <div className="movie-management-container">
      {/* FILTER TABS & WEEKLY ACTION */}
      <div className="management-tab-header">
        <div className="movie-filter-tabs">
          <button className={`tab-btn ${activeFilter === 'showing' ? 'active' : ''}`} onClick={() => setActiveFilter('showing')}>Đang chiếu</button>
          <button className={`tab-btn ${activeFilter === 'coming' ? 'active' : ''}`} onClick={() => setActiveFilter('coming')}>Sắp chiếu</button>
          <button className={`tab-btn ${activeFilter === 'ended' ? 'active' : ''}`} onClick={() => setActiveFilter('ended')}>Ngừng chiếu</button>
        </div>

        {activeFilter === 'showing' && (
          <button 
            className="m3-btn m3-btn-filled weekly-btn" 
            disabled={submitting}
            onClick={() => askConfirm(
              'Tạo chương trình tuần?', 
              'Hệ thống sẽ dọn sạch lịch cũ và tự động phân bổ 35 suất chiếu/phòng cho tất cả các phòng chiếu dựa trên Line-up hiện tại. Quá trình này mất vài giây.',
              executeWeeklySchedule
            )}
          >
            <span className="material-symbols-outlined">event_repeat</span>
            {submitting ? 'Đang xử lý...' : 'Tạo chương trình tuần'}
          </button>
        )}
      </div>

      <div className="movies-cards-grid">
        {filteredMovies.map(movie => (
          <div key={movie.id} className="admin-movie-card m3-card">
            <div className="card-poster-area">
              <img src={movie.poster} alt={movie.title} />
              <div className="card-badges-container">
                {movie.is_hot && (
                  <div className="card-badge hot-badge">
                    <span className="material-symbols-outlined">local_fire_department</span>
                    HOT
                  </div>
                )}
                <div className={`card-badge ${(!movieRooms[movie.id] || movieRooms[movie.id].length === 0) && movie.status === 'showing' ? 'warning-badge' : ''}`}>
                  {!movieRooms[movie.id] || movieRooms[movie.id].length === 0 
                    ? (movie.status === 'showing' ? 'Chưa gán phòng' : '---')
                    : movieRooms[movie.id].join(', ')
                  }
                </div>
              </div>
            </div>
            <div className="card-info-area">
              <h4 className="movie-title">{movie.title}</h4>
              <p className="movie-meta">{movie.genre} • {movie.duration}ph</p>
              <div className="card-actions">
                <button className="m3-btn m3-btn-filled m3-btn-sm" onClick={() => handleOpenEdit(movie)}>
                  <span className="material-symbols-outlined">edit</span> Sửa
                </button>
                {movie.status !== 'ended' && (
                  <button className="m3-btn m3-btn-outlined m3-btn-sm danger-btn" onClick={() => askConfirm('Ngừng chiếu phim?', `Bạn có chắc muốn ngừng chiếu "${movie.title}"? Phim sẽ được chuyển sang danh mục Ngừng chiếu để lưu trữ dữ liệu.`, () => executeEndMovie(movie.id))}>
                    <span className="material-symbols-outlined">block</span> Ngừng chiếu
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* EDIT DRAWER */}
      <div className={`admin-drawer ${isDrawerOpen ? 'open' : ''}`}>
        <div className="drawer-header-main">
          <h3>{editingMovie ? 'Thông tin phim' : 'Thêm phim mới'}</h3>
          <button onClick={() => setIsDrawerOpen(false)} className="close-btn"><span className="material-symbols-outlined">close</span></button>
        </div>
        <div className="drawer-body-main">
          <MovieForm 
            movie={editingMovie} 
            onSave={handleSaveMovie} 
            onCancel={() => setIsDrawerOpen(false)} 
            submitting={submitting}
            scheduleCount={movieScheduleStatus[editingMovie?.id] || 0}
            onDeleteSchedule={(id) => askConfirm('Xóa lịch chiếu?', 'Mọi suất chiếu và đơn đặt vé của phim này sẽ bị xóa sạch.', () => executeClearSchedule(id))}
            onRegenerateSchedule={(id) => askConfirm('Tạo lại lịch?', 'Lịch cũ sẽ bị xóa và thay thế bằng 35 suất chiếu mới.', () => executeRegenerateSchedule(id))}
          />
        </div>
      </div>
      {isDrawerOpen && <div className="drawer-overlay-admin" onClick={() => setIsDrawerOpen(false)} />}

      <ConfirmModal 
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        message={confirmModal.message}
        onConfirm={confirmModal.action}
        onCancel={() => setConfirmModal({ ...confirmModal, isOpen: false })}
      />
    </div>
  );
};

export default MovieManagement;
