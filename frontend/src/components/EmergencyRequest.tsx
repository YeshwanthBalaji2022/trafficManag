import React, { useState } from 'react';
import './EmergencyRequest.css';

const JUNCTIONS = [
  { label: 'Junction 01 (Normal)', value: 'normal_01' },
  { label: 'Junction 02 (Normal)', value: 'normal_02' },
  { label: 'Junction 03 (Flipped)', value: 'flipped_03' },
  { label: 'Junction 04 (Flipped)', value: 'flipped_04' },
];

const EmergencyRequest: React.FC = () => {
  const [junction, setJunction] = useState(JUNCTIONS[0].value);
  const [vehicleId, setVehicleId] = useState('');
  const [cause, setCause] = useState('');
  const [status, setStatus] = useState<'idle'|'pending'|'approved'|'denied'|'sent'>('idle');
  const [message, setMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('pending');
    setMessage('');
    const token = localStorage.getItem('jwt_token');
    if (!token) {
      setStatus('denied');
      setMessage('You must be logged in to submit emergency requests.');
      return;
    }
    try {
      const res = await fetch('http://localhost:8000/emergency/request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ junction, vehicle_id: vehicleId, cause })
      });
      if (!res.ok) {
        const data = await res.json();
        setStatus('denied');
        setMessage(data.detail || 'Request failed');
        return;
      }
      setStatus('sent');
      setMessage('Emergency request sent! Waiting for admin approval.');
      // Clear form
      setVehicleId('');
      setCause('');
    } catch {
      setStatus('denied');
      setMessage('Request failed. Try again.');
    }
  };

  return (
    <div className="emergency-request-root">
      <div className="emergency-request-panel-glass">
        <h2 className="emergency-request-title">Emergency Priority Request</h2>
        <form className="emergency-request-form" onSubmit={handleSubmit}>
          <label className="emergency-request-label">Junction:</label>
          <select className="emergency-request-dropdown" value={junction} onChange={e => setJunction(e.target.value)}>
            {JUNCTIONS.map(j => (
              <option key={j.value} value={j.value}>{j.label}</option>
            ))}
          </select>
          <label className="emergency-request-label">Vehicle ID:</label>
          <input className="emergency-request-input" value={vehicleId} onChange={e => setVehicleId(e.target.value)} required />
          <label className="emergency-request-label">Emergency Cause:</label>
          <textarea 
            className="emergency-request-input" 
            value={cause} 
            onChange={e => setCause(e.target.value)} 
            placeholder="Describe the emergency (e.g., medical emergency, fire, accident)"
            rows={3}
            required 
          />
          <button className="emergency-request-btn" type="submit" disabled={status==='pending'}>
            Request Priority
          </button>
        </form>
        {status !== 'idle' && (
          <div className={`emergency-request-status ${status}`}>{message || (status==='pending' ? 'Requesting...' : '')}</div>
        )}
      </div>
    </div>
  );
};

export default EmergencyRequest;
