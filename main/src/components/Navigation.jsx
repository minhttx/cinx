import React, { useState, useEffect, useRef } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useAuth } from "../contexts/AuthContext";
import { getCinXResponse, gatherAIContext } from "../services/ai";
import { aiChatAPI } from "../services/api";
import "../styles/Navigation.css";

const Navigation = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  
  const { user, userProfile, signOut, isAdmin, isMod } = useAuth();
  const navigate = useNavigate();
  const chatEndRef = useRef(null);

  // Auto scroll to bottom of chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  useEffect(() => {
    const handleExternalOpenChat = () => {
      setIsChatOpen(true);
      document.body.style.overflow = 'hidden';
    };

    window.addEventListener('openCinxChat', handleExternalOpenChat);
    return () => window.removeEventListener('openCinxChat', handleExternalOpenChat);
  }, []);

  // Load chat history when chat is opened
  useEffect(() => {
    const loadHistory = async () => {
      if (isChatOpen && user) {
        try {
          const { data } = await aiChatAPI.getChatHistory(user.id);
          if (data && data.length > 0) {
            // Reverse because we fetched descending (latest first)
            const history = [...data].reverse();
            setMessages(history.map(h => ({ 
              role: h.role === 'user' ? 'user' : 'bot', 
              content: h.content 
            })));
          }
        } catch (err) {
          console.error("Failed to load chat history:", err);
        }
      }
    };
    loadHistory();
  }, [isChatOpen, user]);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
    document.body.style.overflow = !isMenuOpen ? 'hidden' : 'auto';
  };

  const toggleChat = () => {
    setIsChatOpen(!isChatOpen);
    document.body.style.overflow = !isChatOpen ? 'hidden' : 'auto';
  };

  const closeMenu = () => {
    setIsMenuOpen(false);
    document.body.style.overflow = 'auto';
  };

  const closeChat = () => {
    setIsChatOpen(false);
    document.body.style.overflow = 'auto';
  };

  const handleLogout = async () => {
    await signOut();
    closeMenu();
    navigate('/');
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputText.trim() || isTyping) return;

    const userMsg = inputText.trim();
    setInputText("");
    
    // 1. Add user message to UI
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setIsTyping(true);

    // Save user message to DB
    if (user) {
      aiChatAPI.saveChatMessage(user.id, 'user', userMsg);
    }

    try {
      // 2. Gather context for AI
      const context = await gatherAIContext(user, userProfile);
      
      // 3. Get AI Response with Streaming
      let hasStarted = false;
      const response = await getCinXResponse(userMsg, context, (currentText) => {
        if (!hasStarted) {
          setIsTyping(false);
          setMessages(prev => [...prev, { role: 'bot', content: currentText }]);
          hasStarted = true;
        } else {
          setMessages(prev => {
            const newMsgs = [...prev];
            newMsgs[newMsgs.length - 1].content = currentText;
            return newMsgs;
          });
        }
      });
      
      if (response.error) throw new Error(response.error);

      // 4. Save final bot response to DB
      if (user && response.content) {
        aiChatAPI.saveChatMessage(user.id, 'assistant', response.content);
      }
    } catch (err) {
      setIsTyping(false);
      setMessages(prev => [...prev, { role: 'bot', content: "Xin lỗi, tôi đang gặp chút trục trặc kỹ thuật. Bạn vui lòng thử lại sau nhé! 🛠️" }]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <>
      <div 
        className={`nav-global-overlay ${(isMenuOpen || isChatOpen) ? 'open' : ''}`} 
        onClick={() => { closeMenu(); closeChat(); }}
      />

      <nav className="nav-rail">
        <div className="nav-group">
          <NavLink to="/" className="nav-item" title="Trang chủ">
            <div className="nav-icon-wrapper"><span className="material-symbols-outlined">home</span></div>
            <span className="nav-label">Home</span>
          </NavLink>

          <NavLink to="/booking" className="nav-item" title="Phim">
            <div className="nav-icon-wrapper"><span className="material-symbols-outlined">movie</span></div>
            <span className="nav-label">Phim</span>
          </NavLink>

          <NavLink to="/upcoming" className="nav-item" title="Sắp chiếu">
            <div className="nav-icon-wrapper"><span className="material-symbols-outlined">calendar_month</span></div>
            <span className="nav-label">Sắp chiếu</span>
          </NavLink>

          <div 
            className={`nav-item cinx-nav-item ${isChatOpen ? 'active' : ''}`} 
            title="CinX (Trợ lý AI)"
            onClick={toggleChat}
          >
            <div className="cinx-pulse-wrapper">
              <div className="pulse-ring"></div>
              <div className="pulse-ring"></div>
              <div className="nav-icon-wrapper cinx-icon-main">
                <span className="material-symbols-outlined">robot_2</span>
              </div>
            </div>
          </div>

          <NavLink to="/news" className="nav-item" title="Tin tức">
            <div className="nav-icon-wrapper"><span className="material-symbols-outlined">newspaper</span></div>
            <span className="nav-label">Tin tức</span>
          </NavLink>

          <NavLink to="/promotions" className="nav-item" title="Khuyến mãi">
            <div className="nav-icon-wrapper"><span className="material-symbols-outlined">sell</span></div>
            <span className="nav-label">K.Mãi</span>
          </NavLink>

          <NavLink to="/my-tickets" className="nav-item" title="Vé của tôi">
            <div className="nav-icon-wrapper"><span className="material-symbols-outlined">local_activity</span></div>
            <span className="nav-label">Vé</span>
          </NavLink>
        </div>
      </nav>

      <div className={`cinx-chat-window ${isChatOpen ? 'open' : ''}`}>
        <div className="chat-header">
          <div className="chat-bot-identity">
            <div className="chat-bot-avatar"><span className="material-symbols-outlined">robot_2</span></div>
            <div className="chat-bot-info">
              <span className="chat-bot-name">CinX Assistant</span>
              <span className="chat-bot-status">Online</span>
            </div>
          </div>
          <button className="chat-close-btn" onClick={closeChat}><span className="material-symbols-outlined">close</span></button>
        </div>

        <div className="chat-messages">
          {messages.length === 0 && (
            <div className="chat-welcome-message">
              <span className="material-symbols-outlined welcome-icon" style={{fontSize: '48px', color: 'var(--md-sys-color-primary)', marginBottom: '16px'}}>smart_toy</span>
              <h3>Xin chào! Tôi là CinX</h3>
              <p>Tôi có thể giúp bạn tìm phim, xem suất chiếu hoặc tư vấn chỗ ngồi phù hợp nhất! ✨</p>
            </div>
          )}
          
          {messages.map((msg, idx) => (
            <div key={idx} className={`message-row ${msg.role}`}>
              <div className="message-bubble">
                {msg.role === 'bot' ? (
                  <ReactMarkdown 
                    remarkPlugins={[remarkGfm]}
                    urlTransform={(uri) => {
                      if (uri.startsWith('movie:') || uri.startsWith('showtime:')) return uri;
                      return uri;
                    }}
                    components={{
                      a: ({ node, ...props }) => {
                        const isMovieLink = props.href?.includes('movie:');
                        const isShowtimeLink = props.href?.includes('showtime:');
                        
                        if (isMovieLink || isShowtimeLink) {
                          return (
                            <a 
                              href="#" 
                              className="chat-ai-link"
                              style={{ 
                                color: 'var(--md-sys-color-primary)', 
                                fontWeight: 'bold', 
                                textDecoration: 'underline',
                                cursor: 'pointer'
                              }}
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                closeChat();
                                
                                if (isMovieLink) {
                                  const movieId = props.href.split('movie:')[1].replace(/\//g, '').trim();
                                  if (window.location.pathname === '/booking') {
                                    window.dispatchEvent(new CustomEvent('openMovieInfo', { detail: { movieId } }));
                                  } else {
                                    navigate(`/booking?movie=${movieId}&info=true`);
                                  }
                                } else if (isShowtimeLink) {
                                  // format: showtime:SHOWTIME_ID:MOVIE_ID
                                  const parts = props.href.split('showtime:')[1].split(':');
                                  const showtimeId = parts[0];
                                  const movieId = parts[1];
                                  
                                  if (window.location.pathname === '/booking') {
                                    window.dispatchEvent(new CustomEvent('openShowtimeBooking', { 
                                      detail: { showtimeId, movieId } 
                                    }));
                                  } else {
                                    navigate(`/booking?movie=${movieId}&showtime=${showtimeId}`);
                                  }
                                }
                              }}
                            >
                              {props.children}
                            </a>
                          );
                        }
                        return <a {...props} target="_blank" rel="noopener noreferrer" />;
                      }
                    }}
                  >
                    {msg.content}
                  </ReactMarkdown>
                ) : (
                  msg.content
                )}
              </div>
            </div>
          ))}

          {isTyping && (
            <div className="message-row bot">
              <div className="message-bubble">
                <div className="typing-indicator">
                  <div className="typing-dot"></div>
                  <div className="typing-dot"></div>
                  <div className="typing-dot"></div>
                </div>
              </div>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        <form className="chat-input-area" onSubmit={handleSendMessage}>
          <div className="chat-input-wrapper">
            <input 
              type="text" 
              placeholder="Hỏi CinX về phim, suất chiếu..." 
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              disabled={isTyping}
            />
            <button type="submit" className="chat-send-btn" disabled={!inputText.trim() || isTyping}>
              <span className="material-symbols-outlined">send</span>
            </button>
          </div>
        </form>
      </div>

      <nav className="mobile-bottom-bar">
        <NavLink to="/" className="mobile-nav-item" onClick={closeMenu}>
          <span className="material-symbols-outlined">home</span>
          <span className="mobile-label">Home</span>
        </NavLink>
        <NavLink to="/booking" className="mobile-nav-item" onClick={closeMenu}>
          <span className="material-symbols-outlined">movie</span>
          <span className="mobile-label">Phim</span>
        </NavLink>
        <div className="mobile-nav-item cinx-mobile-nav-item" onClick={toggleChat}>
          <div className="cinx-pulse-wrapper mobile-cinx-pulse">
            <div className="pulse-ring"></div><div className="pulse-ring"></div>
            <div className="nav-icon-wrapper cinx-icon-main"><span className="material-symbols-outlined">robot_2</span></div>
          </div>
        </div>
        <NavLink to="/my-tickets" className="mobile-nav-item" onClick={closeMenu}>
          <span className="material-symbols-outlined">local_activity</span>
          <span className="mobile-label">Vé</span>
        </NavLink>
        <button className="mobile-nav-item" onClick={toggleMenu}>
          <span className="material-symbols-outlined">{isMenuOpen ? 'close' : 'menu'}</span>
          <span className="mobile-label">Menu</span>
        </button>
      </nav>

      <div className={`full-screen-menu ${isMenuOpen ? 'open' : ''}`}>
        <div className="menu-header">
          <h2 className="menu-title">Menu</h2>
          <button className="close-menu-btn" onClick={closeMenu}><span className="material-symbols-outlined">close</span></button>
        </div>
        <div className="menu-content">
          <div className="menu-section">
            <h3 className="menu-section-title">Khám phá</h3>
            {isMod() && (
              <NavLink to="/checkin" className="menu-link" onClick={closeMenu} style={{color: 'var(--md-sys-color-primary)', fontWeight: 'bold'}}>
                <span className="material-symbols-outlined">qr_code_scanner</span>Quét mã Check-in
              </NavLink>
            )}
            <NavLink to="/" className="menu-link" onClick={closeMenu}><span className="material-symbols-outlined">home</span>Trang chủ</NavLink>
            <NavLink to="/booking" className="menu-link" onClick={closeMenu}><span className="material-symbols-outlined">movie</span>Phim</NavLink>
            <NavLink to="/upcoming" className="menu-link" onClick={closeMenu}><span className="material-symbols-outlined">calendar_month</span>Phim sắp chiếu</NavLink>
            <NavLink to="/news" className="menu-link" onClick={closeMenu}><span className="material-symbols-outlined">newspaper</span>Tin tức</NavLink>
            <NavLink to="/promotions" className="menu-link" onClick={closeMenu}><span className="material-symbols-outlined">sell</span>Khuyến mãi</NavLink>
            <button className="menu-link cinx-mobile-btn" onClick={() => { closeMenu(); toggleChat(); }}><span className="material-symbols-outlined">robot_2</span>CinX (Trợ lý AI)</button>
          </div>
          <div className="menu-section">
            <h3 className="menu-section-title">Tài khoản</h3>
            {user ? (
              <>
                <NavLink to="/profile" className="menu-link" onClick={closeMenu}><span className="material-symbols-outlined">person</span>Hồ sơ</NavLink>
                <NavLink to="/my-tickets" className="menu-link" onClick={closeMenu}><span className="material-symbols-outlined">local_activity</span>Vé của tôi</NavLink>
                {isAdmin() && (
                  <a href="/admin" className="menu-link" target="_blank" rel="noopener noreferrer" onClick={closeMenu}>
                    <span className="material-symbols-outlined">shield_person</span>Quản trị
                  </a>
                )}
                <button className="menu-link logout-btn" onClick={handleLogout}><span className="material-symbols-outlined">logout</span>Đăng xuất</button>
              </>
            ) : (
              <NavLink to="/login" className="menu-link login-btn" onClick={closeMenu}><span className="material-symbols-outlined">login</span>Đăng nhập / Đăng ký</NavLink>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default Navigation;
