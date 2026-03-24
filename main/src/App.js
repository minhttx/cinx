import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Provider } from 'react-redux';
import { store } from './redux/configStore';
import { AuthProvider } from './contexts/AuthContext';
import { ContentProvider } from './contexts/ContentContext';

import MainLayout from './layouts/MainLayout';
import HomePage from './pages/HomePage';
import BookingPage from './pages/BookingPage';
import UserProfile from './pages/UserProfile';
import AdminDashboard from './pages/AdminDashboard';
import LoginPage from './pages/LoginPage';
import NewsPage from './pages/NewsPage';
import PromotionsPage from './pages/PromotionsPage';
import SearchPage from './pages/SearchPage';
import MovieDetails from './pages/MovieDetails';
import UpcomingPage from './pages/UpcomingPage';
import MyTicketsPage from './pages/MyTicketsPage';
import BookingSuccess from './pages/BookingSuccess';
import BookingCallback from './pages/BookingCallback';
import CheckinScanner from './pages/CheckinScanner';
import ProtectedRoute from './components/ProtectedRoute';
import BookingGuard from './components/BookingGuard';

import './App.css';

function App() {
  const globalBgStyle = {
    backgroundImage: `linear-gradient(rgba(30, 24, 20, 0.92), rgba(30, 24, 20, 0.92)), url('${process.env.PUBLIC_URL}/img/hero-bg.jpg')`,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    backgroundAttachment: 'fixed',
    backgroundRepeat: 'no-repeat',
    minHeight: '100vh'
  };

  return (
    <Provider store={store}>
      <AuthProvider>
        <ContentProvider>
          <Router>
            <BookingGuard>
              <div className="App" style={globalBgStyle}>
                <Routes>
                  {/* Main app routes with layout */}
                  <Route path="/" element={<MainLayout />}>
                    <Route index element={<HomePage />} />
                    <Route path="login" element={<LoginPage />} />
                    <Route path="booking" element={<BookingPage />} />
                    <Route path="profile" element={
                      <ProtectedRoute>
                        <UserProfile />
                      </ProtectedRoute>
                    } />
                    <Route path="my-tickets" element={
                      <ProtectedRoute>
                        <MyTicketsPage />
                      </ProtectedRoute>
                    } />
                    <Route path="movie/:id" element={<MovieDetails />} />
                    <Route path="upcoming" element={<UpcomingPage />} />
                    <Route path="search" element={<SearchPage />} />
                    <Route path="news" element={<NewsPage />} />
                    <Route path="promotions" element={<PromotionsPage />} />
                    <Route path="booking-success" element={<BookingSuccess />} />
                    <Route path="booking/callback" element={
                      <ProtectedRoute>
                        <BookingCallback />
                      </ProtectedRoute>
                    } />
                  </Route>

                  {/* STANDALONE ADMIN ROUTE (Separate from MainLayout) */}
                  <Route path="/admin" element={
                    <ProtectedRoute allowedRoles={['admin']}>
                      <AdminDashboard />
                    </ProtectedRoute>
                  } />

                  {/* STANDALONE CHECKIN APP ROUTE */}
                  <Route path="/checkin" element={
                    <ProtectedRoute allowedRoles={['admin', 'mod']}>
                      <CheckinScanner />
                    </ProtectedRoute>
                  } />
                </Routes>
              </div>
            </BookingGuard>
          </Router>
        </ContentProvider>
      </AuthProvider>
    </Provider>
  );
}

export default App;
