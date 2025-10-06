import React, { useEffect, useState, useRef } from 'react';
import './Analytics.css';
import { getAllVehicleCountsUrl } from '../utils/apiUtils';
import type { Junction, Direction } from '../utils/apiUtils';

const JUNCTIONS = [
  { label: 'Junction 01', value: 'normal_01' as Junction },
  { label: 'Junction 02', value: 'normal_02' as Junction },
  { label: 'Junction 03', value: 'flipped_03' as Junction },
  { label: 'Junction 04', value: 'flipped_04' as Junction },
];
const DIRECTIONS: Direction[] = ['north', 'east', 'south', 'west'];

const Analytics: React.FC = () => {
  const [selectedJunction, setSelectedJunction] = useState<Junction>(JUNCTIONS[0].value);
  const [vehicleCounts, setVehicleCounts] = useState<{ [key: string]: number }>({});
  const [history, setHistory] = useState<{ [key: string]: number[] }>({});

  const eventSourceRef = useRef<EventSource | null>(null);

  // Setup single SSE for all directions (more efficient)
  useEffect(() => {
    // Close existing connection
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }
    
    const url = getAllVehicleCountsUrl(selectedJunction);
    const es = new window.EventSource(url);
    eventSourceRef.current = es;
    
    es.onmessage = (event: MessageEvent) => {
      try {
        const data = JSON.parse(event.data);
        
        // Use all_directions data if available (more efficient)
        if (data.all_directions) {
          setVehicleCounts(data.all_directions);
          
          // Update history for all directions at once
          setHistory(prev => {
            const newHistory = { ...prev };
            DIRECTIONS.forEach(dir => {
              const count = data.all_directions[dir] || 0;
              newHistory[dir] = [...(prev[dir] || []), count].slice(-60); // last 60 samples
            });
            return newHistory;
          });
        } else {
          // Fallback to individual direction data
          const direction = data.direction;
          const count = data.vehicles || 0;
          
          setVehicleCounts(prev => ({ ...prev, [direction]: count }));
          setHistory(prev => ({
            ...prev,
            [direction]: [...(prev[direction] || []), count].slice(-60),
          }));
        }
      } catch (e) {
        console.error('Analytics SSE parse error:', e);
      }
    };
    
    es.onerror = () => {
      console.warn('Analytics SSE connection error');
      es.close();
    };
    
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
    };
  }, [selectedJunction]);

  // Analytics calculations
  const totalVehicles = DIRECTIONS.reduce((sum, dir) => sum + (vehicleCounts[dir] || 0), 0);
  const avgPerMinute = Math.max(0, DIRECTIONS.reduce((sum, dir) => {
    const arr = history[dir] || [];
    return sum + (arr.length > 0 ? Math.max(0, arr[arr.length - 1] - arr[0]) : 0);
  }, 0));
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
            onChange={e => setSelectedJunction(e.target.value as Junction)}
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
          {/* <div className="analytics-card">
            <div className="analytics-card-title">Camera System</div>
            <div className="analytics-card-value">🚁 DRONE</div>
          </div> */}
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
