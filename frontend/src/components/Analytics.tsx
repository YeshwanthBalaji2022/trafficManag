import React, { useEffect, useState, useRef } from 'react';
import './Analytics.css';

const JUNCTIONS = [
  { label: 'Junction 01', value: '01_' },
  { label: 'Junction 02', value: '02_' },
  { label: 'Junction 05', value: '05_' },
  { label: 'Rifatslu', value: 'rifatuslu_' },
];
const DIRECTIONS = ['north', 'east', 'south', 'west'];

const getVehicleCountUrl = (junction: string, direction: string) =>
  `http://localhost:8001/junction_vehicle_count/${direction}?junction=${junction}`;

const Analytics: React.FC = () => {
  const [selectedJunction, setSelectedJunction] = useState(JUNCTIONS[0].value);
  const [vehicleCounts, setVehicleCounts] = useState<{ [key: string]: number }>({});
  const [history, setHistory] = useState<{ [key: string]: number[] }>({});

  const eventSourcesRef = useRef<{ [key: string]: EventSource | null }>({});

  // Setup SSE for each direction
  useEffect(() => {
    Object.values(eventSourcesRef.current).forEach(es => es && es.close());
    eventSourcesRef.current = {};
    DIRECTIONS.forEach(dir => {
      const url = getVehicleCountUrl(selectedJunction, dir);
      const es = new window.EventSource(url);
      eventSourcesRef.current[dir] = es;
      es.onmessage = (event: MessageEvent) => {
        try {
          const data = JSON.parse(event.data);
          setVehicleCounts(prev => ({ ...prev, [dir]: data.vehicles }));
          setHistory(prev => ({
            ...prev,
            [dir]: [...(prev[dir] || []), data.vehicles].slice(-60), // last 60 samples
          }));
        } catch (e) {}
      };
      es.onerror = () => es.close();
    });
    return () => {
      Object.values(eventSourcesRef.current).forEach(es => es && es.close());
      eventSourcesRef.current = {};
    };
  }, [selectedJunction]);

  // Analytics calculations
  const totalVehicles = DIRECTIONS.reduce((sum, dir) => sum + (vehicleCounts[dir] || 0), 0);
  const avgPerMinute = DIRECTIONS.reduce((sum, dir) => {
    const arr = history[dir] || [];
    return sum + (arr.length > 0 ? (arr[arr.length - 1] - arr[0]) : 0);
  }, 0);
  const peakDirection = DIRECTIONS.reduce((peak, dir) =>
    (vehicleCounts[dir] || 0) > (vehicleCounts[peak] || 0) ? dir : peak, DIRECTIONS[0]
  );

  return (
    <div className="analytics-root">
      <div className="analytics-panel-glass">
        <h2 className="analytics-title">Junction Analytics</h2>
        <div className="analytics-row" style={{ marginBottom: 32 }}>
          <label className="analytics-label" htmlFor="junction-select">Junction:</label>
          <select
            id="junction-select"
            className="analytics-dropdown"
            value={selectedJunction}
            onChange={e => setSelectedJunction(e.target.value)}
          >
            {JUNCTIONS.map(j => (
              <option key={j.value} value={j.value}>{j.label}</option>
            ))}
          </select>
        </div>
        <div className="analytics-cards-row">
          <div className="analytics-card">
            <div className="analytics-card-title">Total Vehicles</div>
            <div className="analytics-card-value">{totalVehicles}</div>
          </div>
          <div className="analytics-card">
            <div className="analytics-card-title">Avg Vehicles/Min</div>
            <div className="analytics-card-value">{avgPerMinute}</div>
          </div>
          <div className="analytics-card">
            <div className="analytics-card-title">Peak Direction</div>
            <div className="analytics-card-value">{peakDirection.toUpperCase()}</div>
          </div>
        </div>
        <div className="analytics-directions-row">
          {DIRECTIONS.map(dir => (
            <div key={dir} className="analytics-dir-card">
              <div className="analytics-dir-title">{dir.toUpperCase()}</div>
              <div className="analytics-dir-value">{vehicleCounts[dir] !== undefined ? vehicleCounts[dir] : '-'}</div>
              <div className="analytics-dir-label">vehicles</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Analytics;
