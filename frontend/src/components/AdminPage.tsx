
import React, { useState, useEffect, useRef } from 'react';
import JunctionSimulation from './JunctionSimulation';
import './AdminPage.css';

const JUNCTIONS = [
  { label: 'Junction 01', value: '01_' },
  { label: 'Junction 02', value: '02_' },
  { label: 'Junction 05', value: '05_' },
  { label: 'Rifatslu', value: 'rifatuslu_' },
];
const DIRECTIONS = ['north', 'east', 'south', 'west'];

const AdminPage: React.FC = () => {
  const [selectedJunction, setSelectedJunction] = useState(JUNCTIONS[0].value);
  const [vehicleCounts, setVehicleCounts] = useState<{ [key: string]: number }>({});
  const [activeOverride, setActiveOverride] = useState<string>(DIRECTIONS[0]);
  const [timer, setTimer] = useState<number>(60);
  const [greenTimes, setGreenTimes] = useState<{ [key: string]: number }>({ north: 30, east: 30, south: 30, west: 30 });

  // Webster's formula implementation
  function calculateWebsterGreenTimes(counts: { [key: string]: number }) {
    // Webster's formula: C = (1.5L + 5) / (1 - Y),
    // where L = total lost time per cycle (assume 16s for 4-way),
    // Y = sum(y_i) = sum(flow/saturation), assume saturation = 1 vehicle/sec per direction
    // For demo, flow = vehicle count, saturation = 1 veh/sec, so y_i = count/green_guess
    // We'll distribute green time proportional to demand
    const L = 16; // lost time per cycle (s)
    const minGreen = 10; // minimum green per phase (s)
    const totalVehicles = DIRECTIONS.reduce((sum, dir) => sum + (counts[dir] || 0), 0);
    if (totalVehicles === 0) {
      // Default split
      return { north: 30, east: 30, south: 30, west: 30 };
    }
    // Proportional split
    const cycle = Math.max(60, 1.5 * L + 5 + totalVehicles * 2); // simple scaling for demo
    let greens: { [key: string]: number } = {};
    DIRECTIONS.forEach(dir => {
      greens[dir] = Math.max(minGreen, Math.round((counts[dir] || 0) / totalVehicles * (cycle - L)));
    });
    return greens;
  }

  // Recalculate green times whenever vehicleCounts change
  useEffect(() => {
    setGreenTimes(calculateWebsterGreenTimes(vehicleCounts));
  }, [vehicleCounts]);

  // Timer and signal cycling using dynamic green times
  useEffect(() => {
    setTimer(greenTimes[activeOverride] || 30);
  }, [activeOverride, greenTimes]);

  useEffect(() => {
    if (!greenTimes[activeOverride]) return;
    if (timer <= 0) {
      // Move to next direction
      setActiveOverride(prevDir => {
        const idx = DIRECTIONS.indexOf(prevDir);
        const nextDir = DIRECTIONS[(idx + 1) % DIRECTIONS.length];
        updateSignalStatus(nextDir); // Send automatic change to backend
        return nextDir;
      });
      return;
    }
    const interval = setInterval(() => {
      setTimer(prev => prev > 0 ? prev - 1 : 0);
    }, 1000);
    return () => clearInterval(interval);
  }, [timer, greenTimes, activeOverride]);
  const eventSourcesRef = useRef<{ [key: string]: EventSource | null }>({});

  // Helper to get vehicle count SSE URL for a direction
  const getVehicleCountUrl = (direction: string) => {
    return `http://localhost:8001/junction_vehicle_count/${direction}?junction=${selectedJunction}`;
  };

  // Function to update signal status on backend
  const updateSignalStatus = async (direction: string) => {
    try {
      await fetch(`http://localhost:8000/junction_signal_status?junction=${selectedJunction}&direction=${direction}`, {
        method: 'POST',
      });
    } catch (error) {
      console.error('Failed to update signal status:', error);
    }
  };

  // Enhanced signal override handler
  const handleSignalOverride = (dir: string) => {
    setActiveOverride(dir);
    setTimer(greenTimes[dir] || 30);
    updateSignalStatus(dir); // Send to backend
  };
  // Setup SSE for each direction 
  useEffect(() => {
    Object.values(eventSourcesRef.current).forEach(es => es && es.close());
    eventSourcesRef.current = {};
    DIRECTIONS.forEach(dir => {
      const url = getVehicleCountUrl(dir);
      const es = new window.EventSource(url);
      eventSourcesRef.current[dir] = es;
      es.onmessage = (event: MessageEvent) => {
        try {
          const data = JSON.parse(event.data);
          setVehicleCounts(prev => ({ ...prev, [dir]: data.vehicles }));
        } catch (e) {}
      };
      es.onerror = () => {
        es.close();
      };
    });
    return () => {
      Object.values(eventSourcesRef.current).forEach(es => es && es.close());
      eventSourcesRef.current = {};
    };
  }, [selectedJunction]);

  return (
    <div className="admin-root">
      <div className="admin-panel-glass">
        <h2 className="admin-title">Admin Dashboard</h2>
        <div className="admin-row" style={{ marginBottom: 32 }}>
          <label className="admin-label" htmlFor="junction-select">Junction:</label>
          <select
            id="junction-select"
            className="admin-dropdown"
            value={selectedJunction}
            onChange={e => setSelectedJunction(e.target.value)}
          >
            {JUNCTIONS.map(j => (
              <option key={j.value} value={j.value}>{j.label}</option>
            ))}
          </select>
        </div>
        <div className="admin-row admin-top-flex">
          <div className="admin-override-card">
            <h3>Manual Override</h3>
            <div className="admin-override-timer">
              {timer}s
              <span style={{ fontSize: '0.9rem', color: '#00ffe0cc', marginLeft: 8 }}>
                (Green: {greenTimes[activeOverride] || 30}s)
              </span>
            </div>
            <div className="admin-override-controls">
              {DIRECTIONS.map(dir => (
                <button
                  key={dir}
                  className={`admin-override-btn${activeOverride === dir ? ' active' : activeOverride ? ' inactive' : ''}`}
                  onClick={() => handleSignalOverride(dir)}
                >
                  {dir.toUpperCase()}
                </button>
              ))}
            </div>
          </div>
          <div className="admin-stats-flex">
            {DIRECTIONS.map(dir => (
              <div key={dir} className="admin-stat-card">
                <span className="admin-stat-title">{dir.toUpperCase()}</span>
                <span className="admin-stat-count">{vehicleCounts[dir] !== undefined ? vehicleCounts[dir] : '-'}</span>
                <span className="admin-stat-label">vehicles</span>
              </div>
            ))}
          </div>
        </div>
        <div className="admin-row admin-bottom-flex">
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 320 }}>
            <JunctionSimulation vehicleCounts={vehicleCounts} activeSignal={activeOverride} />
          </div>
          <div className="admin-video-card">
            <div className="admin-video-label">Fisheye Camera Feed</div>
            <img
              src={`http://localhost:8001/stitched_video_feed/${selectedJunction}`}
              alt="Fisheye video feed"
              className="admin-fisheye-img"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminPage;
