import React, { useEffect, useState, useRef } from 'react';
import './PublicDashboard.css';
import { getAllVehicleCountsUrl, getSignalStatusUrl } from '../utils/apiUtils';
import type { Junction, Direction } from '../utils/apiUtils';

const JUNCTIONS = [
  { label: 'Junction 01', value: 'normal_01' as Junction },
  { label: 'Junction 02', value: 'normal_02' as Junction },
  { label: 'Junction 03', value: 'flipped_03' as Junction },
  { label: 'Junction 04', value: 'flipped_04' as Junction },
];
const DIRECTIONS: Direction[] = ['north', 'east', 'south', 'west'];

const PublicDashboard: React.FC = () => {
  const [selectedJunction, setSelectedJunction] = useState<Junction>(JUNCTIONS[0].value);
  const [vehicleCounts, setVehicleCounts] = useState<{ [key: string]: number }>({});
  const [signalStatus, setSignalStatus] = useState<string>('north');
  const eventSourceRef = useRef<EventSource | null>(null);
  const signalSourceRef = useRef<EventSource | null>(null);

  // Setup single SSE for all directions (more efficient)
  useEffect(() => {
    // Close existing connection
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }
    
    const url = getAllVehicleCountsUrl(selectedJunction);
    console.log(`Setting up single SSE connection with URL: ${url}`);
    const es = new window.EventSource(url);
    eventSourceRef.current = es;
    
    es.onopen = () => {
      console.log(`SSE connection opened for all directions`);
    };
    
    es.onmessage = (event: MessageEvent) => {
      console.log(`Received SSE message:`, event.data);
      try {
        const data = JSON.parse(event.data);
        console.log(`Parsed data:`, data);
        
        // Extract all directions data - this is the key improvement
        if (data.all_directions) {
          setVehicleCounts(data.all_directions);
          console.log(`Updated all vehicle counts:`, data.all_directions);
        } else {
          // Fallback to individual direction data
          setVehicleCounts(prev => ({
            ...prev,
            [data.direction]: data.vehicles
          }));
        }
      } catch (e) {
        console.error(`Error parsing vehicle count data:`, e, 'Raw data:', event.data);
      }
    };
    
    es.onerror = (error) => {
      console.error(`SSE connection error:`, error);
      es.close();
    };
    
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
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
        setSignalStatus(data.active_signal || data.active_direction);
      } catch (e) {
        console.error('Error parsing signal status data:', e);
      }
    };
    
    es.onerror = () => {
      console.warn('SSE connection error for signal status');
      es.close();
    };
    
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
            onChange={e => setSelectedJunction(e.target.value as Junction)}
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
          {/* <div className="public-dashboard-card">
            <div className="public-dashboard-card-title">Camera System</div>
            <div className="public-dashboard-card-value">🚁 DRONE</div>
          </div> */}
        </div>
        
        <div className="public-dashboard-directions-row">
          {DIRECTIONS.map(dir => (
            <div key={dir} className={`public-dashboard-dir-card${signalStatus === dir ? ' active' : ''}`}>
              <div className="public-dashboard-dir-title">{dir.toUpperCase()}</div>
              <div className="public-dashboard-dir-value">{vehicleCounts[dir] !== undefined ? vehicleCounts[dir] : '-'}</div>
              <div className="public-dashboard-dir-label">vehicles</div>
              {signalStatus === dir && <div className="public-dashboard-dir-signal"></div>}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default PublicDashboard;
