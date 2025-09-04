import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import './KanbanBoard.css';
import AssignModal from './AssignModal';

const STATUSES = ['TO_DO', 'IN_PROGRESS', 'DONE'];

const KanbanBoard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [projectFilter, setProjectFilter] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newTask, setNewTask] = useState({ heading: '', description: '' });
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState('');
  const [assigneeFilter, setAssigneeFilter] = useState('');
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [modalTaskId, setModalTaskId] = useState('');
  const [modalUserId, setModalUserId] = useState('');

  useEffect(() => {
    fetchTasks();
    if (user?.role === 'admin') {
      fetchUsers();
    } else {
      // Non-admins can still filter by users visible in tasks
      fetchTaskUsers();
    }
  }, []);

  const fetchTasks = async () => {
    try {
      const response = await axios.get('/tasks');
      setTasks(response.data.data || response.data);
    } catch (e) {
      setError('Failed to load tasks');
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await axios.get('/auth/users');
      setUsers(response.data.data || response.data);
    } catch {}
  };

  const fetchTaskUsers = async () => {
    try {
      const response = await axios.get('/tasks/users');
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
      if (user?.role === 'admin' && selectedUser) {
        payload.assignedTo = selectedUser;
      }
      const response = await axios.post('/tasks', payload);
      if (response.data.success) {
        const created = response.data.data || response.data;
        setTasks((prev) => [created, ...prev]);
        setNewTask({ heading: '', description: '' });
        setSelectedUser('');
        setShowCreateForm(false);
      }
    } catch (e) {
      // swallow for now
    }
  };

  const filteredTasks = useMemo(() => {
    let list = tasks;
    if (projectFilter) {
      list = list.filter((t) => t.project === projectFilter);
    }
    if (assigneeFilter) {
      list = list.filter((t) => (t.assignedTo?._id || t.assignedTo) === assigneeFilter);
    }
    return list;
  }, [tasks, projectFilter, assigneeFilter]);

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
      const response = await axios.patch(`/tasks/${taskId}/status`, { status: newStatus });
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
      const response = await axios.patch(`/tasks/${taskId}/assignee`, { assigneeId });
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
            <h1 className="dashboard-title">Kanban Board</h1>
            <div className="user-info">
              <span className="user-welcome">{user.username} ({user.role})</span>
              <button className="btn btn-secondary" onClick={() => navigate('/')}>Back to Dashboard</button>
            </div>
          </div>
        </div>
      </header>

      <div className="dashboard-content">
        <div className="container">
          <div className="kanban-toolbar">
            {/* <button
              className="btn btn-primary"
              onClick={() => setShowCreateForm(!showCreateForm)}
            >
              {showCreateForm ? 'Cancel' : 'Create New Task'}
            </button> */}
             {user?.role === 'admin' && (
                <button className="btn btn-primary" onClick={openAssignModal}>Assign</button>
              )}
            <select
              className="form-control"
              value={assigneeFilter}
              onChange={(e) => setAssigneeFilter(e.target.value)}
            >
              <option value="">All Assignees</option>
              
              {users.map((u) => (
                <option key={u._id} value={u._id}>{u.username}</option>
              ))}
            </select>
            {(projectFilter || assigneeFilter) && (
              <button className="btn" onClick={() => { setProjectFilter(''); setAssigneeFilter(''); }}>Clear</button>
            )}
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
                  <h2 className="section-title">{status.replace('_', ' ')}</h2>
                  <span className="badge-count">{tasksByStatus[status].length}</span>
                </div>
                <div className="kanban-column-body">
                  {tasksByStatus[status].map((task) => (
                    <div
                      key={task._id}
                      className={`card task-card draggable kanban-card-compact status-${task.status.toLowerCase().replace('_', '')}`}
                      draggable
                      onDragStart={(e) => onDragStart(e, task._id)}
                      onClick={() => navigate(`/task/${task._id}`)}
                    >
                      <div className="task-header">
                        <h3 className="task-title">{task.heading}</h3>
                        <span className={`status-pill pill-${task.status.toLowerCase().replace('_', '')}`}>{task.status.replace('_', ' ')}</span>
                      </div>
                      {task.description && (
                        <p className="task-description line-clamp-2">{task.description}</p>
                      )}
                      <div className="task-footer">
                        {task.createdBy?.username && (
                          <span className="project-tag">{task.createdBy.username}</span>
                        )}
                        <div className="user-chip" title={task.assignedTo?.username || 'Unassigned'}>
                          <span className="user-avatar">
                            {(task.assignedTo?.username || 'U').slice(0, 1).toUpperCase()}
                          </span>
                          <span className="user-name line-clamp-1">{task.assignedTo?.username || 'Unassigned'}</span>
                        </div>
                      </div>
                    </div>
                  ))}
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


