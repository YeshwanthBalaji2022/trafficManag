import React, { useEffect } from "react";
import "./styles.css";
import { BrowserRouter as Router, Routes, Route, useLocation, Navigate } from "react-router-dom";
import Navbar from "./components/Navbar";
import Hero from "./components/Hero";
import Features from "./components/Features";
import Technology from "./components/Technology";
import Results from "./components/Results";
import Footer from "./components/Footer";
import Progress from "./components/Progress";
import Login from "./components/Login";
import AdminPage from "./components/AdminPage";
import EmergencyRequest from "./components/EmergencyRequest";
import EmergencyRequests from "./components/EmergencyRequests";
import MyRequests from "./components/MyRequests";
import PublicDashboard from "./components/PublicDashboard";
import RoutePlanner from "./components/RoutePlanner";
import Analytics from "./components/Analytics";
// import JunctionSimulation from "./components/JunctionSimulation";

function ScrollToSection() {
  const location = useLocation();
  useEffect(() => {
    if (location.pathname === "/" && location.state && location.state.section) {
      const el = document.getElementById(location.state.section);
      if (el) {
        el.scrollIntoView({ behavior: "smooth" });
      }
    }
  }, [location]);
  return null;
}

const isAuthenticated = () => {
  const token = localStorage.getItem('jwt_token');
  if (!token) return false;
  
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    // Check if token has expired (exp is in seconds, Date.now() is in milliseconds)
    const currentTime = Math.floor(Date.now() / 1000);
    console.log('Token exp:', payload.exp, 'Current time:', currentTime, 'Valid:', payload.exp > currentTime);
    return payload.exp > currentTime;
  } catch (error) {
    console.error('Token validation error:', error);
    return false;
  }
};

const isAdmin = () => {
  const token = localStorage.getItem('jwt_token');
  if (!token) return false;
  
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    console.log('Token payload:', payload, 'Is admin:', payload.sub === 'admin');
    return payload.sub === 'admin';
  } catch {
    return false;
  }
};

const ProtectedRoute: React.FC<{ children: React.ReactNode; adminOnly?: boolean }> = ({ children, adminOnly = false }) => {
  const authenticated = isAuthenticated();
  const admin = isAdmin();
  
  console.log('ProtectedRoute check - Authenticated:', authenticated, 'Admin:', admin, 'AdminOnly:', adminOnly);
  
  if (!authenticated) {
    console.log('Redirecting to login - not authenticated');
    return <Navigate to="/login" replace />;
  }
  
  if (adminOnly && !admin) {
    console.log('Redirecting to login - admin required but user is not admin');
    return <Navigate to="/login" replace />;
  }
  
  console.log('Access granted');
  return <>{children}</>;
};

const UserDashboard: React.FC = () => {
  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0a', padding: '2rem 0' }}>
      <PublicDashboard />
      <RoutePlanner />
      <Analytics />
    </div>
  );
};

const CreateEmergencyPage: React.FC = () => {
  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0a', padding: '2rem 0' }}>
      <EmergencyRequest />
    </div>
  );
};

const MyRequestsPage: React.FC = () => {
  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0a', padding: '2rem 0' }}>
      <MyRequests />
    </div>
  );
};


const App: React.FC = () => {
  return (
    <Router>
      <ScrollToSection />
      <Navbar />
      <Routes>
        <Route path="/" element={
          <>
            <Hero />
            <Features />
            <Technology />
            <Results />
            <Progress />
            <Footer />
          </>
        } />
        <Route path="/login" element={<Login />} />
        <Route path="/admin" element={
          <ProtectedRoute adminOnly>
            <AdminPage />
          </ProtectedRoute>
        } />
        <Route path="/admin/emergency-requests" element={
          <ProtectedRoute adminOnly>
            <EmergencyRequests />
          </ProtectedRoute>
        } />
        <Route path="/admin/analytics" element={
          <ProtectedRoute adminOnly>
            <Analytics />
          </ProtectedRoute>
        } />
        <Route path="/user" element={
          <ProtectedRoute>
            <UserDashboard />
          </ProtectedRoute>
        } />
        <Route path="/user/create-request" element={
          <ProtectedRoute>
            <CreateEmergencyPage />
          </ProtectedRoute>
        } />
        <Route path="/user/my-requests" element={
          <ProtectedRoute>
            <MyRequestsPage />
          </ProtectedRoute>
        } />
      </Routes>
    </Router>
  );
};

export default App;
