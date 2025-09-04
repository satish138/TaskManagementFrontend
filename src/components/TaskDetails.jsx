import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import './TaskDetails.css';

const TaskDetails = () => {
  const [task, setTask] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [updating, setUpdating] = useState(false);
  const { user } = useAuth();
  const { id } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    fetchTask();
  }, [id]);

  const fetchTask = async () => {
    try {
      const response = await axios.get(`/tasks/${id}`);
      setTask(response.data.data || response.data);
    } catch (error) {
      console.error('Error fetching task:', error);
      setError('Failed to load task details');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (newStatus) => {
    setUpdating(true);
    try {
      const response = await axios.patch(`/tasks/${id}/status`, { status: newStatus });
      if (response.data.success) {
        setTask(response.data.data || response.data);
      }
    } catch (error) {
      console.error('Error updating task status:', error);
      setError('Failed to update task status');
    } finally {
      setUpdating(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'TO_DO': return '#ff9800';
      case 'IN_PROGRESS': return '#2196f3';
      case 'DONE': return '#4caf50';
      default: return '#666';
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Not set';
    return new Date(dateString).toLocaleString();
  };

  if (loading) {
    return <div className="loading">Loading task details...</div>;
  }

  if (error) {
    return (
      <div className="error-container">
        <div className="error-message">{error}</div>
        <button onClick={() => navigate('/')} className="back-button">
          Back to Dashboard
        </button>
      </div>
    );
  }

  if (!task) {
    return (
      <div className="error-container">
        <div className="error-message">Task not found</div>
        <button onClick={() => navigate('/')} className="back-button">
          Back to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="task-details">
      <div className="task-details-header">
        <button onClick={() => navigate('/')} className="back-button">
          ← Back to Dashboard
        </button>
        <h1>Task Details</h1>
      </div>

      <div className="task-details-content">
        <div className="task-main-info">
          <div className="task-header">
            <h2>{task.heading}</h2>
            <span 
              className={`status-pill pill-${task.status.toLowerCase().replace('_', '')}`}
            >
              {task.status.replace('_', ' ')}
            </span>
          </div>

          {task.description && (
            <div className="task-description">
              <h3>Description</h3>
              <p>{task.description}</p>
            </div>
          )}
        </div>

        <div className="task-meta-info">
          <h3>Task Information</h3>
          <div className="chips-row">
            <div className="user-chip" title={`Created by ${task.createdBy?.username || ''}`}>
              <span className="user-avatar">{(task.createdBy?.username || 'U').slice(0,1).toUpperCase()}</span>
              <span className="user-name">{task.createdBy?.username || 'Unknown'}</span>
            </div>
            <div className="user-chip" title={task.assignedTo?.username ? `Assigned to ${task.assignedTo?.username}` : 'Unassigned'}>
              <span className="user-avatar">{(task.assignedTo?.username || 'U').slice(0,1).toUpperCase()}</span>
              <span className="user-name">{task.assignedTo?.username || 'Unassigned'}</span>
            </div>
          </div>
          <div className="meta-grid">
            <div className="meta-item">
              <label>Created</label>
              <span>{formatDate(task.createdDate)}</span>
            </div>
            <div className="meta-item">
              <label>In Progress</label>
              <span>{formatDate(task.inProgressDate)}</span>
            </div>
            <div className="meta-item">
              <label>Completed</label>
              <span>{formatDate(task.completionDate)}</span>
            </div>
          </div>
        </div>

        <div className="task-actions">
          <h3>Update Status</h3>
          <div className="status-update-section">
            <select
              value={task.status}
              onChange={(e) => handleStatusUpdate(e.target.value)}
              disabled={updating}
              className="status-select"
            >
              <option value="TO_DO">To Do</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="DONE">Done</option>
            </select>
            
            {updating && <span className="updating-text">Updating...</span>}
          </div>

          <div className="status-info">
            <p><strong>Status Flow:</strong> TO_DO → IN_PROGRESS → DONE</p>
            <p><strong>Note:</strong> Dates are automatically updated when status changes</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TaskDetails;
