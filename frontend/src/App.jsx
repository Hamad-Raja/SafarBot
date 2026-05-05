import React, { useEffect } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';

import Landing from './pages/Landing';
import Home from './pages/Home';
import RoutesPage from './pages/RoutesPage';
import BookingPage from './pages/BookingPage';
import PaymentPage from './pages/PaymentPage';
import ProfilePage from './pages/ProfilePage';
import ContactPage from './pages/ContactPage';
import AboutPage from './pages/AboutPage';
import AdminDashboard from './pages/AdminDashboard';
import ProviderDashboard from './pages/ProviderDashboard';
import NotFound from './pages/NotFound';

import MyBookingsPage from './pages/MyBookingsPage';
import PaymentSuccessPage from './pages/PaymentSuccessPage';
import PaymentFailedPage from './pages/PaymentFailedPage';
import ProviderRoutesPage from './pages/ProviderRoutesPage';
import ProviderFraudAlertsPage from './pages/ProviderFraudAlertsPage';
import AdminUsersPage from './pages/AdminUsersPage';
import AdminProvidersPage from './pages/AdminProvidersPage';
import AdminReportsPage from './pages/AdminReportsPage';

import ProtectedRoute from './components/ProtectedRoute';

const ScrollToTop = () => {
  const { pathname, search } = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  }, [pathname, search]);

  return null;
};

const App = () => {
  return (
    <>
      <ScrollToTop />
      <Routes>
        {/* Public */}
        <Route path="/" element={<Landing />} />
        <Route path="/signin" element={<Landing />} />
        <Route path="/register" element={<Landing />} />
        <Route path="/auth" element={<Landing />} />
        <Route path="/provider/apply" element={<Landing />} />

        {/* Authenticated user routes */}
        <Route element={<ProtectedRoute />}>
          <Route path="/home" element={<Home />} />
          {/* Search + booking flow */}
          <Route path="/search" element={<Home />} />
          <Route path="/results" element={<RoutesPage />} />
          <Route path="/routes" element={<RoutesPage />} />
          <Route path="/booking/:routeId" element={<BookingPage />} />
          {/* Alias for spec */}
          <Route path="/seats" element={<BookingPage />} />
          <Route path="/seats/:routeId" element={<BookingPage />} />
          <Route path="/payment" element={<PaymentPage />} />
          <Route path="/payment-success" element={<PaymentSuccessPage />} />
          <Route path="/payment-failed" element={<PaymentFailedPage />} />

          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/my-bookings" element={<MyBookingsPage />} />

          <Route path="/contact" element={<ContactPage />} />
          <Route path="/about" element={<AboutPage />} />
        </Route>

        {/* Provider routes */}
        <Route element={<ProtectedRoute allowedRoles={['provider']} />}>
          <Route path="/provider/dashboard" element={<ProviderDashboard />} />
          <Route path="/provider/routes" element={<ProviderRoutesPage />} />
          <Route path="/provider/fraud-alerts" element={<ProviderFraudAlertsPage />} />
        </Route>

        {/* Admin routes */}
        <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
          <Route path="/admin/users" element={<AdminUsersPage />} />
          <Route path="/admin/providers" element={<AdminProvidersPage />} />
          <Route path="/admin/reports" element={<AdminReportsPage />} />
        </Route>

        {/* Fallback */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </>
  );
};

export default App;