import React, { useState, useEffect } from 'react';
import './MyRequests.css';

interface EmergencyRequest {
  _id: string;
  junction: string;
  vehicle_id: string;
  cause: string;
  requested_by: string;
  status: string;
  timestamp: string;
  updated_at?: string;
}

const JUNCTIONS = [
  { label: 'Junction 01', value: '01_' },
  { label: 'Junction 02', value: '02_' },
  { label: 'Junction 05', value: '05_' },
  { label: 'Rifatslu', value: 'rifatuslu_' },
];

const MyRequests: React.FC = () => {
  const [requests, setRequests] = useState<EmergencyRequest[]>([]);
  const [loading, setLoading] = useState(true);

  const getJunctionLabel = (value: string) => {
    const junction = JUNCTIONS.find(j => j.value === value);
    return junction ? junction.label : value;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return '#28a745';
      case 'denied': return '#dc3545';
      case 'pending': return '#ffc107';
      default: return '#6c757d';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved': return '✅';
      case 'denied': return '❌';
      case 'pending': return '⏳';
      default: return '❓';
    }
  };

  const fetchMyRequests = async () => {
    const token = localStorage.getItem('jwt_token');
    if (!token) return;

    try {
      const res = await fetch('http://localhost:8000/emergency/my-requests', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setRequests(data);
      }
    } catch (error) {
      console.error('Failed to fetch my requests:', error);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchMyRequests();
    // Refresh every 30 seconds to check for status updates
    const interval = setInterval(fetchMyRequests, 30000);
    return () => clearInterval(interval);
  }, []);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  if (loading) {
    return <div className="my-requests-loading">Loading your requests...</div>;
  }

  return (
    <div className="my-requests">
      <h2>My Emergency Requests</h2>
      {requests.length === 0 ? (
        <div className="no-requests">
          <p>You haven't made any emergency requests yet.</p>
          <p>Use the emergency request form above to submit a request.</p>
        </div>
      ) : (
        <div className="requests-list">
          {requests.map((request) => (
            <div key={request._id} className="request-card">
              <div className="request-header">
                <div className="request-id">Request #{request._id.slice(-6)}</div>
                <div 
                  className="status-badge"
                  style={{ backgroundColor: getStatusColor(request.status) }}
                >
                  {getStatusIcon(request.status)} {request.status.toUpperCase()}
                </div>
              </div>
              
              <div className="request-details">
                <div className="detail-row">
                  <span className="label">Junction:</span>
                  <span className="value">{getJunctionLabel(request.junction)}</span>
                </div>
                <div className="detail-row">
                  <span className="label">Vehicle ID:</span>
                  <span className="value">{request.vehicle_id}</span>
                </div>
                <div className="detail-row">
                  <span className="label">Cause:</span>
                  <span className="value">{request.cause}</span>
                </div>
                <div className="detail-row">
                  <span className="label">Submitted:</span>
                  <span className="value">{formatDate(request.timestamp)}</span>
                </div>
                {request.updated_at && request.updated_at !== request.timestamp && (
                  <div className="detail-row">
                    <span className="label">Last Updated:</span>
                    <span className="value">{formatDate(request.updated_at)}</span>
                  </div>
                )}
              </div>
              
              {request.status === 'pending' && (
                <div className="pending-message">
                  Your request is being reviewed by traffic management.
                </div>
              )}
              
              {request.status === 'approved' && (
                <div className="approved-message">
                  ✅ Your emergency request has been approved! Traffic lights will be adjusted.
                </div>
              )}
              
              {request.status === 'denied' && (
                <div className="denied-message">
                  ❌ Your request was not approved. Please contact traffic management if needed.
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyRequests;