import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import '../styles/LoginPage.css';

const LoginPage = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({ 
    email: '', 
    password: '', 
    name: '', 
    confirmPassword: '',
    birth_year: '' 
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const navigate = useNavigate();
  const location = useLocation();
  const { signIn, signUp, user } = useAuth();

  useEffect(() => {
    if (user) {
      const from = location.state?.from || '/';
      // If 'from' is an object (like from ProtectedRoute), tryna get pathname
      const target = typeof from === 'string' ? from : from.pathname || '/';
      navigate(target, { replace: true });
    }
  }, [user, navigate, location]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (isLogin) {
        const { error } = await signIn(formData.email, formData.password);
        if (error) throw error;
      } else {
        if (formData.password !== formData.confirmPassword) {
          throw new Error('Mật khẩu xác nhận không khớp.');
        }
        const { error } = await signUp(formData.email, formData.password, { 
          name: formData.name,
          birth_year: formData.birth_year
        });
        if (error) throw error;
        alert('Đăng ký thành công!');
        setIsLogin(true);
      }
    } catch (err) {
      let friendlyError = err.message || 'Đã có lỗi xảy ra.';
      if (err.message === 'User already registered') {
        friendlyError = 'Email đã được đăng ký!';
      }
      setError(friendlyError);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-overlay-container">
      <div className="login-card animate-fade-in">
        <button className="login-close-btn" onClick={() => navigate(-1)} title="Đóng">
          <span className="material-symbols-outlined">close</span>
        </button>

        <div className="login-header">
          <div className="login-logo">
            <span className="material-symbols-outlined">movie</span>
            <h1>CinX</h1>
          </div>
          <h2>{isLogin ? 'Chào bạn!' : 'Tạo tài khoản mới'}</h2>
          <p>{isLogin ? 'Đăng nhập để tiếp tục trải nghiệm' : 'Vui lòng điền thông tin để đăng ký'}</p>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          {!isLogin && (
            <div className="m3-textfield-compact">
              <input type="text" name="name" value={formData.name} onChange={handleInputChange} required placeholder="Họ và tên" />
            </div>
          )}
          
          <div className="m3-textfield-compact">
            <input type="email" name="email" value={formData.email} onChange={handleInputChange} required placeholder="Email" />
          </div>

          {!isLogin && (
            <div className="m3-textfield-compact">
              <input type="number" name="birth_year" value={formData.birth_year} onChange={handleInputChange} required placeholder="Năm sinh" min="1900" max={new Date().getFullYear()} />
            </div>
          )}

          <div className="m3-textfield-compact">
            <input type="password" name="password" value={formData.password} onChange={handleInputChange} required placeholder="Mật khẩu" />
          </div>

          {!isLogin && (
            <div className="m3-textfield-compact">
              <input type="password" name="confirmPassword" value={formData.confirmPassword} onChange={handleInputChange} required placeholder="Xác nhận mật khẩu" />
            </div>
          )}

          {error && <div className="login-error-box">{error}</div>}

          <button type="submit" className="m3-btn m3-btn-filled login-submit-btn" disabled={loading}>
            {loading ? <span className="loading-spinner-sm"></span> : (isLogin ? 'Đăng nhập' : 'Đăng ký ngay')}
          </button>
        </form>

        <div className="login-toggle-footer">
          <span>{isLogin ? 'Chưa có tài khoản?' : 'Đã có tài khoản?'}</span>
          <button className="toggle-btn" onClick={() => setIsLogin(!isLogin)}>
            {isLogin ? 'Đăng ký' : 'Đăng nhập'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
