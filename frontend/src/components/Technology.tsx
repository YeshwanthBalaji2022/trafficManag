import React from "react";

const Technology: React.FC = () => {
  return (
    <section id="technology" className="section">
      <div className="tech-stack">
        <h2 style={{ textAlign: "center", marginBottom: "2rem", fontSize: "2.5rem" }}>
          Technology Stack
        </h2>
        <div className="tech-grid">
          <div className="tech-item"><h3>🤖 Deep Q-Learning</h3><p>Neural networks for optimal action selection</p></div>
          <div className="tech-item"><h3>🐍 Python & PyTorch</h3><p>Robust ML framework</p></div>
          <div className="tech-item"><h3>🚗 SUMO Simulation</h3><p>Industry-standard traffic simulation</p></div>
          <div className="tech-item"><h3>📡 Real-time Data</h3><p>IoT sensors and traffic cameras</p></div>
          <div className="tech-item"><h3>☁️ Cloud Computing</h3><p>Scalable infrastructure</p></div>
          <div className="tech-item"><h3>📈 Analytics Dashboard</h3><p>Comprehensive monitoring</p></div>
        </div>
      </div>
    </section>
  );
};

export default Technology;
