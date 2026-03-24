import React, { useState, useEffect, useCallback } from 'react';
import { overviewAPI } from '../../services/api';
import GenericSkeleton from '../GenericSkeleton';
import '../../styles/admin/Analytics.css';

const formatCurrency = (amount) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
const formatNumber = (num) => new Intl.NumberFormat('vi-VN').format(num);

// Reusable Metric Card Component
const MetricCard = ({ icon, title, value, detail }) => (
  <div className="m3-card metric-card">
    <div className="metric-icon-wrapper">
      <span className="material-symbols-outlined">{icon}</span>
    </div>
    <p className="metric-title">{title}</p>
    <p className="metric-value">{value}</p>
    {detail && <p className="metric-detail">{detail}</p>}
  </div>
);

// Custom CSS-based Pie Chart Component
const RevenuePieChart = ({ data }) => {
  if (!data || data.length === 0) return null;

  const colors = ['#E4BD66', '#C5A059', '#A6834C', '#87663F', '#684932', '#492C25'];
  let currentPercentage = 0;
  
  const total = data.reduce((sum, item) => sum + item.revenue, 0);
  if (total === 0) return null;

  const gradientParts = data.map((item, index) => {
    const start = currentPercentage;
    const percentage = (item.revenue / total) * 100;
    currentPercentage += percentage;
    return `${colors[index % colors.length]} ${start}% ${currentPercentage}%`;
  });

  const backgroundStyle = {
    background: `conic-gradient(${gradientParts.join(', ')})`
  };

  return (
    <div className="m3-card chart-card">
      <h3 className="card-title">Tỷ lệ doanh thu</h3>
      <div className="chart-content-wrapper">
        <div className="pie-chart-visual" style={backgroundStyle}>
          <div className="pie-center-cutout"></div>
        </div>
        <div className="chart-legend-list">
          {data.slice(0, 6).map((item, index) => (
            <div key={item.title} className="legend-item-row">
              <div className="legend-color-dot" style={{ backgroundColor: colors[index % colors.length] }}></div>
              <span className="legend-label">{item.title}</span>
              <span className="legend-value">{((item.revenue / total) * 100).toFixed(1)}%</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const Analytics = ({ timeRange = '7' }) => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalRevenue: 0,
    totalTickets: 0,
    movieRevenue: [],
    bookingCount: 0
  });

  const loadRevenueData = useCallback(async () => {
    try {
      setLoading(true);
      const days = parseInt(timeRange);
      const { data, error } = await overviewAPI.getRevenueStats(days);

      if (error) throw error;

      const records = data || [];
      let totalRev = 0;
      let totalTix = 0;
      const movieMap = {};

      records.forEach(r => {
        totalRev += r.amount || 0;
        const ticketCount = r.seats_count || 0;
        totalTix += ticketCount;

        const movieTitle = r.movie_title || 'Phim không xác định';
        if (!movieMap[movieTitle]) {
          movieMap[movieTitle] = { title: movieTitle, revenue: 0, tickets: 0 };
        }
        movieMap[movieTitle].revenue += r.amount || 0;
        movieMap[movieTitle].tickets += ticketCount;
      });

      const sortedMovies = Object.values(movieMap).sort((a, b) => b.revenue - a.revenue);

      setStats({
        totalRevenue: totalRev,
        totalTickets: totalTix,
        movieRevenue: sortedMovies,
        bookingCount: records.length
      });
    } catch (err) {
      console.error('Failed to load revenue data:', err);
    } finally {
      setLoading(false);
    }
  }, [timeRange]);

  const exportToExcel = useCallback(() => {
    // Check if XLSX is available, if not try to load it
    if (!window.XLSX) {
      const script = document.createElement('script');
      script.src = "https://cdn.sheetjs.com/xlsx-0.20.0/package/dist/xlsx.full.min.js";
      script.onload = () => performExport();
      document.body.appendChild(script);
    } else {
      performExport();
    }

    function performExport() {
      const XLSX = window.XLSX;
      
      // 1. Prepare Overview Sheet
      const overviewData = [
        ["BÁO CÁO DOANH THU CINEMAHUB"],
        ["Khoảng thời gian", `${timeRange} ngày qua`],
        ["Ngày xuất báo cáo", new Date().toLocaleString('vi-VN')],
        [],
        ["CHỈ SỐ TỔNG QUAN"],
        ["Tổng doanh thu", stats.totalRevenue, "VNĐ"],
        ["Tổng số vé bán", stats.totalTickets, "vé"],
        ["Số lượt giao dịch", stats.bookingCount],
        ["Giá vé trung bình", stats.totalTickets > 0 ? Math.round(stats.totalRevenue / stats.totalTickets) : 0, "VNĐ"],
        []
      ];

      // 2. Prepare Movie Breakdown Sheet
      const movieData = [
        ["CHI TIẾT DOANH THU THEO PHIM"],
        ["STT", "Tên Phim", "Doanh thu (VNĐ)", "Số vé", "Tỷ lệ (%)"]
      ];

      stats.movieRevenue.forEach((m, idx) => {
        movieData.push([
          idx + 1,
          m.title,
          m.revenue,
          m.tickets,
          ((m.revenue / stats.totalRevenue) * 100).toFixed(1)
        ]);
      });

      // Create Workbook
      const wb = XLSX.utils.book_new();
      
      // Combine all into one sheet or separate ones
      const ws = XLSX.utils.aoa_to_sheet([...overviewData, ...movieData]);
      
      // Basic styling/width adjustment
      ws['!cols'] = [{ wch: 20 }, { wch: 40 }, { wch: 15 }, { wch: 10 }, { wch: 10 }];

      XLSX.utils.book_append_sheet(wb, ws, "Doanh Thu");
      
      // Export
      XLSX.writeFile(wb, `CinemaHub_Revenue_${new Date().toISOString().split('T')[0]}.xlsx`);
    }
  }, [stats, timeRange]);

  useEffect(() => {
    loadRevenueData();
  }, [loadRevenueData]);

  useEffect(() => {
    // Listen for global export action
    window.addEventListener('admin-action-export', exportToExcel);
    return () => window.removeEventListener('admin-action-export', exportToExcel);
  }, [exportToExcel]);

  if (loading) {
    return (
      <div className="analytics-container">
        <div className="metrics-grid">
          <GenericSkeleton width="100%" height="180px" borderRadius="16px" />
          <GenericSkeleton width="100%" height="180px" borderRadius="16px" />
          <GenericSkeleton width="100%" height="180px" borderRadius="16px" />
        </div>
        <div style={{ marginTop: '2rem' }}>
          <GenericSkeleton width="100%" height="400px" borderRadius="16px" />
        </div>
      </div>
    );
  }

  return (
    <div className="analytics-container">
      {/* Key Metrics & Chart Row */}
      <div className="analytics-top-section">
        <div className="metrics-column">
          <MetricCard 
            icon="payments" 
            title="Tổng doanh thu"
            value={formatCurrency(stats.totalRevenue)}
            detail={`Trung bình ${formatCurrency(stats.totalRevenue / (parseInt(timeRange) || 1))}/ngày`}
          />
          <MetricCard 
            icon="confirmation_number"
            title="Vé đã bán"
            value={formatNumber(stats.totalTickets)}
            detail={`${stats.bookingCount} lượt giao dịch`}
          />
          <MetricCard 
            icon="trending_up"
            title="Giá vé TB"
            value={formatCurrency(stats.totalTickets > 0 ? stats.totalRevenue / stats.totalTickets : 0)}
            detail="Tính trên mỗi vé"
          />
        </div>
        
        <div className="chart-column">
          <RevenuePieChart data={stats.movieRevenue} />
        </div>
      </div>

      {/* Top Movies Table */}
      <div className="m3-card data-table-card">
        <h3 className="card-title">Doanh thu theo phim</h3>
        <table className="m3-data-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Tên phim</th>
              <th>Doanh thu</th>
              <th>Số vé</th>
              <th>Tỷ lệ</th>
            </tr>
          </thead>
          <tbody>
            {stats.movieRevenue.length > 0 ? stats.movieRevenue.map((movie, index) => (
              <tr key={movie.title}>
                <td>{index + 1}</td>
                <td><strong>{movie.title}</strong></td>
                <td style={{ color: 'var(--md-sys-color-primary)', fontWeight: '700' }}>{formatCurrency(movie.revenue)}</td>
                <td>{formatNumber(movie.tickets)}</td>
                <td>{((movie.revenue / stats.totalRevenue) * 100).toFixed(1)}%</td>
              </tr>
            )) : (
              <tr>
                <td colSpan="5" style={{ textAlign: 'center', padding: '3rem', opacity: 0.5 }}>
                  Không có dữ liệu trong khoảng thời gian này
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Analytics;
