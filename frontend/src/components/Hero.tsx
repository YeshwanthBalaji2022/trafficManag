import React from "react";

const Hero: React.FC = () => {
  return (
    <section id="home" className="hero">
      <div className="hero-content">
        <h1>Traffic Optimizer</h1>
        <p>Revolutionizing Urban Mobility with Reinforcement Learning</p>
        <p>
          Dynamic traffic light control system that adapts in real-time to reduce
          congestion and optimize traffic flow using advanced AI algorithms.
        </p>
        <a href="#demo" className="cta-button">View Live Demo</a>
      </div>

      {/* Road + cars */}
      <div className="road-container">
        <div className="road">
          <div className="car car1"></div>
          <div className="car car2"></div>
          <div className="car car3"></div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
