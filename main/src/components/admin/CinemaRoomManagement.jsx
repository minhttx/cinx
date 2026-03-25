import React, { useState, useEffect } from 'react';
import { roomAPI, logAPI } from '../../services/api';
import GenericSkeleton from '../GenericSkeleton';
import ConfirmModal from '../ConfirmModal';
import '../../styles/admin/SeatingPricingManagement.css'; 

// --- SUB-COMPONENT: Room Form Modal ---
const RoomFormModal = ({ isOpen, title, initialValue, onSave, onCancel }) => {
  const [value, setValue] = useState(initialValue || '');

  useEffect(() => {
    setValue(initialValue || '');
  }, [initialValue, isOpen]);

  if (!isOpen) return null;

  return (
    <div className="modal-overlay animate-fade-in" style={{ zIndex: 10000 }}>
      <div className="m3-card animate-pop" style={{ width: '400px', padding: '24px', backgroundColor: 'var(--md-sys-color-surface-container-high)' }}>
        <h3 style={{ marginBottom: '16px', color: 'var(--md-sys-color-primary)' }}>{title}</h3>
        <div className="m3-textfield full-width">
          <input 
            type="text" 
            value={value} 
            onChange={(e) => setValue(e.target.value)}
            placeholder="Nhập tên phòng..."
            autoFocus
            onKeyDown={(e) => e.key === 'Enter' && onSave(value)}
          />
        </div>
        <div className="modal-actions" style={{ marginTop: '24px', display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
          <button className="m3-btn m3-btn-text" onClick={onCancel}>Hủy bỏ</button>
          <button className="m3-btn m3-btn-filled" onClick={() => onSave(value)} disabled={!value.trim()}>
            Xác nhận
          </button>
        </div>
      </div>
    </div>
  );
};

const CinemaRoomManagement = () => {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Modals state
  const [roomModal, setRoomModal] = useState({ 
    isOpen: false, title: '', type: '', initialValue: '', roomId: null 
  });
  const [confirmModal, setConfirmModal] = useState({ 
    isOpen: false, title: '', message: '', action: null 
  });

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
  }, []);

  const handleOpenAdd = (type) => {
    setRoomModal({
      isOpen: true,
      title: `Thêm phòng ${type} mới`,
      type: type,
      initialValue: '',
      roomId: null
    });
  };

  const handleOpenEdit = (room) => {
    setRoomModal({
      isOpen: true,
      title: 'Đổi tên phòng',
      type: room.type,
      initialValue: room.name,
      roomId: room.id
    });
  };

  const handleSaveRoom = async (name) => {
    if (!name.trim()) return;

    try {
      if (roomModal.roomId) {
        // EDIT MODE
        const { error } = await roomAPI.updateRoom(roomModal.roomId, { name });
        if (error) throw error;
        await logAPI.logAdminAction('Cập nhật phòng chiếu', `Đổi tên -> ${name}`, 'room');
      } else {
        // ADD MODE
        let multiplier = 1.0;
        if (roomModal.type === 'IMAX') multiplier = 1.5;
        if (roomModal.type === '4DX') multiplier = 2.0;

        const { error } = await roomAPI.createRoom({ name, type: roomModal.type, multiplier });
        if (error) throw error;
        await logAPI.logAdminAction('Thêm phòng chiếu', `${name} (${roomModal.type})`, 'room');
      }
      loadRooms();
      setRoomModal(prev => ({ ...prev, isOpen: false }));
    } catch (err) {
      alert('Lỗi: ' + err.message);
    }
  };

  const handleDeleteRoom = async (room) => {
    try {
      const { error } = await roomAPI.deleteRoom(room.id);
      if (error) throw error;
      await logAPI.logAdminAction('Xóa phòng chiếu', `${room.name} (${room.type})`, 'room');
      loadRooms();
      setConfirmModal(prev => ({ ...prev, isOpen: false }));
    } catch (err) {
      alert('Lỗi khi xóa: ' + err.message);
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
                <div className="room-name">{room.name}</div>
                <div className="room-type-label">{room.type} (x{room.multiplier})</div>
              </div>
            </div>
            <div className="room-item-actions">
              <button className="m3-btn m3-btn-filled m3-btn-sm" onClick={() => handleOpenEdit(room)} title="Sửa tên">
                <span className="material-symbols-outlined">edit</span>
              </button>
              <button className="m3-btn m3-btn-outlined m3-btn-sm danger-btn" onClick={() => setConfirmModal({
                isOpen: true,
                title: 'Xóa phòng chiếu?',
                message: `Bạn có chắc muốn xóa phòng ${room.name}?`,
                action: () => handleDeleteRoom(room)
              })} title="Xóa phòng">
                <span className="material-symbols-outlined">delete</span>
              </button>
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
            <button className="m3-btn m3-btn-tonal" style={{ marginTop: 'auto' }} onClick={() => handleOpenAdd('2D/3D')}>
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
            <button className="m3-btn m3-btn-tonal" style={{ marginTop: 'auto' }} onClick={() => handleOpenAdd('IMAX')}>
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
            <button className="m3-btn m3-btn-tonal" style={{ marginTop: 'auto' }} onClick={() => handleOpenAdd('4DX')}>
              <span className="material-symbols-outlined">add</span>
              Thêm phòng mới
            </button>
          </div>
        </div>
      </div>

      {/* MODALS */}
      <RoomFormModal 
        isOpen={roomModal.isOpen}
        title={roomModal.title}
        initialValue={roomModal.initialValue}
        onSave={handleSaveRoom}
        onCancel={() => setRoomModal(prev => ({ ...prev, isOpen: false }))}
      />

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

export default CinemaRoomManagement;