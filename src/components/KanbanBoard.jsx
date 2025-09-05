import React, { useEffect, useMemo, useState } from 'react';
import api from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import './KanbanBoard.css';
import AssignModal from './AssignModal';

const STATUSES = ['TO_DO', 'IN_PROGRESS', 'DONE'];

const KanbanBoard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [projectFilter, setProjectFilter] = useState(''); // stores projectId
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newTask, setNewTask] = useState({ heading: '', description: '' });
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState('');
  const [assigneeFilter, setAssigneeFilter] = useState('');
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [modalTaskId, setModalTaskId] = useState('');
  const [modalUserId, setModalUserId] = useState('');
  const [projects, setProjects] = useState([]); // fetched from API
  const [createProjectId, setCreateProjectId] = useState('');

  useEffect(() => {
    fetchTasks();
    fetchProjects();
    if (user?.role === 'admin') {
      fetchUsers();
    } else {
      // Non-admins can still filter by users visible in tasks
      fetchTaskUsers();
    }
  }, []);

  useEffect(() => {
    // support query param project or projectId
    const params = new URLSearchParams(location.search);
    const qProjectId = params.get('projectId');
    const qProjectTitle = params.get('project');
    if (qProjectId) {
      setProjectFilter(qProjectId);
      fetchTasks(qProjectId);
      return;
    }
    if (qProjectTitle && projects.length) {
      const match = projects.find(p => p.title === qProjectTitle);
      if (match) {
        setProjectFilter(match.id);
        fetchTasks(match.id);
        return;
      }
    }
    if (projectFilter !== '') {
      fetchTasks(projectFilter);
    } else {
      fetchTasks();
    }
  }, [projectFilter, location.search, projects]);

  const fetchTasks = async (projectId = '') => {
    try {
      const params = new URLSearchParams();
      if (projectId) {
        params.append('projectId', projectId);
      }
      const response = await api.get(`/tasks${params.toString() ? `?${params.toString()}` : ''}`);
      setTasks(response.data.data || response.data);
    } catch (e) {
      setError('Failed to load tasks');
    } finally {
      setLoading(false);
    }
  };

  const fetchProjects = async () => {
    try {
      const response = await api.get('/projects');
      setProjects(response.data.data || response.data);
    } catch (e) {}
  };

  const fetchUsers = async () => {
    try {
      const response = await api.get('/auth/users');
      setUsers(response.data.data || response.data);
    } catch {}
  };

  const fetchTaskUsers = async () => {
    try {
      const response = await api.get('/tasks/users');
      setUsers(response.data.data || response.data);
    } catch {}
  };

  const handleCreateTask = async (e) => {
    e.preventDefault();
    if (!newTask.heading.trim()) return;
    try {
      const payload = {
        heading: newTask.heading,
        description: newTask.description
      };
      if (createProjectId) {
        payload.projectId = createProjectId;
      }
      if (user?.role === 'admin' && selectedUser) {
        payload.assignedTo = selectedUser;
      }
      const response = await api.post('/tasks', payload);
      if (response.data.success) {
        const created = response.data.data || response.data;
        setTasks((prev) => [created, ...prev]);
        setNewTask({ heading: '', description: '' });
        setSelectedUser('');
        setCreateProjectId('');
        setShowCreateForm(false);
      }
    } catch (e) {
      // swallow for now
    }
  };

  const filteredTasks = useMemo(() => {
    let list = tasks;
    if (assigneeFilter) {
      list = list.filter((t) => (t.assignedTo?._id || t.assignedTo) === assigneeFilter);
    }
    return list;
  }, [tasks, assigneeFilter]);

  const tasksByStatus = useMemo(() => {
    const result = { TO_DO: [], IN_PROGRESS: [], DONE: [] };
    for (const t of filteredTasks) {
      if (result[t.status]) {
        result[t.status].push(t);
      }
    }
    return result;
  }, [filteredTasks]);

  const onDragStart = (event, taskId) => {
    event.dataTransfer.setData('text/plain', taskId);
  };

  const onDragOver = (event) => {
    event.preventDefault();
  };

  const onDrop = async (event, newStatus) => {
    const taskId = event.dataTransfer.getData('text/plain');
    if (!taskId) return;
    try {
      const response = await api.patch(`/tasks/${taskId}/status`, { status: newStatus });
      if (response.data.success) {
        const updated = response.data.data || response.data;
        setTasks((prev) => prev.map((t) => (t._id === updated._id ? updated : t)));
      }
    } catch (e) {
      // ignore for now; a toast system could be added
    }
  };

  const onChangeAssignee = async (taskId, assigneeId) => {
    try {
      const response = await api.patch(`/tasks/${taskId}/assignee`, { assigneeId });
      if (response.data.success) {
        const updated = response.data.data || response.data;
        setTasks((prev) => prev.map((t) => (t._id === updated._id ? updated : t)));
      }
    } catch (e) {}
  };

  const openAssignModal = () => {
    setModalTaskId('');
    setModalUserId('');
    setShowAssignModal(true);
  };

  const closeAssignModal = () => {
    setShowAssignModal(false);
  };

  const submitAssignModal = async (e) => {
    e.preventDefault();
    if (!modalTaskId) return;
    try {
      await onChangeAssignee(modalTaskId, modalUserId || '');
      setShowAssignModal(false);
    } catch {}
  };

  if (loading) {
    return <div className="loading">Loading Kanban...</div>;
  }

  if (error) {
    return <div className="error">{error}</div>;
  }

  return (
    <div className="kanban">
      <header className="kanban-header">
        <div className="container">
          <div className="header-content">
            <div className="header-left">
              <button onClick={() => navigate('/')} className="back-button">
                <span className="back-icon">←</span>
                Back to Dashboard
              </button>
              <div className="header-title">
                {/* <h1 className="dashboard-title">Kanban Board</h1> */}
                <div className="breadcrumb">
                  <span>Dashboard</span>
                  <span className="separator">/</span>
                  <span>Kanban</span>
                </div>
              </div>
            </div>
            <div className="user-info">
              <div className="user-avatar">
                {(user.username || 'U').slice(0, 1).toUpperCase()}
              </div>
              <div className="user-details">
                <span className="user-welcome">{user.username}</span>
                <span className="user-role">{user.role}</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="dashboard-content">
        <div className="container">
          <div className="kanban-toolbar">
            <div className="toolbar-left">
              {user?.role === 'admin' && (
                <button className="btn btn-primary" onClick={openAssignModal}>
                  <span className="btn-icon">👥</span>
                  Assign Tasks
                </button>
              )}
              {/* <button 
                className="btn btn-secondary" 
                onClick={() => setShowCreateForm(!showCreateForm)}
              >
                <span className="btn-icon">+</span>
                {showCreateForm ? 'Cancel' : 'Create Task'}
              </button> */}
            </div>
            
            <div className="toolbar-filters">
              <div className="filter-group">
                <label className="filter-label">Project</label>
                <select
                  className="form-control filter-select"
                  value={projectFilter}
                  onChange={(e) => setProjectFilter(e.target.value)}
                >
                  <option value="">All Projects</option>
                  {projects.map((project) => (
                    <option key={project.id} value={project.id}>{project.title}</option>
                  ))}
                </select>
              </div>
              
              <div className="filter-group">
                <label className="filter-label">Assignee</label>
                <select
                  className="form-control filter-select"
                  value={assigneeFilter}
                  onChange={(e) => setAssigneeFilter(e.target.value)}
                >
                  <option value="">All Assignees</option>
                  {users.map((u) => (
                    <option key={u._id} value={u._id}>{u.username}</option>
                  ))}
                </select>
              </div>
              
              {(projectFilter || assigneeFilter) && (
                <button 
                  className="btn btn-outline" 
                  onClick={() => { setProjectFilter(''); setAssigneeFilter(''); }}
                >
                  Clear Filters
                </button>
              )}
            </div>
          </div>
          {showCreateForm && (
            <div className="card mb-4 fade-in" style={{ padding: '16px' }}>
              <h3 className="card-title">Create New Task</h3>
              <form onSubmit={handleCreateTask}>
                <div className="form-group">
                  <label className="form-label">Heading *</label>
                  <input
                    type="text"
                    value={newTask.heading}
                    onChange={(e) => setNewTask({ ...newTask, heading: e.target.value })}
                    required
                    className="form-control"
                    placeholder="Enter task heading"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Description</label>
                  <textarea
                    value={newTask.description}
                    onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                    className="form-control"
                    rows="3"
                    placeholder="Enter task description"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Project</label>
                  <select
                    value={createProjectId}
                    onChange={(e) => setCreateProjectId(e.target.value)}
                    className="form-control"
                  >
                    <option value="">Select a project...</option>
                    {projects.map((project) => (
                      <option key={project.id} value={project.id}>{project.title}</option>
                    ))}
                  </select>
                </div>
                {user?.role === 'admin' && (
                  <div className="form-group">
                    <label className="form-label">Assign to</label>
                    <select
                      value={selectedUser}
                      onChange={(e) => setSelectedUser(e.target.value)}
                      className="form-control"
                      role="button"
                      aria-label={`Open task ${task.heading}`}
                    >
                      <option value="">Select user...</option>
                      {users.map((u) => (
                        <option key={u._id} value={u._id}>{u.username}</option>
                      ))}
                    </select>
                  </div>
                )}
                <div className="form-actions">
                  <button type="submit" className="btn btn-success">Create Task</button>
                  <button type="button" className="btn btn-secondary" onClick={() => setShowCreateForm(false)}>Cancel</button>
                </div>
              </form>
            </div>
          )}
          {showAssignModal && (
            <AssignModal
              tasks={tasks}
              users={users}
              taskId={modalTaskId}
              userId={modalUserId}
              onChangeTask={setModalTaskId}
              onChangeUser={setModalUserId}
              onSubmit={submitAssignModal}
              onClose={closeAssignModal}
            />
          )}
          <div className="kanban-columns">
            {STATUSES.map((status) => (
              <div
                key={status}
                className={`kanban-column kanban-${status.toLowerCase()}`}
                onDragOver={onDragOver}
                onDrop={(e) => onDrop(e, status)}
              >
                <div className="kanban-column-header">
                  <div className="column-title-section">
                    <div className={`status-indicator status-${status.toLowerCase().replace('_', '')}`}></div>
                    <h2 className="section-title">{status.replace('_', ' ')}</h2>
                  </div>
                  <div className="column-stats">
                    <span className="badge-count">{tasksByStatus[status].length}</span>
                    <span className="column-subtitle">tasks</span>
                  </div>
                </div>
                <div className="kanban-column-body">
                  {tasksByStatus[status].length === 0 ? (
                    <div className="empty-column">
                      <div className="empty-icon">📋</div>
                      <p className="empty-text">No tasks</p>
                    </div>
                  ) : (
                    tasksByStatus[status].map((task) => (
                      <div
                        key={task._id}
                        className={`task-card draggable status-${task.status.toLowerCase().replace('_', '')}`}
                        draggable
                        onDragStart={(e) => onDragStart(e, task._id)}
                        onClick={() => navigate(`/task/${task._id}`)}
                      >
                        <div className="task-card-header">
                          <h3 className="task-title">{task.heading}</h3>
                          <div className="task-priority">
                            <div className={`priority-dot priority-${task.status.toLowerCase().replace('_', '')}`}></div>
                          </div>
                        </div>
                        
                        {task.description && (
                          <div className="task-description">
                            <p className="description-text">{task.description}</p>
                          </div>
                        )}
                        
                        <div className="task-tags">
                          {task.projectId?.title && (
                            <span className="project-tag">
                              <span className="tag-icon">📁</span>
                              {task.projectId.title}
                            </span>
                          )}
                        </div>
                        
                        <div className="task-footer">
                          <div className="task-assignee">
                            <div className="assignee-avatar">
                              {(task.assignedTo?.username || 'U').slice(0, 1).toUpperCase()}
                            </div>
                            <span className="assignee-name">{task.assignedTo?.username || 'Unassigned'}</span>
                          </div>
                          
                          <div className="task-meta">
                            <span className="created-by">
                              by {task.createdBy?.username}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default KanbanBoard;


