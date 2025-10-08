import React, { useState, useEffect } from 'react';
import './EmergencyRequests.css';

interface EmergencyRequest {
  _id: string;
  junction: string;
  vehicle_id: string;
  cause: string;
  requested_by: string;
  status: string;
  timestamp: string;
}

const JUNCTIONS = [
  { label: 'Junction 01', value: 'normal_01' },
  { label: 'Junction 02', value: 'normal_02' },
  { label: 'Junction 03', value: 'flipped_03' },
  { label: 'Junction 04', value: 'flipped_04' },
];

const EmergencyRequests: React.FC = () => {
  const [requests, setRequests] = useState<EmergencyRequest[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRequests = async () => {
    const token = localStorage.getItem('jwt_token');
    if (!token) return;

    try {
      const res = await fetch('http://localhost:8000/emergency/requests', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setRequests(data);
      }
    } catch (error) {
      console.error('Failed to fetch requests:', error);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchRequests();
    // Refresh every 10 seconds
    const interval = setInterval(fetchRequests, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleApprove = async (requestId: string) => {
    const token = localStorage.getItem('jwt_token');
    if (!token) return;

    try {
      const res = await fetch(`http://localhost:8000/emergency-requests/${requestId}/approve`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (res.ok) {
        fetchRequests(); // Refresh the list
      }
    } catch (error) {
      console.error('Failed to approve request:', error);
    }
  };

  const handleDeny = async (requestId: string) => {
    const token = localStorage.getItem('jwt_token');
    if (!token) return;

    try {
      const res = await fetch(`http://localhost:8000/emergency-requests/${requestId}/deny`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (res.ok) {
        fetchRequests(); // Refresh the list
      }
    } catch (error) {
      console.error('Failed to deny request:', error);
    }
  };

  const getJunctionLabel = (value: string) => {
    return JUNCTIONS.find(j => j.value === value)?.label || value;
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString();
  };

  if (loading) {
    return (
      <div className="emergency-requests-root">
        <div className="emergency-requests-panel-glass">
          <h2 className="emergency-requests-title">Loading...</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="emergency-requests-root">
      <div className="emergency-requests-panel-glass">
        <h2 className="emergency-requests-title">Emergency Requests</h2>
        {requests.length === 0 ? (
          <div className="emergency-requests-empty">No emergency requests found.</div>
        ) : (
          <div className="emergency-requests-list">
            {requests.map((request) => (
              <div key={request._id} className={`emergency-request-card ${request.status}`}>
                <div className="emergency-request-header">
                  <div className="emergency-request-junction">
                    {getJunctionLabel(request.junction)}
                  </div>
                  <div className={`emergency-request-status-badge ${request.status}`}>
                    {request.status.toUpperCase()}
                  </div>
                </div>
                <div className="emergency-request-details">
                  <div className="emergency-request-row">
                    <span className="emergency-request-label">User:</span>
                    <span className="emergency-request-value">{request.requested_by}</span>
                  </div>
                  <div className="emergency-request-row">
                    <span className="emergency-request-label">Vehicle ID:</span>
                    <span className="emergency-request-value">{request.vehicle_id}</span>
                  </div>
                  <div className="emergency-request-row">
                    <span className="emergency-request-label">Cause:</span>
                    <span className="emergency-request-value">{request.cause}</span>
                  </div>
                  <div className="emergency-request-row">
                    <span className="emergency-request-label">Time:</span>
                    <span className="emergency-request-value">{formatTimestamp(request.timestamp)}</span>
                  </div>
                </div>
                {request.status === 'pending' && (
                  <div className="emergency-request-actions">
                    <button 
                      className="emergency-request-approve-btn"
                      onClick={() => handleApprove(request._id)}
                    >
                      Approve
                    </button>
                    <button 
                      className="emergency-request-deny-btn"
                      onClick={() => handleDeny(request._id)}
                    >
                      Deny
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default EmergencyRequests;