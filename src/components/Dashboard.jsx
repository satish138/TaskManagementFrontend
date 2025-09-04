import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import './Dashboard.css';

const Dashboard = () => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newTask, setNewTask] = useState({ heading: '', description: '' });
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [searchText, setSearchText] = useState('');
  const [projectFilter, setProjectFilter] = useState('');
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchTasks();
    if (user.role === 'admin') {
      fetchUsers();
    }
  }, [user.role]);

  const fetchTasks = async () => {
    try {
      const params = {};
      if (statusFilter) params.status = statusFilter;
      if (searchText.trim()) params.search = searchText.trim();
      const response = await axios.get('/tasks', { params });
      setTasks(response.data.data || response.data);
    } catch (error) {
      console.error('Error fetching tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await axios.get('/auth/users');
      setUsers(response.data.data || response.data);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const handleCreateTask = async (e) => {
    e.preventDefault();
    if (!newTask.heading.trim()) return;

    try {
      const taskData = {
        heading: newTask.heading,
        description: newTask.description
      };

      if (user.role === 'admin' && selectedUser) {
        taskData.assignedTo = selectedUser;
      }

      const response = await axios.post('/tasks', taskData);
      if (response.data.success) {
        setNewTask({ heading: '', description: '' });
        setShowCreateForm(false);
        setSelectedUser('');
        fetchTasks();
      }
    } catch (error) {
      console.error('Error creating task:', error);
    }
  };

  const handleStatusUpdate = async (taskId, newStatus) => {
    try {
      const response = await axios.patch(`/tasks/${taskId}/status`, { status: newStatus });
      if (response.data.success) {
        fetchTasks();
      }
    } catch (error) {
      console.error('Error updating task status:', error);
    }
  };

  const handleDeleteTask = async (taskId) => {
    if (window.confirm('Are you sure you want to delete this task?')) {
      try {
        const response = await axios.delete(`/tasks/${taskId}`);
        if (response.data.success) {
          fetchTasks();
        }
      } catch (error) {
        console.error('Error deleting task:', error);
      }
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
    return new Date(dateString).toLocaleDateString();
  };

  const filteredTasks = useMemo(() => {
    if (!projectFilter.trim()) return tasks;
    return tasks.filter((t) => t.project === projectFilter);
  }, [tasks, projectFilter]);

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <div className="container">
          <div className="header-content">
            <h1 className="dashboard-title">Task Management Dashboard</h1>
            <div className="user-info">
              <span className="user-welcome">Welcome, {user.username} ({user.role})</span>
              <button onClick={logout} className="btn btn-secondary">Logout</button>
            </div>
          </div>
        </div>
      </header>

      <div className="dashboard-content">
        <div className="container">
          <div className="dashboard-actions mb-4">
            <button 
              onClick={() => setShowCreateForm(!showCreateForm)}
              className="btn btn-primary"
            >
              {showCreateForm ? 'Cancel' : 'Create New Task'}
            </button>
            <button 
              onClick={() => navigate('/kanban')}
              className="btn btn-secondary"
            >
              Kanban
            </button>
            <div className="filters" >
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="form-control"
                style={{ maxWidth: '180px' }}
              >
                <option value="">All Statuses</option>
                <option value="TO_DO">To Do</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="DONE">Done</option>
              </select>
              <select
                className="form-control"
                value={projectFilter}
                onChange={(e) => setProjectFilter(e.target.value)}
                style={{ maxWidth: '240px', marginLeft: '12px' }}
              >
                <option value="">All Projects</option>
                <option value="PROJECT_1">Project 1</option>
                <option value="PROJECT_2">Project 2</option>
                <option value="PROJECT_3">Project 3</option>
              </select>
              <button className="btn" onClick={() => { setStatusFilter(''); setSearchText(''); setProjectFilter(''); }}>Reset</button>
              <button className="btn btn-secondary" onClick={fetchTasks}>Apply</button>
            </div>
          </div>

          {showCreateForm && (
            <div className="card mb-4 fade-in">
              <h3 className="card-title">Create New Task</h3>
              <form onSubmit={handleCreateTask}>
                <div className="form-group">
                  <label className="form-label">Heading *</label>
                  <input
                    type="text"
                    value={newTask.heading}
                    onChange={(e) => setNewTask({...newTask, heading: e.target.value})}
                    required
                    className="form-control"
                    placeholder="Enter task heading"
                  />
                </div>
                
                <div className="form-group">
                  <label className="form-label">Description</label>
                  <textarea
                    value={newTask.description}
                    onChange={(e) => setNewTask({...newTask, description: e.target.value})}
                    className="form-control"
                    rows="3"
                    placeholder="Enter task description"
                  />
                </div>

                {user.role === 'admin' && (
                  <div className="form-group">
                    <label className="form-label">Assign to</label>
                    <select
                      value={selectedUser}
                      onChange={(e) => setSelectedUser(e.target.value)}
                      className="form-control"
                    >
                      <option value="">Select user...</option>
                      {users.map((u) => (
                        <option key={u._id} value={u._id}>
                          {u.username}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="form-actions">
                  <button type="submit" className="btn btn-success">Create Task</button>
                  <button 
                    type="button" 
                    onClick={() => setShowCreateForm(false)}
                    className="btn btn-secondary"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          <div className="tasks-section">
            <h2 className="section-title">{user.role === 'admin' ? 'All Tasks' : 'My Tasks'}</h2>
            
            {filteredTasks.length === 0 ? (
              <div className="card text-center">
                <p className="no-tasks">No tasks found.</p>
              </div>
            ) : (
              <div className="grid grid-2">
                {filteredTasks.map((task) => (
                  <div key={task._id} className="card task-card fade-in">
                    <div className="task-header">
                      <h3 className="task-title">{task.heading}</h3>
                      <span 
                        className={`badge badge-${task.status.toLowerCase().replace('_', '')}`}
                      >
                        {task.status}
                      </span>
                    </div>
                    
                    {task.description && (
                      <p className="task-description">{task.description}</p>
                    )}
                    
                    <div className="task-meta">
                      <p><strong>Created:</strong> {formatDate(task.createdDate)}</p>
                      <p><strong>Created by:</strong> {task.createdBy?.username}</p>
                      {task.assignedTo && (
                        <p><strong>Assigned to:</strong> {task.assignedTo?.username}</p>
                      )}
                      {task.inProgressDate && (
                        <p><strong>In Progress:</strong> {formatDate(task.inProgressDate)}</p>
                      )}
                      {task.completionDate && (
                        <p><strong>Completed:</strong> {formatDate(task.completionDate)}</p>
                      )}
                    </div>

                    <div className="task-actions">
                      <button
                        onClick={() => navigate(`/task/${task._id}`)}
                        className="btn btn-primary"
                      >
                        View Details
                      </button>
                      
                      <div className="status-actions">
                        <select
                          value={task.status}
                          onChange={(e) => handleStatusUpdate(task._id, e.target.value)}
                          className="form-control"
                        >
                          <option value="TO_DO">To Do</option>
                          <option value="IN_PROGRESS">In Progress</option>
                          <option value="DONE">Done</option>
                        </select>
                      </div>

                      {user.role === 'admin' && (
                        <button
                          onClick={() => handleDeleteTask(task._id)}
                          className="btn btn-danger"
                        >
                          Delete
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
