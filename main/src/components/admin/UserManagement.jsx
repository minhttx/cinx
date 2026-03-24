import React, { useState, useEffect, useMemo } from 'react';
import { userAPI, bookingAPI, logAPI } from '../../services/api';
import GenericSkeleton from '../GenericSkeleton';
import '../../styles/admin/UserManagement.css';

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({ search: '', role: 'all', status: 'all' });

  const loadUsers = async () => {
    try {
      setLoading(true);
      const { data, error } = await userAPI.getAllUsers();
      if (error) {
        setError('Không thể tải danh sách người dùng.');
        console.error(error);
      } else {
        setUsers(data || []);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();

    const handleGlobalRefresh = () => loadUsers();
    window.addEventListener('admin-action-refresh', handleGlobalRefresh);
    return () => window.removeEventListener('admin-action-refresh', handleGlobalRefresh);
  }, []);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const handleStatusChange = async (user, newStatus) => {
    const originalUsers = [...users];
    const updatedUsers = users.map(u => u.id === user.id ? { ...u, status: newStatus } : u);
    setUsers(updatedUsers);

    const { error } = await userAPI.updateUserStatus(user.id, newStatus);
    if (error) {
      alert('Lỗi cập nhật: ' + error.message);
      setUsers(originalUsers);
    } else {
      await logAPI.logAdminAction('Thay đổi trạng thái người dùng', `${user.email}: ${user.status} -> ${newStatus}`, 'user');
    }
  };

  const handleRoleChange = async (user, newRole) => {
    const originalUsers = [...users];
    const updatedUsers = users.map(u => u.id === user.id ? { ...u, role: newRole } : u);
    setUsers(updatedUsers);

    const { error } = await userAPI.updateProfile(user.id, { role: newRole });
    if (error) {
      alert('Lỗi cập nhật: ' + error.message);
      setUsers(originalUsers);
    } else {
      await logAPI.logAdminAction('Thay đổi vai trò', `${user.email}: ${user.role} -> ${newRole}`, 'user');
    }
  };

  const filteredUsers = useMemo(() => {
    return users.filter(user => {
      const searchLower = filters.search.toLowerCase();
      return (
        (filters.role === 'all' || user.role === filters.role) &&
        (filters.status === 'all' || user.status === filters.status) &&
        ((user.name || '').toLowerCase().includes(searchLower) ||
         (user.email || '').toLowerCase().includes(searchLower))
      );
    });
  }, [users, filters]);

  const getStatusChip = (status) => {
    const statusMap = {
      active: { label: 'Hoạt động', className: 'status-active' },
      banned: { label: 'Bị cấm', className: 'status-banned' },
    };
    const { label, className } = statusMap[status] || { label: status, className: 'status-inactive' };
    return <span className={`m3-chip ${className}`}>{label}</span>;
  };

  if (loading && users.length === 0) {
    return (
      <div className="user-management-container">
        <div className="management-header">
          <GenericSkeleton width="250px" height="32px" />
        </div>
        <div className="m3-card data-table-card">
          <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <GenericSkeleton width="100%" height="40px" />
            <GenericSkeleton width="100%" height="40px" />
            <GenericSkeleton width="100%" height="40px" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="user-management-container">
      <div className="filter-card">
        <div className="m3-textfield search-box" style={{ flex: 2 }}>
          <input type="search" id="search" name="search" value={filters.search} onChange={handleFilterChange} placeholder="Tìm tên hoặc email..." />
        </div>
        <div className="m3-textfield">
          <select name="role" value={filters.role} onChange={handleFilterChange}>
            <option value="all">Tất cả vai trò</option>
            <option value="user">User</option>
            <option value="mod">Mod</option>
            <option value="admin">Admin</option>
          </select>
        </div>
        <div className="m3-textfield">
          <select name="status" value={filters.status} onChange={handleFilterChange}>
            <option value="all">Tất cả trạng thái</option>
            <option value="active">Hoạt động</option>
            <option value="banned">Bị cấm</option>
          </select>
        </div>
      </div>

      <div className="m3-card data-table-card">
        <table className="m3-data-table">
          <thead>
            <tr>
              <th>Người dùng</th>
              <th>Vai trò</th>
              <th>Trạng thái</th>
              <th>Ngày tham gia</th>
              <th>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.map(user => (
              <tr key={user.id}>
                <td>
                  <div className="user-info-cell">
                    <span className="user-name">{user.name || '[Chưa đặt tên]'}</span>
                    <span className="user-email">{user.email}</span>
                  </div>
                </td>
                <td>
                  <select className="table-inline-select" value={user.role} onChange={(e) => handleRoleChange(user, e.target.value)}>
                    <option value="user">User</option>
                    <option value="mod">Mod</option>
                    <option value="admin">Admin</option>
                  </select>
                </td>
                <td>{getStatusChip(user.status)}</td>
                <td style={{ opacity: 0.6 }}>{new Date(user.created_at).toLocaleDateString('vi-VN')}</td>
                <td>
                  <div className="action-buttons">
                    <select className="table-inline-select" value={user.status} onChange={(e) => handleStatusChange(user, e.target.value)}>
                      <option value="active">Active</option>
                      <option value="banned">Ban</option>
                    </select>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filteredUsers.length === 0 && <div className="no-results">Không tìm thấy người dùng.</div>}
      </div>
    </div>
  );
};

export default UserManagement;
