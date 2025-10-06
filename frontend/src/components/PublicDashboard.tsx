import React, { useEffect, useState, useRef } from 'react';
import './PublicDashboard.css';

const JUNCTIONS = [
  { label: 'Junction 01', value: '01_' },
  { label: 'Junction 02', value: '02_' },
  { label: 'Junction 05', value: '05_' },
  { label: 'Rifatslu', value: 'rifatuslu_' },
];
const DIRECTIONS = ['north', 'east', 'south', 'west'];

const getVehicleCountUrl = (junction: string, direction: string) =>
  `http://localhost:8001/junction_vehicle_count/${direction}?junction=${junction}`;

const getSignalStatusUrl = (junction: string) =>
  `http://localhost:8000/junction_signal_status?junction=${junction}`;

const PublicDashboard: React.FC = () => {
  const [selectedJunction, setSelectedJunction] = useState(JUNCTIONS[0].value);
  const [vehicleCounts, setVehicleCounts] = useState<{ [key: string]: number }>({});
  const [signalStatus, setSignalStatus] = useState<string>('north');
  const eventSourcesRef = useRef<{ [key: string]: EventSource | null }>({});
  const signalSourceRef = useRef<EventSource | null>(null);

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
        } catch (e) {}
      };
      es.onerror = () => es.close();
    });
    return () => {
      Object.values(eventSourcesRef.current).forEach(es => es && es.close());
      eventSourcesRef.current = {};
    };
  }, [selectedJunction]);

  // Setup SSE for signal status
  useEffect(() => {
    if (signalSourceRef.current) signalSourceRef.current.close();
    const url = getSignalStatusUrl(selectedJunction);
    const es = new window.EventSource(url);
    signalSourceRef.current = es;
    es.onmessage = (event: MessageEvent) => {
      try {
        const data = JSON.parse(event.data);
        setSignalStatus(data.active_signal);
      } catch (e) {}
    };
    es.onerror = () => es.close();
    return () => {
      if (signalSourceRef.current) signalSourceRef.current.close();
      signalSourceRef.current = null;
    };
  }, [selectedJunction]);

  return (
    <div className="public-dashboard-root">
      <div className="public-dashboard-panel-glass">
        <h2 className="public-dashboard-title">Live Traffic Dashboard</h2>
        <div className="public-dashboard-row" style={{ marginBottom: 32 }}>
          <label className="public-dashboard-label" htmlFor="junction-select">Junction:</label>
          <select
            id="junction-select"
            className="public-dashboard-dropdown"
            value={selectedJunction}
            onChange={e => setSelectedJunction(e.target.value)}
          >
            {JUNCTIONS.map(j => (
              <option key={j.value} value={j.value}>{j.label}</option>
            ))}
          </select>
        </div>
        <div className="public-dashboard-cards-row">
          <div className="public-dashboard-card">
            <div className="public-dashboard-card-title">Active Signal</div>
            <div className="public-dashboard-card-value">{signalStatus.toUpperCase()}</div>
          </div>
          <div className="public-dashboard-card">
            <div className="public-dashboard-card-title">Total Vehicles</div>
            <div className="public-dashboard-card-value">{DIRECTIONS.reduce((sum, dir) => sum + (vehicleCounts[dir] || 0), 0)}</div>
          </div>
        </div>
        <div className="public-dashboard-directions-row">
          {DIRECTIONS.map(dir => (
            <div key={dir} className={`public-dashboard-dir-card${signalStatus === dir ? ' active' : ''}`}>
              <div className="public-dashboard-dir-title">{dir.toUpperCase()}</div>
              <div className="public-dashboard-dir-value">{vehicleCounts[dir] !== undefined ? vehicleCounts[dir] : '-'}</div>
              <div className="public-dashboard-dir-label">vehicles</div>
              {signalStatus === dir && <div className="public-dashboard-dir-signal">GREEN</div>}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default PublicDashboard;
