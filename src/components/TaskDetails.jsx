import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api from '../lib/api';
import './TaskDetails.css';

// Helper functions moved outside component for global access
const formatDate = (dateString) => {
  if (!dateString) return 'Not set';
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Not set';
    return date.toLocaleString();
  } catch (error) {
    return 'Not set';
  }
};

// Get status color for dynamic styling
const getStatusColor = (status) => {
  switch (status) {
    case 'TO_DO': return '#ff9800';
    case 'IN_PROGRESS': return '#2196f3';
    case 'DONE': return '#4caf50';
    default: return '#6c757d';
  }
};

// Get status icon
const getStatusIcon = (status) => {
  switch (status) {
    case 'TO_DO': return '📋';
    case 'IN_PROGRESS': return '⚡';
    case 'DONE': return '✅';
    default: return '📝';
  }
};

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
    setLoading(true);
    setError('');
    try {
      const response = await api.get(`/tasks/${id}`);
      setTask(response.data.data || response.data);
    } catch (err) {
      console.error('Error fetching task:', err);
      setError('❌ Failed to load task details. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (newStatus) => {
    if (!task) return;
    setUpdating(true);

    // Optimistic UI update
    const prevStatus = task.status;
    setTask({ ...task, status: newStatus });

    try {
      const response = await api.patch(`/tasks/${id}/status`, { status: newStatus });
      if (response.data.success) {
        setTask(response.data.data || response.data);
      }
    } catch (err) {
      console.error('Error updating status:', err);
      setError('⚠️ Failed to update status');
      // Rollback on error
      setTask({ ...task, status: prevStatus });
    } finally {
      setUpdating(false);
    }
  };

  // ------------------------
  // Loading & Error States
  // ------------------------
  if (loading) return <div className="loading">⏳ Loading task details...</div>;

  if (error) {
    return (
      <div className="error-container">
        <div className="error-message">{error}</div>
        <button onClick={() => navigate('/')} className="back-button">
          ← Back to Dashboard
        </button>
      </div>
    );
  }

  if (!task) {
    return (
      <div className="error-container">
        <div className="error-message">Task not found</div>
        <button onClick={() => navigate('/')} className="back-button">
          ← Back to Dashboard
        </button>
      </div>
    );
  }

  // ------------------------
  // UI
  // ------------------------
  return (
    <div className="task-details">
      {/* Header */}
      <div className="task-details-header" style={{background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'}}>
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
              <span>Task Details</span>
            </div>
          </div>
          <div className="header-actions">
            <div className="task-id-badge">
              ID: {task._id?.slice(-6)?.toUpperCase()}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="task-details-content">
        {/* Hero */}
        <div className="task-hero fade-in">
          <div className="task-title-section">
            <div className="title-wrapper">
              <h2 className="task-title">{task.heading}</h2>
              {task.projectId && (
                <div className="project-tag">
                  <i className="project-icon">📁</i>
                  <span>{task.projectId.title}</span>
                </div>
              )}
            </div>
            <div className="status-section">
              <div className="task-status-badge">
                <span 
                  className={`status-pill pill-${task.status.toLowerCase().replace('_', '')}`}
                  style={{ '--status-color': getStatusColor(task.status) }}
                >
                  <span className="status-icon">{getStatusIcon(task.status)}</span>
                  {task.status.replace('_', ' ')}
                </span>
              </div>
              <div className="status-timestamp">
                Last updated: {formatDate(task.updatedAt || task.createdAt)}
              </div>
            </div>
          </div>
          
          {task.description && (
            <div className="task-description-section">
              <h3 className="section-title">
                <i className="section-icon">📝</i>
                Description
              </h3>
              <div className="description-content">
                <p>{task.description}</p>
              </div>
            </div>
          )}

          {/* Quick Stats */}
          <div className="quick-stats">
            <div className="stat-item">
              <div className="stat-label">Created</div>
              <div className="stat-value">{formatDate(task.createdAt)}</div>
            </div>
            <div className="stat-item">
              <div className="stat-label">Priority</div>
              <div className="stat-value priority-badge">
                {task.status === 'TO_DO' ? 'Normal' : 
                 task.status === 'IN_PROGRESS' ? 'High' : 'Completed'}
              </div>
            </div>
            <div className="stat-item">
              <div className="stat-label">Assignee</div>
              <div className="stat-value">{task.assignedTo?.username || 'Unassigned'}</div>
            </div>
          </div>
        </div>

        {/* People & Timeline */}
        <div className="task-info-grid">
          <div className="info-card fade-in">
            <div className="card-header">
              <h3>
                <i className="card-icon">👥</i>
                Team Members
              </h3>
            </div>
            <div className="card-content">
              <UserInfo role="Created by" user={task.createdBy} isCreator={true} />
              <UserInfo role="Assigned to" user={task.assignedTo} isCreator={false} />
            </div>
          </div>

          <div className="info-card fade-in">
            <div className="card-header">
              <h3>
                <i className="card-icon">🕰️</i>
                Timeline
              </h3>
            </div>
            <div className="card-content">
              <TimelineItem label="Created" date={task.createdAt} type="created" />
              {task.inProgressDate && <TimelineItem label="In Progress" date={task.inProgressDate} type="in-progress" />}
              {task.completionDate && <TimelineItem label="Completed" date={task.completionDate} type="completed" />}
              {!task.inProgressDate && task.status !== 'TO_DO' && (
                <TimelineItem label="In Progress" date={task.updatedAt} type="in-progress" />
              )}
              {!task.completionDate && task.status === 'DONE' && (
                <TimelineItem label="Completed" date={task.updatedAt} type="completed" />
              )}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="task-actions-section fade-in">
          <div className="action-card">
            <div className="card-header">
              <h3>
                <i className="card-icon">⚙️</i>
                Update Status
              </h3>
            </div>
            <div className="card-content">
              <div className="status-update-container">
                <div className="current-status-info">
                  <div className="current-status-label">Current Status:</div>
                  <div className="current-status-display">
                    <span className="status-icon">{getStatusIcon(task.status)}</span>
                    <span className="status-text">{task.status.replace('_', ' ')}</span>
                  </div>
                </div>
                
                <div className="status-select-wrapper">
                  <label htmlFor="status-select" className="select-label">Change to:</label>
                  <select
                    id="status-select"
                    value={task.status}
                    onChange={(e) => handleStatusUpdate(e.target.value)}
                    disabled={updating}
                    className="status-select"
                  >
                    <option value="TO_DO">📋 To Do</option>
                    <option value="IN_PROGRESS">⚡ In Progress</option>
                    <option value="DONE">✅ Done</option>
                  </select>
                  {updating && <div className="loading-spinner"></div>}
                </div>
                
                <div className="status-flow-info">
                  <div className="flow-title">Progress Flow:</div>
                  <div className="flow-steps">
                    {['TO_DO', 'IN_PROGRESS', 'DONE'].map((step, i) => (
                      <React.Fragment key={step}>
                        <span className={`flow-step ${task.status === step ? 'active' : step === 'TO_DO' && ['IN_PROGRESS', 'DONE'].includes(task.status) ? 'completed' : ''}`}>
                          <span className="flow-icon">{getStatusIcon(step)}</span>
                          {step.replace('_', ' ')}
                        </span>
                        {i < 2 && <span className="flow-arrow">→</span>}
                      </React.Fragment>
                    ))}
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

/* Enhanced subcomponents */
const UserInfo = ({ role, user, isCreator }) => (
  <div className="user-info-item">
    <div className={`user-avatar-large ${isCreator ? 'creator-avatar' : 'assignee-avatar'}`}>
      {(user?.username || 'U').charAt(0).toUpperCase()}
    </div>
    <div className="user-details">
      <span className="user-role">
        <i className="role-icon">{isCreator ? '👑' : '🎯'}</i>
        {role}
      </span>
      <span className="user-name">{user?.username || (isCreator ? 'Unknown' : 'Unassigned')}</span>
      {user?.email && <span className="user-email">{user.email}</span>}
    </div>
  </div>
);

const TimelineItem = ({ label, date, type }) => {
  const getTimelineIcon = (type) => {
    switch (type) {
      case 'created': return '🚀';
      case 'in-progress': return '⚡';
      case 'completed': return '🎉';
      default: return '🕘';
    }
  };

  return (
    <div className="timeline-item">
      <div className={`timeline-dot ${type}`}>
        <span className="timeline-icon">{getTimelineIcon(type)}</span>
      </div>
      <div className="timeline-content">
        <span className="timeline-label">{label}</span>
        <span className="timeline-date">{date ? formatDate(date) : 'Not set'}</span>
      </div>
    </div>
  );
};

export default TaskDetails;
