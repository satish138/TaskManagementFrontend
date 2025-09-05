import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api from '../lib/api';
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
      const response = await api.get(`/tasks/${id}`);
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
      const response = await api.patch(`/tasks/${id}/status`, { status: newStatus });
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
        <div className="header-content">
          <button onClick={() => navigate('/')} className="back-button">
            <span className="back-icon">←</span>
            Back to Dashboard
          </button>
          <div className="header-title">
            <h1>Task Details</h1>
            <div className="breadcrumb">
              <span>Dashboard</span>
              <span className="separator">/</span>
              <span>Task #{id.slice(-6)}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="task-details-content">
        <div className="task-hero">
          <div className="task-title-section">
            <h2 className="task-title">{task.heading}</h2>
            <div className="task-status-badge">
              <span 
                className={`status-pill pill-${task.status.toLowerCase().replace('_', '')}`}
              >
                {task.status.replace('_', ' ')}
              </span>
            </div>
          </div>
          
          {task.description && (
            <div className="task-description-section">
              <h3 className="section-title">Description</h3>
              <div className="description-content">
                <p>{task.description}</p>
              </div>
            </div>
          )}

          {task.projectId && (
            <div className="project-info">
              <span className="project-label">Project</span>
              <span className="project-name">{task.projectId.title}</span>
            </div>
          )}
        </div>

        <div className="task-info-grid">
          <div className="info-card">
            <div className="card-header">
              <h3>People</h3>
            </div>
            <div className="card-content">
              <div className="user-info-item">
                <div className="user-avatar-large">
                  {(task.createdBy?.username || 'U').slice(0,1).toUpperCase()}
                </div>
                <div className="user-details">
                  <span className="user-role">Created by</span>
                  <span className="user-name">{task.createdBy?.username || 'Unknown'}</span>
                </div>
              </div>
              <div className="user-info-item">
                <div className="user-avatar-large">
                  {(task.assignedTo?.username || 'U').slice(0,1).toUpperCase()}
                </div>
                <div className="user-details">
                  <span className="user-role">Assigned to</span>
                  <span className="user-name">{task.assignedTo?.username || 'Unassigned'}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="info-card">
            <div className="card-header">
              <h3>Timeline</h3>
            </div>
            <div className="card-content">
              <div className="timeline-item">
                <div className="timeline-dot created"></div>
                <div className="timeline-content">
                  <span className="timeline-label">Created</span>
                  <span className="timeline-date">{formatDate(task.createdDate)}</span>
                </div>
              </div>
              {task.inProgressDate && (
                <div className="timeline-item">
                  <div className="timeline-dot in-progress"></div>
                  <div className="timeline-content">
                    <span className="timeline-label">In Progress</span>
                    <span className="timeline-date">{formatDate(task.inProgressDate)}</span>
                  </div>
                </div>
              )}
              {task.completionDate && (
                <div className="timeline-item">
                  <div className="timeline-dot completed"></div>
                  <div className="timeline-content">
                    <span className="timeline-label">Completed</span>
                    <span className="timeline-date">{formatDate(task.completionDate)}</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="task-actions-section">
          <div className="action-card">
            <div className="card-header">
              <h3>Update Status</h3>
            </div>
            <div className="card-content">
              <div className="status-update-container">
                <div className="status-select-wrapper">
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
                  {updating && <div className="loading-spinner"></div>}
                </div>
                
                <div className="status-flow-info">
                  <div className="flow-steps">
                    <span className={`flow-step ${task.status === 'TO_DO' ? 'active' : ''}`}>To Do</span>
                    <span className="flow-arrow">→</span>
                    <span className={`flow-step ${task.status === 'IN_PROGRESS' ? 'active' : ''}`}>In Progress</span>
                    <span className="flow-arrow">→</span>
                    <span className={`flow-step ${task.status === 'DONE' ? 'active' : ''}`}>Done</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TaskDetails;
