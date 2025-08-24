import React from "react";

const Results: React.FC = () => {
  return (
    <section id="results" className="section">
      <div className="features">
        <h2 style={{ textAlign: "center", marginBottom: "2rem", fontSize: "2.5rem", color: "#333" }}>
          Intended Project Results
        </h2>
        <div style={{ padding: "2rem" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "2rem" }}>
            <div className="stat-card red">
              <h3>Traffic Flow Improvement</h3>
              <p>Increase in overall traffic throughput...</p>
            </div>
            <div className="stat-card orange">
              <h3>Wait Time Reduction</h3>
              <p>Decrease in average vehicle waiting time...</p>
            </div>
            <div className="stat-card green">
              <h3>Fuel Savings</h3>
              <p>Reduction in fuel consumption...</p>
            </div>
          </div>

          <div style={{ marginTop: "3rem", padding: "2rem", background: "#f8f9fa", borderRadius: "15px" }}>
            <h3 style={{ color: "#333", marginBottom: "1rem" }}>Key Achievements</h3>
            <ul style={{ color: "#666", lineHeight: "1.8" }}>
              <li>Aim to implement Deep Q-Learning...</li>
              <li>Plan to integrate real-time traffic data...</li>
              <li>Intend to develop adaptive routing...</li>
              <li>Expect to create a monitoring dashboard...</li>
              <li>Envision achieving scalable solution...</li>
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Results;
