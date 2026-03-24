import React, { useState, useEffect } from 'react';
import { roomAPI, logAPI } from '../../services/api';
import GenericSkeleton from '../GenericSkeleton';
import '../../styles/admin/SeatingPricingManagement.css'; 

const CinemaRoomManagement = () => {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editingRoomId, setEditingRoomId] = useState(null);
  const [editName, setEditingName] = useState('');

  const loadRooms = async () => {
    try {
      setLoading(true);
      const { data, error } = await roomAPI.getRooms();
      if (error) throw error;
      setRooms(data || []);
    } catch (err) {
      setError('Lỗi khi tải danh sách phòng');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRooms();
    
    const handleGlobalAdd = () => {
      const type = window.prompt('Nhập loại phòng (2D/3D, IMAX, 4DX):', '2D/3D');
      if (type) handleAddRoom(type);
    };
    window.addEventListener('admin-action-add', handleGlobalAdd);
    return () => window.removeEventListener('admin-action-add', handleGlobalAdd);
  }, []);

  const handleAddRoom = async (type) => {
    const name = window.prompt(`Nhập tên phòng ${type} mới:`);
    if (!name) return;

    let multiplier = 1.0;
    if (type === 'IMAX') multiplier = 1.5;
    if (type === '4DX') multiplier = 2.0;

    const { error } = await roomAPI.createRoom({ name, type, multiplier });
    if (error) alert('Lỗi: ' + error.message);
    else {
      await logAPI.logAdminAction('Thêm phòng chiếu', `${name} (${type})`, 'room');
      loadRooms();
    }
  };

  const handleStartEdit = (room) => {
    setEditingRoomId(room.id);
    setEditingName(room.name);
  };

  const handleSaveEdit = async (room) => {
    const { error } = await roomAPI.updateRoom(room.id, { name: editName });
    if (error) alert('Lỗi: ' + error.message);
    else {
      await logAPI.logAdminAction('Cập nhật phòng chiếu', `${room.name} -> ${editName}`, 'room');
      setEditingRoomId(null);
      loadRooms();
    }
  };

  const renderRoomList = (type, icon) => {
    const filteredRooms = rooms.filter(r => r.type === type);
    return (
      <div className="room-list">
        {filteredRooms.map(room => (
          <div key={room.id} className="room-item">
            <div className="room-info-main">
              <span className="material-symbols-outlined room-icon">{icon}</span>
              <div className="room-text">
                {editingRoomId === room.id ? (
                  <input 
                    type="text" 
                    value={editName} 
                    onChange={(e) => setEditingName(e.target.value)}
                    className="m3-textfield-input"
                    style={{ padding: '4px 8px', height: 'auto', fontSize: '14px' }}
                    autoFocus
                  />
                ) : (
                  <div className="room-name">{room.name}</div>
                )}
                <div className="room-type-label">{room.type} (x{room.multiplier})</div>
              </div>
            </div>
            <div className="room-item-actions">
              {editingRoomId === room.id ? (
                <button className="m3-btn-sm m3-btn-filled" onClick={() => handleSaveEdit(room)}>Lưu</button>
              ) : (
                <button className="m3-btn-sm m3-btn-outlined" onClick={() => handleStartEdit(room)}>Sửa tên</button>
              )}
            </div>
          </div>
        ))}
        {filteredRooms.length === 0 && <p style={{ opacity: 0.5, fontSize: '13px' }}>Chưa có phòng nào.</p>}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="seating-pricing-management">
        <div className="dual-cards-container">
          <GenericSkeleton width="380px" height="400px" borderRadius="20px" />
          <GenericSkeleton width="380px" height="400px" borderRadius="20px" />
          <GenericSkeleton width="380px" height="400px" borderRadius="20px" />
        </div>
      </div>
    );
  }

  return (
    <div className="seating-pricing-management cinema-room-management">
      <div className="dual-cards-container">
        {/* CARD 1: 2D/3D */}
        <div className="admin-main-card">
          <div className="card-header">
            <span className="material-symbols-outlined">view_in_ar</span>
            <h3>Phòng chiếu 2D/3D</h3>
          </div>
          <div className="card-content">
            {renderRoomList('2D/3D', 'theater_comedy')}
            <button className="m3-btn m3-btn-tonal" style={{ marginTop: 'auto' }} onClick={() => handleAddRoom('2D/3D')}>
              <span className="material-symbols-outlined">add</span>
              Thêm phòng mới
            </button>
          </div>
        </div>

        {/* CARD 2: IMAX */}
        <div className="admin-main-card">
          <div className="card-header">
            <span className="material-symbols-outlined">aspect_ratio</span>
            <h3>Phòng IMAX</h3>
          </div>
          <div className="card-content">
            {renderRoomList('IMAX', 'movie')}
            <button className="m3-btn m3-btn-tonal" style={{ marginTop: 'auto' }} onClick={() => handleAddRoom('IMAX')}>
              <span className="material-symbols-outlined">add</span>
              Thêm phòng mới
            </button>
          </div>
        </div>

        {/* CARD 3: 4DX */}
        <div className="admin-main-card">
          <div className="card-header">
            <span className="material-symbols-outlined">waves</span>
            <h3>Phòng 4DX</h3>
          </div>
          <div className="card-content">
            {renderRoomList('4DX', 'auto_awesome_motion')}
            <button className="m3-btn m3-btn-tonal" style={{ marginTop: 'auto' }} onClick={() => handleAddRoom('4DX')}>
              <span className="material-symbols-outlined">add</span>
              Thêm phòng mới
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CinemaRoomManagement;
