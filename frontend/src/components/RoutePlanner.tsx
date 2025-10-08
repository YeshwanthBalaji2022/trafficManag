import React, { useState, useEffect } from 'react';
import './RoutePlanner.css';

const JUNCTIONS = [
  { label: 'Junction 01', value: 'normal_01' },
  { label: 'Junction 02', value: 'normal_02' },
  { label: 'Junction 03', value: 'flipped_03' },
  { label: 'Junction 04', value: 'flipped_04' },
];

const RoutePlanner: React.FC = () => {
  const [start, setStart] = useState(JUNCTIONS[0].value);
  const [end, setEnd] = useState(JUNCTIONS[1].value);
  const [route, setRoute] = useState<string[]>([]);
  const [alerts, setAlerts] = useState<string[]>([]);

  useEffect(() => {
    // Fetch route and alerts from backend (mocked for now)
    // Replace with actual API call
    setRoute([start, '02_', end]);
    setAlerts([
      'Congestion at Junction 02',
      'Accident reported at Junction 05',
    ]);
  }, [start, end]);

  return (
    <div className="route-planner-root">
      <div className="route-planner-panel-glass">
        <h2 className="route-planner-title">Route Planner & Alerts</h2>
        <div className="route-planner-row">
          <label className="route-planner-label">From:</label>
          <select className="route-planner-dropdown" value={start} onChange={e => setStart(e.target.value)}>
            {JUNCTIONS.map(j => (
              <option key={j.value} value={j.value}>{j.label}</option>
            ))}
          </select>
          <label className="route-planner-label">To:</label>
          <select className="route-planner-dropdown" value={end} onChange={e => setEnd(e.target.value)}>
            {JUNCTIONS.map(j => (
              <option key={j.value} value={j.value}>{j.label}</option>
            ))}
          </select>
        </div>
        <div className="route-planner-cards-row">
          <div className="route-planner-card">
            <div className="route-planner-card-title">Optimal Route</div>
            <div className="route-planner-card-value">
              {route.map((j, idx) => (
                <span key={j}>
                  {JUNCTIONS.find(junc => junc.value === j)?.label}
                  {idx < route.length - 1 ? ' → ' : ''}
                </span>
              ))}
            </div>
          </div>
        </div>
        <div className="route-planner-alerts-row">
          <div className="route-planner-alerts-title">Live Alerts</div>
          {alerts.map((alert, idx) => (
            <div key={idx} className="route-planner-alert-card">{alert}</div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default RoutePlanner;
