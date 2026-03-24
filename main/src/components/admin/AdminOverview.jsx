import React, { useState, useEffect } from 'react';
import { overviewAPI, movieAPI, logAPI, configurationAPI, commentAPI } from '../../services/api';
import { checkAIStatus, DEFAULT_SYSTEM_PROMPT } from '../../services/ai';
import GenericSkeleton from '../GenericSkeleton';
import '../../styles/admin/AdminOverview.css';
import '../../styles/components/Card.css';

const AdminOverview = ({ onTabChange }) => {
  const [stats, setStats] = useState({
    databaseStatus: { connected: false, lastCheck: null },
    aiStatus: { connected: false, lastCheck: null },
    recentActivities: [],
    modActivities: []
  });
  const [activeActivityTab, setActiveActivityTab] = useState('admin');
  const [aiInsights, setAiInsights] = useState({
    needsScheduleUpdate: false,
    daysSinceUpdate: 0,
    topRevenueMovie: null,
    mostClickedMovie: null,
    pendingCommentsCount: 0,
    peakHour: null,
    offPeakHour: null,
    loading: true
  });
  const [aiProvider, setAiProvider] = useState('llama');
  const [systemPrompt, setSystemPrompt] = useState('');
  const [tempPrompt, setTempPrompt] = useState('');
  const [isPromptDrawerOpen, setIsPromptDrawerOpen] = useState(false);
  const [savingPrompt, setSavingPrompt] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const formatCurrency = (amount) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);

  const loadOverviewData = async () => {
    try {
      setLoading(true);
      setError('');

      // Load status, activities and config
      const [
        dbStatusResponse,
        aiStatus,
        recentBookings,
        systemLogsResponse,
        activeAI,
        dbPrompt,
        revenueStats,
        trendingMovies,
        pendingComments,
        hourStats,
        checkinLogsResponse
      ] = await Promise.allSettled([
        overviewAPI.checkDatabaseStatus(),
        checkAIStatus(),
        overviewAPI.getBookingStats(),
        logAPI.getSystemLogs(20),
        configurationAPI.getAIConfig(),
        configurationAPI.getAISystemPrompt(),
        overviewAPI.getRevenueStats(30),
        movieAPI.getTrendingMovies(),
        commentAPI.getCommentsByStatus('pending'),
        overviewAPI.getBookingHourStats(),
        logAPI.getCheckinLogs(20)
      ]);

      if (activeAI.status === 'fulfilled') {
        setAiProvider(activeAI.value);
      }

      if (dbPrompt.status === 'fulfilled') {
        setSystemPrompt(dbPrompt.value || DEFAULT_SYSTEM_PROMPT);
      }

      // Process AI Insights
      let needsUpdate = false;
      let daysPassed = 0;
      if (systemLogsResponse.status === 'fulfilled') {
        const lastScheduleLog = systemLogsResponse.value.data.find(log => log.action === 'Tạo chương trình tuần');
        if (lastScheduleLog) {
          const lastUpdate = new Date(lastScheduleLog.created_at);
          const now = new Date();
          const diffTime = Math.abs(now - lastUpdate);
          daysPassed = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          if (daysPassed >= 6) needsUpdate = true;
        } else {
          needsUpdate = true; // Never updated?
        }
      }

      let topRev = null;
      if (revenueStats.status === 'fulfilled' && revenueStats.value.data) {
        const movieRevenue = {};
        revenueStats.value.data.forEach(rev => {
          movieRevenue[rev.movie_title] = (movieRevenue[rev.movie_title] || 0) + rev.amount;
        });
        const sorted = Object.entries(movieRevenue).sort((a, b) => b[1] - a[1]);
        if (sorted.length > 0) topRev = { title: sorted[0][0], amount: sorted[0][1] };
      }

      let mostClicked = null;
      if (trendingMovies.status === 'fulfilled' && trendingMovies.value.length > 0) {
        mostClicked = { title: trendingMovies.value[0].title, score: trendingMovies.value[0].score };
      }

      let peak = null;
      let offPeak = null;
      if (hourStats.status === 'fulfilled') {
        const sortedHours = Object.entries(hourStats.value).sort((a, b) => b[1] - a[1]);
        if (sortedHours.length > 0) {
          peak = { hour: sortedHours[0][0], count: sortedHours[0][1] };
          offPeak = { hour: sortedHours[sortedHours.length - 1][0], count: sortedHours[sortedHours.length - 1][1] };
        }
      }

      setAiInsights({
        needsScheduleUpdate: needsUpdate,
        daysSinceUpdate: daysPassed,
        topRevenueMovie: topRev,
        mostClickedMovie: mostClicked,
        pendingCommentsCount: (pendingComments.status === 'fulfilled' && !pendingComments.value.error) ? (pendingComments.value.data?.length || 0) : 0,
        peakHour: peak,
        offPeakHour: offPeak,
        loading: false
      });

      const activities = [];

      // Add recent bookings to activities (Booking Action)
      if (recentBookings.status === 'fulfilled' && !recentBookings.value.error) {
        recentBookings.value.data.recentBookings.slice(0, 10).forEach(b => {
          activities.push({
            id: `booking-${b.id}`,
            type: 'booking',
            action: '🎫 Có đơn đặt vé mới',
            detail: `${b.customerName || 'Khách'} - ${b.movieTitle} (${b.seats} ghế)`,
            amount: formatCurrency(b.totalAmount),
            time: b.createdAt
          });
        });
      }

      // Add system logs to activities (Admin Action)
      if (systemLogsResponse.status === 'fulfilled' && !systemLogsResponse.value.error) {
        systemLogsResponse.value.data.forEach(log => {
          activities.push({
            id: `log-${log.id}`,
            type: log.type || 'system',
            action: `⚡ ${log.action}`,
            detail: log.detail,
            time: log.created_at
          });
        });
      }

      // Sort by time descending
      activities.sort((a, b) => new Date(b.time) - new Date(a.time));

      const modActivities = [];
      if (checkinLogsResponse.status === 'fulfilled' && !checkinLogsResponse.value.error) {
        checkinLogsResponse.value.data.forEach(log => {
          modActivities.push({
            id: `checkin-${log.id}`,
            type: 'checkin',
            action: '✅ ' + log.action,
            detail: log.detail,
            time: log.created_at
          });
        });
      }

      setStats({
        databaseStatus: dbStatusResponse.status === 'fulfilled' ? dbStatusResponse.value.data : { connected: false },
        aiStatus: aiStatus.status === 'fulfilled' ? aiStatus.value : { connected: false },
        recentActivities: activities.slice(0, 20),
        modActivities: modActivities
      });

    } catch (err) {
      console.error('Overview data error:', err);
      setError('Lỗi cập nhật trạng thái hệ thống');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOverviewData();

    // Listen for global refresh action
    const handleGlobalRefresh = () => loadOverviewData();
    window.addEventListener('admin-action-refresh', handleGlobalRefresh);
    
    return () => {
      window.removeEventListener('admin-action-refresh', handleGlobalRefresh);
    };
  }, []);

  const handleAIProviderChange = async (newProvider) => {
    try {
      setAiProvider(newProvider);
      await configurationAPI.setAIConfig(newProvider);
      await logAPI.logAdminAction('Thay đổi bộ não AI', `Chuyển sang dùng ${newProvider.toUpperCase()}`, 'system');
    } catch (err) {
      alert('Lỗi cập nhật cấu hình AI');
    }
  };

  const handleSavePrompt = async () => {
    try {
      setSavingPrompt(true);
      await configurationAPI.setAISystemPrompt(tempPrompt);
      setSystemPrompt(tempPrompt);
      await logAPI.logAdminAction('Cập nhật AI System Prompt', 'Thay đổi chỉ dẫn hệ thống cho CinX', 'system');
      setIsPromptDrawerOpen(false);
    } catch (err) {
      alert('Lỗi khi lưu System Prompt');
    } finally {
      setSavingPrompt(false);
    }
  };

  const openPromptEditor = () => {
    setTempPrompt(systemPrompt);
    setIsPromptDrawerOpen(true);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Chưa rõ';
    return new Date(dateString).toLocaleString('vi-VN');
  };

  if (loading) {
    return (
      <div className="admin-overview">
        <div className="overview-grid system-status-grid">
          <div className="overview-card"><GenericSkeleton width="100%" height="150px" borderRadius="16px" /></div>
          <div className="overview-card"><GenericSkeleton width="100%" height="150px" borderRadius="16px" /></div>
          <div className="overview-card activities-card full-width"><GenericSkeleton width="100%" height="400px" borderRadius="16px" /></div>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-overview">
      {/* AI INSIGHTS QUICK BLOCK */}
      <div className="ai-insights-block">
        <div className="insights-header">
          <span className="material-symbols-outlined">auto_awesome</span>
          <h3>Trợ lý CinX: Phân tích nhanh</h3>
        </div>
        <div className="insights-grid">
          {/* Reminder Card */}
          <div className={`insight-card ${aiInsights.needsScheduleUpdate ? 'urgent' : ''}`}>
            <div className="insight-icon">
              <span className="material-symbols-outlined">{aiInsights.needsScheduleUpdate ? 'notification_important' : 'event_available'}</span>
            </div>
            <div className="insight-content">
              <div className="insight-label">Lịch chiếu tuần</div>
              <div className="insight-value">
                {aiInsights.needsScheduleUpdate ? 'Cần cập nhật ngay' : 'Đang ổn định'}
              </div>
              <div className="insight-desc">
                {aiInsights.daysSinceUpdate === 0 ? 'Mới cập nhật gần đây' : `Đã ${aiInsights.daysSinceUpdate} ngày kể từ lần cuối tạo lịch`}
              </div>
            </div>
          </div>

          {/* Top Revenue Card */}
          <div className="insight-card success">
            <div className="insight-icon">
              <span className="material-symbols-outlined">payments</span>
            </div>
            <div className="insight-content">
              <div className="insight-label">Doanh thu tốt nhất</div>
              <div className="insight-value">{aiInsights.topRevenueMovie?.title || 'Chưa có dữ liệu'}</div>
              <div className="insight-desc">
                {aiInsights.topRevenueMovie ? `Kiếm được ${formatCurrency(aiInsights.topRevenueMovie.amount)} (30 ngày)` : 'Bắt đầu bán vé để xem thống kê'}
              </div>
            </div>
          </div>

          {/* Most Clicked Card */}
          <div className="insight-card info">
            <div className="insight-icon">
              <span className="material-symbols-outlined">ads_click</span>
            </div>
            <div className="insight-content">
              <div className="insight-label">Được quan tâm nhất</div>
              <div className="insight-value">{aiInsights.mostClickedMovie?.title || 'Chưa có dữ liệu'}</div>
              <div className="insight-desc">
                {aiInsights.mostClickedMovie ? `Có ${aiInsights.mostClickedMovie.score} lượt quan tâm & đặt chỗ` : 'Dữ liệu đang được thu thập'}
              </div>
            </div>
          </div>

          {/* Pending Comments Card */}
          <div className={`insight-card warning clickable ${aiInsights.pendingCommentsCount > 0 ? 'pulse' : ''}`} onClick={() => onTabChange('comments')}>
            <div className="insight-icon">
              <span className="material-symbols-outlined">reviews</span>
            </div>
            <div className="insight-content">
              <div className="insight-label">Bình luận cần duyệt</div>
              <div className="insight-value">
                {aiInsights.pendingCommentsCount} bình luận mới
              </div>
              <div className="insight-desc">
                {aiInsights.pendingCommentsCount > 0 ? 'Cần kiểm duyệt nội dung' : 'Tất cả đã được xử lý'}
              </div>
            </div>
          </div>

          {/* Peak Hour Card */}
          <div className="insight-card secondary">
            <div className="insight-icon">
              <span className="material-symbols-outlined">alarm_on</span>
            </div>
            <div className="insight-content">
              <div className="insight-label">Khung giờ đông khách</div>
              <div className="insight-value">{aiInsights.peakHour ? `${aiInsights.peakHour.hour}` : 'N/A'}</div>
              <div className="insight-desc">
                {aiInsights.peakHour ? `Ghi nhận ${aiInsights.peakHour.count} đơn đặt vé` : 'Chưa đủ dữ liệu phân tích'}
              </div>
            </div>
          </div>

          {/* Off-Peak Hour Card */}
          <div className="insight-card secondary">
            <div className="insight-icon">
              <span className="material-symbols-outlined">alarm_off</span>
            </div>
            <div className="insight-content">
              <div className="insight-label">Khung giờ vắng khách</div>
              <div className="insight-value">{aiInsights.offPeakHour ? `${aiInsights.offPeakHour.hour}` : 'N/A'}</div>
              <div className="insight-desc">
                {aiInsights.offPeakHour ? `Chỉ có ${aiInsights.offPeakHour.count} đơn đặt vé` : 'Chưa đủ dữ liệu phân tích'}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="overview-grid system-status-grid">
        {/* DATABASE STATUS */}
        <div className="overview-card status-card">
          <div className="card-header">
            <span className="material-symbols-outlined">database</span>
            <h3>Kết nối Database</h3>
          </div>
          <div className="card-content">
            <div className={`status-indicator ${stats.databaseStatus.connected ? 'success' : 'error'}`}>
              <div className="status-dot"></div>
              <span>{stats.databaseStatus.connected ? 'Đang hoạt động' : 'Mất kết nối'}</span>
            </div>
            <div className="status-detail">
              <small>Supabase Cloud: {formatDate(stats.databaseStatus.lastCheck)}</small>
            </div>
          </div>
        </div>

        {/* AI STATUS */}
        <div className="overview-card status-card">
          <div className="card-header">
            <span className="material-symbols-outlined">psychology</span>
            <h3>Trí tuệ nhân tạo (CinX)</h3>
          </div>
          <div className="card-content">
            <div className={`status-indicator ${stats.aiStatus.connected ? 'success' : 'error'}`}>
              <div className="status-dot"></div>
              <span>{stats.aiStatus.connected ? 'Sẵn sàng' : 'Ngoại tuyến'}</span>
            </div>
            
            <div className="ai-provider-selector">
              <button 
                className={`provider-btn ${aiProvider === 'llama' ? 'active' : ''}`}
                onClick={() => handleAIProviderChange('llama')}
              >
                Llama 3.2
              </button>
              <button 
                className={`provider-btn ${aiProvider === 'gemini' ? 'active' : ''}`}
                onClick={() => handleAIProviderChange('gemini')}
              >
                Gemini 3.0
              </button>
            </div>

            <div className="status-detail" style={{ marginTop: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <small>Provider: {aiProvider === 'gemini' ? 'Gemini Cloud via Ollama' : 'Llama Local via Ollama'}</small>
              <button className="m3-btn m3-btn-text m3-btn-sm" onClick={openPromptEditor}>
                <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>edit_note</span>
                Sửa Prompt
              </button>
            </div>
          </div>
        </div>

        {/* ADMIN ACTIVITIES */}
        <div className="overview-card activities-card full-width">
          <div className="card-header activities-header-tabs" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span className="material-symbols-outlined">history</span>
              <h3 style={{ margin: 0 }}>Hoạt động gần đây</h3>
            </div>
            <div className="tab-group-activities" style={{ display: 'flex', gap: '8px' }}>
              <button 
                className={`m3-btn m3-btn-sm ${activeActivityTab === 'admin' ? 'm3-btn-filled' : 'm3-btn-text'}`}
                onClick={() => setActiveActivityTab('admin')}
                style={{ borderRadius: '12px' }}
              >
                Admin
              </button>
              <button 
                className={`m3-btn m3-btn-sm ${activeActivityTab === 'mod' ? 'm3-btn-filled' : 'm3-btn-text'}`}
                onClick={() => setActiveActivityTab('mod')}
                style={{ borderRadius: '12px' }}
              >
                Mod
              </button>
            </div>
          </div>
          <div className="card-content">
            <div className="activities-list">
              {(activeActivityTab === 'admin' ? stats.recentActivities : stats.modActivities).length > 0 ? (activeActivityTab === 'admin' ? stats.recentActivities : stats.modActivities).map(act => (
                <div key={act.id} className="activity-item">
                  <div className={`activity-icon ${act.type}`}>
                    <span className="material-symbols-outlined">
                      {act.type === 'movie' ? 'theaters' : 
                       act.type === 'booking' ? 'receipt_long' :
                       act.type === 'news' ? 'newspaper' :
                       act.type === 'promotion' ? 'sell' :
                       act.type === 'room' ? 'meeting_room' :
                       act.type === 'checkin' ? 'fact_check' :
                       act.type === 'pricing' ? 'payments' : 'settings'}
                    </span>
                  </div>
                  <div className="activity-info">
                    <div className="activity-action">{act.action}</div>
                    <div className="activity-detail">
                      {act.detail} {act.amount && <strong style={{ color: 'var(--md-sys-color-primary)', marginLeft: '8px' }}>{act.amount}</strong>}
                    </div>
                  </div>
                  <div className="activity-time">{formatDate(act.time)}</div>
                </div>
              )) : (
                <div className="empty-state">
                  <p>Chưa có hoạt động nào được ghi nhận.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* SYSTEM PROMPT DRAWER */}
      <div className={`admin-drawer ${isPromptDrawerOpen ? 'open' : ''}`}>
        <div className="drawer-header-main">
          <h3>Cấu hình System Prompt</h3>
          <button onClick={() => setIsPromptDrawerOpen(false)} className="close-btn">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>
        <div className="drawer-body-main">
          <div className="prompt-editor-container">
            <p className="helper-text">Đây là "bản sắc" của CinX. Hãy cẩn thận khi thay đổi các quy tắc vàng này.</p>
            <textarea 
              className="prompt-textarea"
              value={tempPrompt}
              onChange={(e) => setTempPrompt(e.target.value)}
              placeholder="Nhập system prompt tại đây..."
            ></textarea>
            
            <div className="drawer-actions-row" style={{ marginTop: '24px' }}>
              <button className="m3-btn m3-btn-text" onClick={() => setIsPromptDrawerOpen(false)}>Hủy</button>
              <button 
                className="m3-btn m3-btn-filled" 
                onClick={handleSavePrompt}
                disabled={savingPrompt}
              >
                {savingPrompt ? <span className="loading-spinner-sm"></span> : 'Lưu thay đổi'}
              </button>
            </div>
          </div>
        </div>
      </div>
      {isPromptDrawerOpen && <div className="drawer-overlay-admin" onClick={() => setIsPromptDrawerOpen(false)} />}
    </div>
  );
};

export default AdminOverview;
