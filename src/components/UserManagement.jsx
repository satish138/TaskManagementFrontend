import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api from '../lib/api';
import { toast } from 'react-toastify';


// Function to fetch projects
const fetchProjects = async () => {
  try {
    const response = await api.get('/projects');
    return response.data.success ? response.data.data : [];
  } catch (error) {
    console.error('Error fetching projects:', error);
    return [];
  }
};

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

const UserManagement = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [displayedUsers, setDisplayedUsers] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [usersPerPage] = useState(5);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    role: 'user',
    projectId: '',
    taskData: {
      title: '',
      description: '',
      status: 'TO_DO',
      projectId: ''
    }
  });
  const [formError, setFormError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [assignTask, setAssignTask] = useState(false);

  // Redirect if not admin
  useEffect(() => {
    if (user && user.role !== 'admin') {
      navigate('/');
    }
  }, [user, navigate]);

  // Fetch users and projects
  useEffect(() => {
    fetchUsers();
    
    // Fetch projects for dropdown
    const getProjects = async () => {
      try {
        const projectsData = await fetchProjects();
        setProjects(projectsData);
      } catch (err) {
        console.error('Error fetching projects:', err);
      }
    };
    
    getProjects();
  }, []);
  
  // Filter users based on search term and role filter
  useEffect(() => {
    if (!users) return;
    
    const filtered = users.filter(user => {
      const matchesSearch = searchTerm === '' || 
        user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase());
        
      const matchesRole = filterRole === 'all' || user.role === filterRole;
      
      return matchesSearch && matchesRole;
    });
    
    setFilteredUsers(filtered);
    setCurrentPage(1); // Reset to first page when filters change
  }, [users, searchTerm, filterRole]);
  
  // Handle pagination
  useEffect(() => {
    const indexOfLastUser = currentPage * usersPerPage;
    const indexOfFirstUser = indexOfLastUser - usersPerPage;
    setDisplayedUsers(filteredUsers.slice(indexOfFirstUser, indexOfLastUser));
  }, [filteredUsers, currentPage, usersPerPage]);
  
  // Change page
  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await api.get('/auth/users');
      if (response.data.success) {
        const userData = response.data.data || [];
        setUsers(userData);
        setFilteredUsers(userData);
      } else {
        setError('Failed to fetch users');
      }
    } catch (err) {
      setError('Error fetching users: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    if (name.startsWith('taskData.')) {
      // Handle task fields
      const taskField = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        taskData: {
          ...prev.taskData,
          [taskField]: value
        }
      }));
    } else if (name === 'projectId') {
      // When project is selected, update both main projectId and task projectId
      setFormData(prev => ({
        ...prev,
        [name]: value,
        taskData: {
          ...prev.taskData,
          projectId: value
        }
      }));
    } else {
      // Handle regular fields
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
    
    setFormError('');
    setSuccessMessage('');
  };
  
  // Toggle task assignment section
  const toggleTaskAssignment = () => {
    setAssignTask(!assignTask);
    
    // Reset task data if disabling
    if (assignTask) {
      setFormData(prev => ({
        ...prev,
        taskData: {
          title: '',
          description: '',
          status: 'TO_DO',
          projectId: prev.projectId
        }
      }));
    }
  };

  const validateEmail = (email) => {
    const re = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return re.test(email);
  };

  const validatePassword = (password) => {
    return password.length >= 6;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Reset error and success messages
    setFormError('');
    setSuccessMessage('');
    
    // Validate form
    if (!formData.username || !formData.email || !formData.password) {
      setFormError('All required fields must be filled out');
      return;
    }
    
    if (!validateEmail(formData.email)) {
      setFormError('Please enter a valid email address');
      return;
    }
    
    if (!validatePassword(formData.password)) {
      setFormError('Password must be at least 6 characters long');
      return;
    }
    
    if (assignTask && formData.taskData.title.trim() === '') {
      setFormError('Task title is required when assigning a task');
      return;
    }
    
    // Show confirmation modal instead of submitting directly
    setShowConfirmModal(true);
    // Add overflow hidden to body to prevent scrolling when modal is open
    document.body.style.overflow = 'hidden';

    // Form validation passed, show confirmation modal
    // The actual submission will happen in handleConfirmedSubmit
  };

  if (user?.role !== 'admin') {
    return <div className="container mt-5">Access denied. Admin privileges required.</div>;
  }

  // Function to handle the actual form submission after confirmation
  const handleConfirmedSubmit = async () => {
    try {
      setLoading(true);
      setFormError('');
      
      // Prepare data for submission
      const submitData = {
        username: formData.username.trim(),
        email: formData.email.trim(),
        password: formData.password,
        role: formData.role,
      };
      
      // Add project ID if selected
      if (formData.projectId) {
        submitData.projectId = formData.projectId;
      }
      
      // Add task data if task assignment is enabled
      if (assignTask) {
        submitData.taskData = {
          heading: formData.taskData.title.trim(), // Map title to heading as expected by backend
          description: formData.taskData.description.trim(),
          status: formData.taskData.status,
          projectId: formData.taskData.projectId || formData.projectId // Use task project ID or form project ID
        };
      }
      
      console.log('Submitting user data:', submitData);
      
      // Send request to register user
      const response = await api.post('/auth/admin/register', submitData);
      
      console.log('Registration response:', response.data);
      
      // Handle success
      const username = submitData.username;
      toast.success(`User ${username} registered successfully!`);
      
      // Reset form
      setFormData({
        username: '',
        email: '',
        password: '',
        role: 'user',
        projectId: '',
        taskData: {
          title: '',
          description: '',
          status: 'TO_DO'
        }
      });
      setAssignTask(false);
      setShowCreateForm(false); // Hide the form after successful submission
      
      // Refresh user list
      fetchUsers();
      
      // Scroll to top of form to show success message
      const formCard = document.querySelector('.user-form-card');
      if (formCard) {
        formCard.scrollIntoView({ behavior: 'smooth' });
      }
    } catch (err) {
      console.error('Error registering user:', err);
      toast.error(err.response?.data?.message || 'Failed to register user. Please try again.');
    } finally {
      setLoading(false);
      setShowConfirmModal(false);
      // Reset body overflow style
      document.body.style.overflow = '';
    }
  };

  return (
    <div className="user-management-container">
      {/* Confirmation Modal */}
      {showConfirmModal && (
        <>
          <div className="modal fade show" style={{ display: 'block', zIndex: 1050 }} tabIndex="-1" onClick={(e) => {
            // Close modal when clicking outside of modal content
            if (e.target === e.currentTarget) {
              setShowConfirmModal(false);
              document.body.style.overflow = '';
            }
          }}>
            <div className="modal-dialog modal-dialog-centered">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">Confirm User Registration</h5>
                  <button type="button" className="btn-close" onClick={() => {
                    setShowConfirmModal(false);
                    document.body.style.overflow = '';
                  }}></button>
                </div>
                <div className="modal-body">
                  <p>Are you sure you want to register the following user?</p>
                  <ul className="list-group mb-3">
                    <li className="list-group-item"><strong>Username:</strong> {formData.username}</li>
                    <li className="list-group-item"><strong>Email:</strong> {formData.email}</li>
                    <li className="list-group-item"><strong>Role:</strong> {formData.role}</li>
                    {formData.projectId && (
                      <li className="list-group-item">
                        <strong>Project:</strong> {projects.find(p => p._id === formData.projectId)?.title || formData.projectId}
                      </li>
                    )}
                    {assignTask && (
                      <li className="list-group-item">
                        <strong>Task:</strong> {formData.taskData.title}
                      </li>
                    )}
                  </ul>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={() => {
                    setShowConfirmModal(false);
                    document.body.style.overflow = '';
                  }}>Cancel</button>
                  <button 
                    type="button" 
                    className="btn btn-primary" 
                    onClick={handleConfirmedSubmit}
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                        Processing...
                      </>
                    ) : (
                      'Confirm Registration'
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
          <div className="modal-backdrop fade show" style={{ zIndex: 1040 }}></div>
        </>
      )}
      
      <header className="dashboard-header">
        <div className="container">
          <div className="header-content">
            <h1 className="dashboard-title">User Management</h1>
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
            <li className="breadcrumb-item active" aria-current="page">User Management</li>
          </ol>
        </nav>
      </div>

      <div className="dashboard-content">
        <div className="container">
          <div className="user-management-toolbar mb-4">
            <button
              className="btn btn-primary shadow-sm"
              onClick={() => setShowCreateForm(!showCreateForm)}
            >
              <i className={`bi ${showCreateForm ? 'bi-x-circle' : 'bi-person-plus'} me-2`}></i>
              {showCreateForm ? 'Cancel' : 'Create New User'}
            </button>
            <div className="user-stats d-flex gap-3">
              <div className="stat-item badge bg-primary bg-opacity-75 px-3 py-2 d-flex align-items-center">
                <i className="bi bi-people-fill me-2"></i>
                <strong>{users.length}</strong> <span className="ms-1">Total Users</span>
              </div>
              <div className="stat-item badge bg-success bg-opacity-75 px-3 py-2 d-flex align-items-center">
                <i className="bi bi-briefcase-fill me-2"></i>
                <strong>{projects.length}</strong> <span className="ms-1">Projects</span>
              </div>
            </div>
          </div>

          {showCreateForm && (
            <div className="card user-form-card fade-in mb-4 shadow">
              <div className="card-body">
                <h3 className="card-title">Create New User</h3>
                {formError && <div className="alert alert-danger">{formError}</div>}
                {successMessage && <div className="alert alert-success">{successMessage}</div>}
                
                <form onSubmit={handleSubmit}>
                  <div className="form-group mb-3">
                    <label htmlFor="username" className="form-label">Username <span className="text-danger">*</span></label>
                    <input
                      type="text"
                      id="username"
                      name="username"
                      className="form-control"
                      value={formData.username}
                      onChange={handleInputChange}
                      placeholder="Enter username"
                      required
                    />
                  </div>
                  
                  <div className="form-group mb-3">
                    <label htmlFor="email" className="form-label">Email <span className="text-danger">*</span></label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      className="form-control"
                      value={formData.email}
                      onChange={handleInputChange}
                      placeholder="Enter email address"
                      required
                    />
                    <small className="form-text text-muted">We'll never share the email with anyone else.</small>
                  </div>
                  
                  <div className="form-group mb-3">
                    <label htmlFor="password" className="form-label">Password <span className="text-danger">*</span></label>
                    <input
                      type="password"
                      id="password"
                      name="password"
                      className="form-control"
                      value={formData.password}
                      onChange={handleInputChange}
                      placeholder="Enter password"
                      required
                    />
                    <small className="form-text text-muted">Password must be at least 6 characters long.</small>
                  </div>
                  
                  <div className="form-group mb-3">
                    <label htmlFor="role" className="form-label">Role</label>
                    <select
                      id="role"
                      name="role"
                      className="form-select"
                      value={formData.role}
                      onChange={handleInputChange}
                    >
                      <option value="user">User</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>

                  <hr className="my-4" />
                  <h4>Project Assignment</h4>
                  <div className="form-group mb-3">
                    <label htmlFor="projectId" className="form-label">Assign to Project</label>
                    <select
                      id="projectId"
                      name="projectId"
                      className="form-select"
                      value={formData.projectId}
                      onChange={handleInputChange}
                    >
                      <option value="">-- Select Project --</option>
                      {projects.length > 0 ? (
                        projects.map(project => (
                          <option key={project._id} value={project._id}>
                            {project.title}
                          </option>
                        ))
                      ) : (
                        <option value="" disabled>No projects available</option>
                      )}
                    </select>
                    {projects.length === 0 && (
                      <small className="form-text text-warning">
                        <i className="bi bi-exclamation-triangle-fill me-1"></i>
                        No projects found. Create a project first.
                      </small>
                    )}
                  </div>

                  <div className="form-check form-switch mb-3">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      id="assignTask"
                      checked={assignTask}
                      onChange={toggleTaskAssignment}
                    />
                    <label className="form-check-label" htmlFor="assignTask">
                      Assign Task to User
                    </label>
                  </div>

                  {assignTask && (
                    <div className="task-assignment-section p-3 border rounded mb-3">
                      <div className="d-flex align-items-center mb-3">
                        <i className="bi bi-list-task me-2 text-primary"></i>
                        <h4 className="mb-0">Task Details</h4>
                      </div>
                      <div className="form-group mb-3">
                        <label htmlFor="taskTitle" className="form-label">Task Title <span className="text-danger">*</span></label>
                        <input
                          type="text"
                          id="taskTitle"
                          name="taskData.title"
                          className="form-control"
                          value={formData.taskData.title}
                          onChange={handleInputChange}
                          placeholder="Enter task title"
                          required={assignTask}
                        />
                      </div>

                      <div className="form-group mb-3">
                        <label htmlFor="taskDescription" className="form-label">Task Description</label>
                        <textarea
                          id="taskDescription"
                          name="taskData.description"
                          className="form-control"
                          value={formData.taskData.description}
                          onChange={handleInputChange}
                          placeholder="Enter task description"
                          rows="3"
                        />
                      </div>

                      <div className="form-group mb-3">
                        <label htmlFor="taskStatus" className="form-label">Status</label>
                        <select
                          id="taskStatus"
                          name="taskData.status"
                          className="form-select"
                          value={formData.taskData.status}
                          onChange={handleInputChange}
                        >
                          <option value="TO_DO">To Do</option>
                          <option value="IN_PROGRESS">In Progress</option>
                          <option value="DONE">Done</option>
                        </select>
                      </div>
                    </div>
                  )}
                  
                  <div className="d-flex gap-2">
                    <button type="submit" className="btn btn-primary" disabled={loading}>
                      {loading ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                          Registering...
                        </>
                      ) : (
                        <>
                          <i className="bi bi-person-plus-fill me-2"></i>
                          Register User
                        </>
                      )}
                    </button>
                    <button 
                      type="button" 
                      className="btn btn-outline-secondary" 
                      onClick={() => {
                        setFormData({
                          username: '',
                          email: '',
                          password: '',
                          role: 'user',
                          projectId: '',
                          taskData: {
                            title: '',
                            description: '',
                            status: 'TO_DO'
                          }
                        });
                        // Reset form state
                        setAssignTask(false);
                        setFormError('');
                        setSuccessMessage('');
                      }}
                    >
                      <i className="bi bi-arrow-counterclockwise me-2"></i>
                      Reset
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          <div className="card user-form-card shadow-sm">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center mb-4">
                <h3 className="card-title mb-0">User List</h3>
                <span className="badge bg-primary rounded-pill">{filteredUsers.length} users</span>
              </div>
              
              <div className="row mb-4">
                <div className="col-md-8 mb-3 mb-md-0">
                  <div className="input-group shadow-sm">
                    <span className="input-group-text bg-primary text-white"><i className="bi bi-search"></i></span>
                    <input 
                      type="text" 
                      className="form-control border-primary" 
                      placeholder="Search by username or email..." 
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    {searchTerm && (
                      <button 
                        className="btn btn-outline-primary" 
                        type="button"
                        onClick={() => setSearchTerm('')}
                      >
                        <i className="bi bi-x-lg"></i>
                      </button>
                    )}
                  </div>
                </div>
                <div className="col-md-4">
                  <div className="input-group shadow-sm">
                    <span className="input-group-text bg-primary text-white"><i className="bi bi-filter"></i></span>
                    <select 
                      className="form-select border-primary" 
                      value={filterRole}
                      onChange={(e) => setFilterRole(e.target.value)}
                    >
                      <option value="all">All Roles</option>
                      <option value="admin">Admin Only</option>
                      <option value="user">User Only</option>
                    </select>
                  </div>
                </div>
              </div>
              
              {loading ? (
                <div className="d-flex justify-content-center p-4">
                  <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                </div>
              ) : error ? (
                <div className="alert alert-danger">{error}</div>
              ) : filteredUsers.length === 0 && users.length === 0 ? (
                <div className="alert alert-info">No users found in the system.</div>
              ) : filteredUsers.length === 0 && searchTerm ? (
                <div className="alert alert-warning">
                  <i className="bi bi-exclamation-triangle-fill me-2"></i>
                  No users match your search criteria. Try adjusting your filters.
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="table table-hover align-middle table-striped">
                    <thead className="table-primary">
                      <tr>
                        <th>Username</th>
                        <th>Email</th>
                        <th>Role</th>
                        <th>Created</th>
                      </tr>
                    </thead>
                    <tbody>
                      {displayedUsers.map(user => (
                        <tr 
                          key={user._id} 
                          onClick={() => navigate(`/admin/users/${user._id}/tasks`)} 
                          style={{ cursor: 'pointer' }} 
                          className="user-row hover-highlight"
                        >
                          <td>
                            <div className="d-flex align-items-center">
                              <div className="user-avatar me-2 rounded-circle d-flex align-items-center justify-content-center" style={{ backgroundColor: stringToColor(user.username), width: '40px', height: '40px', fontSize: '1.2rem' }}>
                                {user.username.slice(0, 1).toUpperCase()}
                              </div>
                              <div>
                                <div className="fw-bold">{user.username}</div>
                                <small className="text-muted">ID: {user._id.substring(0, 8)}...</small>
                              </div>
                            </div>
                          </td>
                          <td>
                            <div className="d-flex align-items-center">
                              <i className="bi bi-envelope me-2 text-muted"></i>
                              {user.email}
                            </div>
                          </td>
                          <td>
                            <span className={`badge ${user.role === 'admin' ? 'bg-danger' : 'bg-success'} rounded-pill px-3 py-2`}>
                              <i className={`bi ${user.role === 'admin' ? 'bi-shield-fill' : 'bi-person-fill'} me-1`}></i>
                              {user.role}
                            </span>
                          </td>
                          <td>
                            <div className="d-flex align-items-center">
                              <i className="bi bi-calendar-date me-2 text-muted"></i>
                              {new Date(user.createdAt).toLocaleDateString()}
                            </div>
                            <small className="text-primary">
                              <i className="bi bi-list-task me-1"></i>
                              Click to view assigned tasks
                            </small>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  
                  {/* Pagination */}
                  {filteredUsers.length > usersPerPage && (
                    <nav className="mt-4" aria-label="User pagination">
                      <ul className="pagination pagination-md justify-content-center">
                        <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                          <button 
                            className="page-link shadow-sm border-primary" 
                            onClick={() => paginate(currentPage - 1)}
                            disabled={currentPage === 1}
                          >
                            <i className="bi bi-chevron-left"></i>
                          </button>
                        </li>
                        
                        {Array.from({ length: Math.ceil(filteredUsers.length / usersPerPage) }).map((_, index) => (
                          <li key={index} className={`page-item ${currentPage === index + 1 ? 'active' : ''}`}>
                            <button 
                              className={`page-link shadow-sm ${currentPage === index + 1 ? 'bg-primary border-primary' : 'border-primary'}`}
                              onClick={() => paginate(index + 1)}
                            >
                              {index + 1}
                            </button>
                          </li>
                        ))}
                        
                        <li className={`page-item ${currentPage === Math.ceil(filteredUsers.length / usersPerPage) ? 'disabled' : ''}`}>
                          <button 
                            className="page-link shadow-sm border-primary" 
                            onClick={() => paginate(currentPage + 1)}
                            disabled={currentPage === Math.ceil(filteredUsers.length / usersPerPage)}
                          >
                            <i className="bi bi-chevron-right"></i>
                          </button>
                        </li>
                      </ul>
                    </nav>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserManagement;