
import React, { useState, useEffect, useRef } from 'react';
import JunctionSimulation from './JunctionSimulation';
import { getAllVehicleCountsUrl, getVideoStreamUrl, updateSignalDirection } from '../utils/apiUtils';
import type { Junction, Direction } from '../utils/apiUtils';
import './AdminPage.css';

const JUNCTIONS = [
  { label: 'Junction 01', value: 'normal_01' as Junction },
  { label: 'Junction 02', value: 'normal_02' as Junction },
  { label: 'Junction 03', value: 'flipped_03' as Junction },
  { label: 'Junction 04', value: 'flipped_04' as Junction },
];
const DIRECTIONS: Direction[] = ['north', 'east', 'south', 'west'];

const AdminPage: React.FC = () => {
  const [selectedJunction, setSelectedJunction] = useState<Junction>(JUNCTIONS[0].value);
  const [vehicleCounts, setVehicleCounts] = useState<{ [key: string]: number }>({});
  const [activeOverride, setActiveOverride] = useState<Direction>(DIRECTIONS[0]);
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
        handleUpdateSignalStatus(nextDir); // Send automatic change to backend
        return nextDir;
      });
      return;
    }
    const interval = setInterval(() => {
      setTimer(prev => prev > 0 ? prev - 1 : 0);
    }, 1000);
    return () => clearInterval(interval);
  }, [timer, greenTimes, activeOverride]);
  
  const eventSourceRef = useRef<EventSource | null>(null);

  // Function to update signal status on backend
  const handleUpdateSignalStatus = async (direction: Direction) => {
    try {
      await updateSignalDirection(selectedJunction, direction);
    } catch (error) {
      console.error('Failed to update signal status:', error);
    }
  };

  // Enhanced signal override handler
  const handleSignalOverride = (dir: Direction) => {
    setActiveOverride(dir);
    setTimer(greenTimes[dir] || 30);
    handleUpdateSignalStatus(dir); // Send to backend
  };
  // Setup single SSE for all directions (more efficient)
  useEffect(() => {
    // Close existing connection
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }
    
    const url = getAllVehicleCountsUrl(selectedJunction);
    console.log(`[AdminPage] Setting up single SSE connection with URL: ${url}`);
    const es = new window.EventSource(url);
    eventSourceRef.current = es;
    
    es.onopen = () => {
      console.log(`[AdminPage] SSE connection opened for all directions`);
    };
    
    es.onmessage = (event: MessageEvent) => {
      console.log(`[AdminPage] Received SSE message:`, event.data);
      try {
        const data = JSON.parse(event.data);
        console.log(`[AdminPage] Parsed data:`, data);
        
        // Use all_directions data if available (more efficient)
        if (data.all_directions) {
          setVehicleCounts(data.all_directions);
          console.log(`[AdminPage] Updated all vehicle counts:`, data.all_directions);
        } else {
          // Fallback to individual direction data
          setVehicleCounts(prev => ({
            ...prev,
            [data.direction]: data.vehicles
          }));
        }
      } catch (e) {
        console.error(`[AdminPage] Error parsing vehicle count data:`, e, 'Raw data:', event.data);
      }
    };
    
    es.onerror = (error) => {
      console.error(`[AdminPage] SSE connection error:`, error);
      es.close();
    };
    
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
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
            onChange={e => setSelectedJunction(e.target.value as Junction)}
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
            <div className="admin-video-label">
              Surveillance Camera Feed
            </div>
            <img
              src={getVideoStreamUrl(selectedJunction)}
              alt="video feed"
              className="admin-video-img"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminPage;
