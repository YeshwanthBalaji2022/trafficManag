import React from "react";
import { Link, useNavigate } from "react-router-dom";


const Navbar: React.FC = () => {
  const navigate = useNavigate();
  const isAuth = !!localStorage.getItem("jwt_token");
  let isAdmin = false;
  if (isAuth) {
    try {
      const token = localStorage.getItem("jwt_token");
      if (token) {
        const payload = JSON.parse(atob(token.split('.')[1]));
        isAdmin = payload.sub === 'admin';
      }
    } catch {}
  }
  const handleLogout = () => {
    localStorage.removeItem("jwt_token");
    navigate("/login");
  };
  return (
    <nav className="navbar">
      <div className="logo">Group 18</div>
      <ul className="nav-links">
        <li><Link to="/">Home</Link></li>
        {!isAuth && <li><Link to="/login">Login</Link></li>}
        {isAuth && !isAdmin && <li><Link to="/user">User Dashboard</Link></li>}
        {isAuth && !isAdmin && <li><Link to="/user/create-request">Create Emergency</Link></li>}
        {isAuth && !isAdmin && <li><Link to="/user/my-requests">My Requests</Link></li>}
        {isAuth && isAdmin && <li><Link to="/admin">Traffic Monitor</Link></li>}
        {isAuth && isAdmin && <li><Link to="/admin/emergency-requests">Emergency Requests</Link></li>}
        {isAuth && isAdmin && <li><Link to="/admin/analytics">Junction Analytics</Link></li>}
        {isAuth && (
          <li><button className="nav-logout-btn" onClick={handleLogout}>Logout</button></li>
        )}
      </ul>
    </nav>
  );
};

export default Navbar;
