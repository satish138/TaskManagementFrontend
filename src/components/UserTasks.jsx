import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api from '../lib/api';
import { toast } from 'react-toastify';

// Function to generate consistent colors from strings
const stringToColor = (str) => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  let color = '#';
  for (let i = 0; i < 3; i++) {
    const value = (hash >> (i * 8)) & 0xFF;
    color += ('00' + value.toString(16)).substr(-2);
  }
  return color;
};

const UserTasks = () => {
  const { userId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [userData, setUserData] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Redirect if not admin
  useEffect(() => {
    if (user && user.role !== 'admin') {
      navigate('/');
    }
  }, [user, navigate]);

  // Fetch user data and tasks
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setLoading(true);
        // Fetch user details
        const userResponse = await api.get(`/auth/users/${userId}`);
        if (userResponse.data.success) {
          setUserData(userResponse.data.data);
        } else {
          setError('Failed to fetch user details');
          return;
        }

        // Fetch user's tasks
        const tasksResponse = await api.get(`/tasks/user/${userId}`);
        if (tasksResponse.data.success) {
          setTasks(tasksResponse.data.data || []);
        } else {
          setError('Failed to fetch user tasks');
        }
      } catch (err) {
        console.error('Error fetching user data:', err);
        setError('Error: ' + (err.response?.data?.message || err.message));
        toast.error('Failed to load user data');
      } finally {
        setLoading(false);
      }
    };

    if (userId) {
      fetchUserData();
    }
  }, [userId]);

  if (user?.role !== 'admin') {
    return <div className="container mt-5">Access denied. Admin privileges required.</div>;
  }

  const getStatusBadge = (status) => {
    const statusMap = {
      'TO_DO': { bg: 'bg-secondary', icon: 'bi-hourglass', text: 'To Do' },
      'IN_PROGRESS': { bg: 'bg-warning', icon: 'bi-clock-history', text: 'In Progress' },
      'DONE': { bg: 'bg-success', icon: 'bi-check-circle', text: 'Done' }
    };
    
    const { bg, icon, text } = statusMap[status] || { bg: 'bg-info', icon: 'bi-question-circle', text: status };
    
    return (
      <span className={`badge ${bg} bg-opacity-75 px-3 py-2 d-flex align-items-center`}>
        <i className={`bi ${icon} me-2`}></i>
        {text}
      </span>
    );
  };

  return (
    <div className="user-tasks-container">
      <header className="dashboard-header">
        <div className="container">
          <div className="header-content">
            <h1 className="dashboard-title">User Tasks</h1>
            <div className="user-info">
              <div className="user-avatar">
                {(user.username || 'A').slice(0, 1).toUpperCase()}
              </div>
              <div className="user-details">
                <span className="user-welcome">{user.username}</span>
                <span className="user-role">{user.role}</span>
              </div>
            </div>
          </div>
        </div>
      </header>
      
      <div className="container">
        <nav className="breadcrumb-nav" aria-label="breadcrumb">
          <ol className="breadcrumb">
            <li className="breadcrumb-item"><Link to="/">Dashboard</Link></li>
            <li className="breadcrumb-item"><Link to="/admin/users">User Management</Link></li>
            <li className="breadcrumb-item active" aria-current="page">User Tasks</li>
          </ol>
        </nav>
      </div>

      <div className="dashboard-content">
        <div className="container">
          {loading ? (
            <div className="d-flex justify-content-center p-5">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
            </div>
          ) : error ? (
            <div className="alert alert-danger shadow-sm">{error}</div>
          ) : !userData ? (
            <div className="alert alert-warning shadow-sm">User not found</div>
          ) : (
            <>
              <div className="card mb-4 shadow">
                <div className="card-body">
                  <div className="d-flex align-items-center">
                    <div className="user-avatar me-3 rounded-circle d-flex align-items-center justify-content-center" 
                      style={{ 
                        backgroundColor: stringToColor(userData.username), 
                        width: '60px', 
                        height: '60px', 
                        fontSize: '1.5rem' 
                      }}>
                      {userData.username.slice(0, 1).toUpperCase()}
                    </div>
                    <div>
                      <h2 className="mb-1">{userData.username}</h2>
                      <div className="d-flex align-items-center mb-2">
                        <i className="bi bi-envelope me-2 text-muted"></i>
                        <span>{userData.email}</span>
                      </div>
                      <div className="d-flex align-items-center">
                        <span className={`badge ${userData.role === 'admin' ? 'bg-danger' : 'bg-success'} rounded-pill px-3 py-2`}>
                          <i className={`bi ${userData.role === 'admin' ? 'bi-shield-fill' : 'bi-person-fill'} me-1`}></i>
                          {userData.role}
                        </span>
                        <span className="ms-3 text-muted">
                          <i className="bi bi-calendar-date me-1"></i>
                          Joined: {new Date(userData.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="card shadow">
                <div className="card-body">
                  <div className="d-flex justify-content-between align-items-center mb-4">
                    <h3 className="card-title mb-0">Assigned Tasks</h3>
                    <span className="badge bg-primary rounded-pill">{tasks.length} tasks</span>
                  </div>
                  
                  {tasks.length === 0 ? (
                    <div className="alert alert-info shadow-sm">
                      <i className="bi bi-info-circle-fill me-2"></i>
                      No tasks assigned to this user yet.
                    </div>
                  ) : (
                    <div className="table-responsive">
                      <table className="table table-hover align-middle table-striped">
                        <thead className="table-primary">
                          <tr>
                            <th>Task</th>
                            <th>Project</th>
                            <th>Status</th>
                            <th>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {tasks.map(task => (
                            <tr key={task._id}>
                              <td>
                                <div className="fw-bold">{task.heading}</div>
                                <small className="text-muted">{task.description?.substring(0, 50)}{task.description?.length > 50 ? '...' : ''}</small>
                              </td>
                              <td>
                                {task.projectId ? (
                                  <span className="badge bg-info bg-opacity-75 px-3 py-2">
                                    <i className="bi bi-kanban me-1"></i>
                                    {task.projectId?.title || 'Untitled Project'}
                                  </span>
                                ) : (
                                  <span className="badge bg-secondary bg-opacity-50 px-3 py-2">
                                    <i className="bi bi-dash-circle me-1"></i>
                                    No Project
                                  </span>
                                )}
                              </td>
                              <td>
                                {getStatusBadge(task.status)}
                              </td>
                              <td>
                                <Link to={`/task/${task._id}`} className="btn btn-sm btn-primary shadow-sm">
                                  <i className="bi bi-eye me-1"></i>
                                  View
                                </Link>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserTasks;