import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import '../styles/ProfileButton.css';

const ProfileButton = () => {
  const { user, userProfile, signOut, isAdmin, isMod } = useAuth();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const buttonRef = useRef(null);
  const navigate = useNavigate();

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target)
      ) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleButtonClick = () => {
    if (!user) {
      // Not logged in - navigate to login
      navigate('/login');
    } else {
      // Logged in - toggle dropdown
      setIsDropdownOpen(!isDropdownOpen);
    }
  };

  const handleMenuItemClick = (action) => {
    setIsDropdownOpen(false);
    
    switch (action) {
      case 'profile':
        navigate('/profile');
        break;
      case 'checkin':
        navigate('/checkin');
        break;
      case 'admin':
        window.open('/admin', '_blank');
        break;
      case 'logout':
        signOut();
        break;
      default:
        break;
    }
  };

  // Get avatar source - use user avatar if available, otherwise default
  const getAvatarSrc = () => {
    if (user?.user_metadata?.avatar_url) {
      return user.user_metadata.avatar_url;
    }
    // Default avatar - Material Symbols person icon as data URL
    return `data:image/svg+xml,${encodeURIComponent(`
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="#666">
        <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
      </svg>
    `)}`;
  };

  // Get display name
  const getDisplayName = () => {
    if (!user) {
      return 'Đăng nhập/Đăng ký';
    }
    
    // Priority: userProfile name > user metadata name > email
    let name = 'Người dùng';
    
    if (userProfile?.name) {
      name = userProfile.name;
    } else if (user.user_metadata?.name || user.user_metadata?.full_name) {
      name = user.user_metadata.name || user.user_metadata.full_name;
    } else if (user.email) {
      // Fallback to first part of email
      name = user.email.split('@')[0];
    }
    
    return `Xin chào, ${name}!`;
  };

  // Check if user is admin
  const userIsAdmin = isAdmin();
  const userIsMod = isMod();

  return (
    <div className="profile-button-container">
      <button 
        ref={buttonRef}
        className="profile-button"
        onClick={handleButtonClick}
        aria-label={user ? 'Profile menu' : 'Login'}
      >
        <div className="profile-avatar">
          <img 
            src={getAvatarSrc()} 
            alt="Avatar"
            className="avatar-image"
          />
        </div>
      </button>

      {/* Dropdown Menu - only show when logged in */}
      {user && isDropdownOpen && (
        <div ref={dropdownRef} className="profile-dropdown">
          <div className="dropdown-arrow"></div>
          <div className="dropdown-content">
            <button
              className="dropdown-item"
              onClick={() => handleMenuItemClick('profile')}
            >
              <span className="material-symbols-outlined">person</span>
              <span>Hồ sơ</span>
            </button>

            {userIsMod && (
              <button
                className="dropdown-item"
                onClick={() => handleMenuItemClick('checkin')}
              >
                <span className="material-symbols-outlined">qr_code_scanner</span>
                <span>Check-in Scanner</span>
              </button>
            )}

            {userIsAdmin && (
              <button
                className="dropdown-item"
                onClick={() => handleMenuItemClick('admin')}
              >
                <span className="material-symbols-outlined">shield_person</span>
                <span>Quản trị</span>
              </button>
            )}
            
            <div className="dropdown-divider"></div>
            
            <button
              className="dropdown-item logout-item"
              onClick={() => handleMenuItemClick('logout')}
            >
              <span className="material-symbols-outlined">logout</span>
              <span>Đăng xuất</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfileButton;