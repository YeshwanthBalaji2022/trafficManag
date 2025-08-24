import React from "react";

const Navbar: React.FC = () => {
  return (
    <nav className="navbar">
      <div className="logo">Group 18</div>
      <ul className="nav-links">
        <li><a href="#home">Home</a></li>
        <li><a href="#features">Features</a></li>
        <li><a href="#technology">Technology</a></li>
        <li><a href="#demo">Live Demo</a></li>
        <li><a href="#results">Results</a></li>
        <li><a href="#admin">Admin</a></li>
      </ul>
    </nav>
  );
};

export default Navbar;
