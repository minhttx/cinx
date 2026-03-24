import React, { useState, useEffect } from 'react';
import { configurationAPI, roomAPI, logAPI } from '../../services/api';
import GenericSkeleton from '../GenericSkeleton';
import '../../styles/admin/SeatingPricingManagement.css';

const SeatingPricingManagement = () => {
  // Pricing config state
  const [pricingConfig, setPricingConfig] = useState({
    basePrice: 0,
    vipPrice: 0,
    couplePrice: 0,
    weekendMultiplier: 1.0,
  });
  const [roomMultipliers, setRoomMultipliers] = useState({
    '2D/3D': 1.0,
    'IMAX': 1.5,
    '4DX': 2.0
  });

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    loadConfiguration();
  }, []);

  const loadConfiguration = async () => {
    try {
      setLoading(true);
      const { data } = await configurationAPI.getPricingConfig();
      if (data) {
        setPricingConfig({
          basePrice: data.basePrice || 0,
          vipPrice: data.vipPrice || 0,
          couplePrice: data.couplePrice || 0,
          weekendMultiplier: data.weekendMultiplier || 1.0,
        });
      }

      // Fetch room multipliers
      const { data: rooms } = await roomAPI.getRooms();
      if (rooms) {
        const multipliers = {};
        rooms.forEach(r => {
          multipliers[r.type] = Number(r.multiplier);
        });
        setRoomMultipliers(prev => ({ ...prev, ...multipliers }));
      }
    } catch (error) {
      console.error('Failed to load configuration:', error);
      setMessage('Lỗi khi tải cấu hình giá!');
    } finally {
      setLoading(false);
    }
  };

  const saveConfiguration = async () => {
    try {
      setLoading(true);
      // Save base prices
      const { error } = await configurationAPI.savePricingConfig(pricingConfig);
      if (error) throw error;

      // Save room multipliers
      const { data: allRooms } = await roomAPI.getRooms();
      for (const room of allRooms || []) {
        if (roomMultipliers[room.type] !== undefined) {
          await roomAPI.updateRoom(room.id, { multiplier: roomMultipliers[room.type] });
        }
      }

      await logAPI.logAdminAction('Cập nhật cấu hình giá', 'Bảng giá vé và hệ số điều chỉnh', 'pricing');
      setMessage('✅ Đã lưu cấu hình giá thành công!');
      setTimeout(() => setMessage(''), 4000);
    } catch (error) {
      console.error('Failed to save configuration:', error);
      setMessage('Lỗi khi lưu cấu hình: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handlePricingChange = (field, value) => {
    setPricingConfig(prev => ({ ...prev, [field]: value }));
  };

  const handleMultiplierChange = (type, value) => {
    setRoomMultipliers(prev => ({ ...prev, [type]: value }));
  };

  const generateSeatPreview = () => {
    const preview = [];
    const rows = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const seats = [];
      const count = (row === 'H') ? 6 : 12;
      for (let s = 1; s <= count; s++) {
        let type = 'regular';
        if (['F', 'G'].includes(row)) { type = 'vip'; }
        else if (row === 'H') { type = 'couple'; }
        seats.push({ number: `${row}${s}`, type });
      }
      preview.push({ row, seats });
    }
    return preview;
  };

  if (loading && pricingConfig.basePrice === 0) {
    return (
      <div className="seating-pricing-management">
        <div className="dual-cards-container">
          <GenericSkeleton width="380px" height="500px" borderRadius="20px" />
          <GenericSkeleton width="380px" height="500px" borderRadius="20px" />
          <GenericSkeleton width="380px" height="500px" borderRadius="20px" />
        </div>
      </div>
    );
  }

  return (
    <div className="seating-pricing-management">
      {message && (
        <div className={`m3-alert ${message.includes('thành công') ? 'success' : 'error'}`} style={{ marginBottom: '2rem' }}>
          {message}
        </div>
      )}

      <div className="dual-cards-container">
        {/* CARD 1: BASE PRICES */}
        <div className="admin-main-card">
          <div className="card-header">
            <span className="material-symbols-outlined">payments</span>
            <h3>Bảng giá vé cơ bản</h3>
          </div>
          <div className="card-content">
            <div className="pricing-edit-form">
              <div className="config-group">
                <label>Ghế thường (Regular)</label>
                <div className="price-input-wrapper">
                  <input type="number" step="1000" value={pricingConfig.basePrice} onChange={(e) => handlePricingChange('basePrice', parseInt(e.target.value) || 0)} className="m3-textfield-input" />
                  <span className="unit">VND</span>
                </div>
              </div>
              <div className="config-group">
                <label>Ghế VIP</label>
                <div className="price-input-wrapper">
                  <input type="number" step="1000" value={pricingConfig.vipPrice} onChange={(e) => handlePricingChange('vipPrice', parseInt(e.target.value) || 0)} className="m3-textfield-input" />
                  <span className="unit">VND</span>
                </div>
              </div>
              <div className="config-group">
                <label>Ghế Đôi (Couple)</label>
                <div className="price-input-wrapper">
                  <input type="number" step="1000" value={pricingConfig.couplePrice} onChange={(e) => handlePricingChange('couplePrice', parseInt(e.target.value) || 0)} className="m3-textfield-input" />
                  <span className="unit">VND</span>
                </div>
              </div>
              <div className="config-group" style={{ marginTop: 'auto' }}>
                <button className="m3-btn m3-btn-filled" onClick={saveConfiguration} disabled={loading} style={{ width: '100%', height: '52px' }}>
                  {loading ? <span className="loading-spinner-sm"></span> : 'Lưu giá vé'}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* CARD 2: MULTIPLIERS */}
        <div className="admin-main-card">
          <div className="card-header">
            <span className="material-symbols-outlined">trending_up</span>
            <h3>Hệ số điều chỉnh</h3>
          </div>
          <div className="card-content">
            <div className="pricing-edit-form">
              <div className="config-group">
                <label>Cuối tuần (Thứ 7, CN)</label>
                <div className="price-input-wrapper">
                  <input type="number" step="0.1" value={pricingConfig.weekendMultiplier} onChange={(e) => handlePricingChange('weekendMultiplier', parseFloat(e.target.value) || 1.0)} className="m3-textfield-input" />
                  <span className="unit">x</span>
                </div>
              </div>
              <div className="config-group">
                <label>Phòng IMAX</label>
                <div className="price-input-wrapper">
                  <input type="number" step="0.1" value={roomMultipliers['IMAX']} onChange={(e) => handleMultiplierChange('IMAX', parseFloat(e.target.value) || 1.0)} className="m3-textfield-input" />
                  <span className="unit">x</span>
                </div>
              </div>
              <div className="config-group">
                <label>Phòng 4DX</label>
                <div className="price-input-wrapper">
                  <input type="number" step="0.1" value={roomMultipliers['4DX']} onChange={(e) => handleMultiplierChange('4DX', parseFloat(e.target.value) || 1.0)} className="m3-textfield-input" />
                  <span className="unit">x</span>
                </div>
              </div>
              <div className="config-group" style={{ marginTop: 'auto' }}>
                <button className="m3-btn m3-btn-tonal" onClick={saveConfiguration} disabled={loading} style={{ width: '100%', height: '52px' }}>
                  {loading ? <span className="loading-spinner-sm"></span> : 'Lưu hệ số'}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* CARD 3: PREVIEW */}
        <div className="admin-main-card">
          <div className="card-header">
            <span className="material-symbols-outlined">grid_view</span>
            <h3>Xem trước sơ đồ</h3>
          </div>
          <div className="card-content">
            <div className="preview-section-minimal">
              <div className="screen-preview-minimal"><div className="screen-line"></div><span className="screen-text">MÀN HÌNH</span></div>
              <div className="seat-grid-preview-minimal">
                {generateSeatPreview().map(r => (
                  <div key={r.row} className={`seat-row-preview-min ${r.row === 'H' ? 'couple-row' : ''}`}>
                    <div className="row-id-preview-min">{r.row}</div>
                    <div className="seats-container-preview-min">
                      {r.seats.map(s => <div key={s.number} className={`seat-item-preview-min ${s.type}`}></div>)}
                    </div>
                  </div>
                ))}
              </div>
              <div className="legend-preview-minimal">
                <div className="legend-item-min"><div className="dot regular"></div><span>Thường</span></div>
                <div className="legend-item-min"><div className="dot vip"></div><span>VIP</span></div>
                <div className="legend-item-min"><div className="dot couple"></div><span>Đôi</span></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SeatingPricingManagement;
