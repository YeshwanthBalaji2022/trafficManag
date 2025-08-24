import React from "react";

const Features: React.FC = () => {
  return (
    <section id="features" className="section">
      <div className="features">
        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon">🚦</div>
            <h3>Dynamic Signal Control</h3>
            <p>AI-powered traffic lights that adapt in real-time...</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">🧠</div>
            <h3>Reinforcement Learning</h3>
            <p>Advanced RL algorithms continuously learn...</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">📊</div>
            <h3>Predictive Analytics</h3>
            <p>Machine learning models predict traffic patterns...</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">🗺️</div>
            <h3>Dynamic Routing</h3>
            <p>Intelligent vehicle routing system suggests...</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">⚡</div>
            <h3>Real-time Optimization</h3>
            <p>Instant response to changing traffic conditions...</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">🎯</div>
            <h3>SUMO Integration</h3>
            <p>Rigorously tested using SUMO traffic simulation...</p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Features;
