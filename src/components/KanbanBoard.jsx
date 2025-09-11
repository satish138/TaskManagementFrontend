import React, { useEffect, useMemo, useState } from 'react';
import api from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import './KanbanBoard.css';
import CreateTaskModal from './CreateTaskModal';
import TaskModal from './Taskmodel';
import TaskDetailsDrawer from './TaskDetailsDrawer';
import { Modal, Button, Form } from 'react-bootstrap';
import { FaRegFilePdf } from "react-icons/fa";
import { toast } from 'react-toastify';

const STATUSES = ['TO_DO', 'IN_PROGRESS', 'DONE'];

const KanbanBoard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [projectFilter, setProjectFilter] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newTask, setNewTask] = useState({ heading: '', description: '' });
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState('');
  const [assigneeFilter, setAssigneeFilter] = useState('');
  const [projects, setProjects] = useState([]);
  const [createProjectId, setCreateProjectId] = useState('');
  const [editTask, setEditTask] = useState(null); // editing state
  const [viewTask, setViewTask] = useState(null);
  const [showThumbnail, setShowThumbnail] = useState(false);
  const [thumbnailSrc, setThumbnailSrc] = useState('');
  const [showImagePopup, setShowImagePopup] = useState(false);
  const [popupImageSrc, setPopupImageSrc] = useState('');

  // Helper function to safely format dates
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'N/A';
      return date.toLocaleDateString();
    } catch (error) {
      return 'N/A';
    }
  };



  useEffect(() => {
    fetchTasks();
    fetchProjects();
    if (user?.role === 'admin') {
      fetchUsers();
    } else {
      fetchTaskUsers();
    }
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('create') === 'true') {
      setShowCreateForm(true);
    }
    const qProjectId = params.get('projectId');
    const qProjectTitle = params.get('project');
    if (qProjectId) {
      setProjectFilter(qProjectId);
      fetchTasks(qProjectId);
      return;
    }
    if (qProjectTitle && projects.length) {
      const match = projects.find((p) => p.title === qProjectTitle);
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
      if (projectId) params.append('projectId', projectId);
      const response = await api.get(
        `/tasks${params.toString() ? `?${params.toString()}` : ''}`
      );
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
    } catch { }
  };

  const fetchUsers = async () => {
    try {
      const response = await api.get('/auth/users');
      setUsers(response.data.data || response.data);
    } catch { }
  };

  const fetchTaskUsers = async () => {
    try {
      const response = await api.get('/tasks/users');
      setUsers(response.data.data || response.data);
    } catch { }
  };

  const handleCreateTask = async (formData) => {
    if (!formData.get('heading')?.trim()) return;
    try {
      const response = await api.post('/tasks', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      if (response.data.success) {
        const created = response.data.data || response.data;
        setTasks((prev) => [created, ...prev]);
        setNewTask({ heading: '', description: '' });
        setSelectedUser('');
        setCreateProjectId('');
        setShowCreateForm(false);
        toast.success('Task created successfully!');
      }
    } catch (e) {
      console.error(e);
      toast.error(e.response?.data?.message || 'Failed to create task');
    }
  };
 const handleUpdateTask = async (formData) => {
  try {
    // Ensure status is included in the formData
    if (editTask && editTask.status && !formData.get('status')) {
      formData.append('status', editTask.status);
    }

    const response = await api.put(`/tasks/${editTask._id}`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });

    if (response.data?.success) {
      const savedTask = response.data.data || response.data;
      setTasks((prev) =>
        prev.map((task) => (task._id === savedTask._id ? savedTask : task))
      );
      setEditTask(null); // close modal
      toast.success('Task updated successfully!');
    }
  } catch (error) {
    console.error("Error updating task:", error);
    toast.error(error.response?.data?.message || 'Failed to update task');
  }
};



  const filteredTasks = useMemo(() => {
    let list = tasks;
    if (assigneeFilter) {
      list = list.filter(
        (t) => (t.assignedTo?._id || t.assignedTo) === assigneeFilter
      );
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
      // Find the current task to preserve its project information
      const currentTask = tasks.find(t => t._id === taskId);
      if (!currentTask) return;
      
      const response = await api.patch(`/tasks/${taskId}/status`, {
        status: newStatus,
        projectId: currentTask.projectId?._id || currentTask.projectId
      });
      
      if (response.data.success) {
        const updated = response.data.data || response.data;
        // Ensure project information is preserved in the updated task
        if (!updated.projectId && currentTask.projectId) {
          updated.projectId = currentTask.projectId;
        }
        setTasks((prev) =>
          prev.map((t) => (t._id === updated._id ? updated : t))
        );
        toast.success(`Task moved to ${newStatus.replace('_', ' ').toLowerCase()}`);
      }
    } catch (e) {
      console.error("Error updating task status:", e);
      toast.error(e.response?.data?.message || 'Failed to update task status');
    }
  };

  if (loading) return <div className="loading">Loading Kanban...</div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <div className="kanban">
      <header className="kanban-header">
        <div className="header-content">
          <div className="header-left">
            <button onClick={() => navigate('/')} className="back-button">
              <span className="back-icon">←</span>
              Back to Dashboard
            </button>
            <div className="header-title">
              <h1>Task Board</h1>
              <div className="breadcrumb">
                <span>Dashboard</span>
                <span className="separator">›</span>
                <span>Kanban</span>
                {projectFilter && projects.length > 0 && (
                  <>
                    <span className="separator">›</span>
                    <span className="current-project">
                      {projects.find(p => p.id === projectFilter)?.title || 'Project'}
                    </span>
                  </>
                )}
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
      </header>
      
      {/* Create Task Modal */}
      <TaskModal
        show={showCreateForm}
        onClose={() => setShowCreateForm(false)}
        onSubmit={handleCreateTask}
        taskData={newTask}
        setTaskData={setNewTask}
        projects={projects}
        users={users}
        isAdmin={user?.role === 'admin'}
        mode="create"
      />

      <div className="dashboard-content">
        <div className="container">
          <div className="kanban-toolbar">
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
                    <option key={project.id} value={project.id}>
                      {project.title}
                    </option>
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
                    <option key={u._id} value={u._id}>
                      {u.username}
                    </option>
                  ))}
                </select>
              </div>

              {(projectFilter || assigneeFilter) && (
                <button
                  className="btn btn-outline"
                  onClick={() => {
                    setProjectFilter('');
                    setAssigneeFilter('');
                  }}
                >
                  Clear Filters
                </button>
              )}
            </div>
          </div>

          <div className="kanban-columns">
            {STATUSES.map((status) => (
              <div
                key={status}
                className={`kanban-column kanban-${status.toLowerCase()} scrollable-column`}
                onDragOver={onDragOver}
                onDrop={(e) => onDrop(e, status)}
              >
                <div className="kanban-column-header">
                  <div className="column-title-section">
                    <div
                      className={`status-indicator status-${status
                        .toLowerCase()
                        .replace('_', '')}`}
                    ></div>
                    <h2 className="section-title">
                      {status.replace('_', ' ')}
                    </h2>
                  </div>
                  <div className="column-stats">
                    <span className="badge-count">
                      {tasksByStatus[status].length}
                    </span>
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
                        className={`task-card draggable status-${task.status
                          .toLowerCase()
                          .replace('_', '')}`}
                        draggable
                        onDragStart={(e) => onDragStart(e, task._id)}
                        onClick={() => setViewTask(task)}
                      >
                        <div className="task-card-header">
                          <h3 className="task-title">{task.heading}</h3>
                          <div className="task-priority">
                            <div
                              className={`priority-dot priority-${task.status
                                .toLowerCase()
                                .replace('_', '')}`}
                            ></div>
                          </div>
                        </div>

                        {task.description && (
                          <div className="task-description">
                            {task.description}
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
                              {(task.assignedTo?.username || 'U')
                                .slice(0, 1)
                                .toUpperCase()}
                            </div>
                            <span className="assignee-name">
                              {task.assignedTo?.username || 'Unassigned'}
                            </span>
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

                <div className="kanban-column-footer">
                  <button
                    className="btn btn-primary btn-block"
                    onClick={() => setShowCreateForm(true)}
                  >
                    + Create Task
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Edit Task Modal */}
      <TaskModal
        show={!!editTask}
        onClose={() => setEditTask(null)}
        onSubmit={handleUpdateTask}
        taskData={editTask || { heading: '', description: '' }}
        setTaskData={setEditTask}
        projects={projects}
        users={users}
        isAdmin={user?.role === 'admin'}
        mode="edit"
      />

      {/* View Task Modal */}
      {viewTask && (
        <Modal 
          show={!!viewTask} 
          onHide={() => {
                  setViewTask(null);
                  setShowThumbnail(false);
                  setThumbnailSrc('');
                  setShowImagePopup(false);
                  setPopupImageSrc('');
                }} 
          centered 
          size="lg"
          className="task-details-modal"
          style={{marginLeft: "150px"}}
        >
          <Modal.Header closeButton className="task-modal-header border-0">
            <Modal.Title className="task-modal-title">
              <i className="fas fa-tasks me-2 text-primary"></i>
              {viewTask.heading}
            </Modal.Title>
          </Modal.Header>

          <Modal.Body className="p-0">
            <div className="task-details-container">
              {/* Simplified Header */}
              <div className="task-details-header">
                <div className="d-flex justify-content-between align-items-center">
                  <div className={`status-badge status-${viewTask.status?.toLowerCase()}`}>
                    {viewTask.status === 'TO_DO' ? '📋' : viewTask.status === 'IN_PROGRESS' ? '⚡' : '✅'}
                    <span className="ms-2">{viewTask.status?.replace('_', ' ')}</span>
                  </div>
                  {viewTask.projectId?.title && (
                    <div className="project-badge-simple">
                      {viewTask.projectId.title}
                    </div>
                  )}
                </div>
              </div>

              {/* Simplified Content */}
              <div className="task-details-content">
                {/* Main Content - Single Column */}
                <div className="single-column-content">
                  {/* Description */}
                  <div className="simple-section mb-4">
                    <h6 className="section-title">Description</h6>
                    <div className="content-box">
                      {viewTask.description || <span className="text-muted">No description provided</span>}
                    </div>
                  </div>

                  {/* Team Info - Condensed */}
                  <div className="simple-section mb-4">
                    <h6 className="section-title">Team</h6>
                    <div className="team-simple">
                      <div className="team-row">
                        <span className="role-label">Created by:</span>
                        <span className="member-name">{viewTask.createdBy?.username}</span>
                      </div>
                      <div className="team-row">
                        <span className="role-label">Assigned to:</span>
                        <span className="member-name">{viewTask.assignedTo?.username || 'Unassigned'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Attachment - Simplified */}
                  {viewTask.file && (
                    <div className="simple-section mb-4">
                      <h6 className="section-title">Attachment</h6>
                      <div className="attachment-simple">
                        {viewTask.file.match(/\.(jpg|jpeg|png|gif|webp|svg)$/i) ? (
                          <div className="image-preview" onClick={() => {
                            setShowImagePopup(true);
                            setPopupImageSrc(`http://localhost:5000/${viewTask.file}`);
                          }}>
                            <img 
                              src={`http://localhost:5000/${viewTask.file}`} 
                              alt="Preview" 
                              className="preview-img"
                            />
                            <span className="preview-text">Click to view full size</span>
                          </div>
                        ) : (
                          <div className="file-simple">
                            <FaRegFilePdf className="file-icon" />
                            <div>
                              <div className="file-name">{viewTask.file.split('/').pop()}</div>
                              <a href={`http://localhost:5000/${viewTask.file}`} 
                                 target="_blank" 
                                 rel="noopener noreferrer" 
                                 className="download-link">
                                Download
                              </a>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Assignment Form - Simplified */}
                  {user?.role === 'admin' && viewTask.showAssign && (
                    <div className="simple-section mb-4">
                      <h6 className="section-title">Assign Task</h6>
                      <Form
                        onSubmit={async (e) => {
                          e.preventDefault();
                          try {
                            const formData = new FormData();
                            formData.append('assignedTo', viewTask.tempAssignee || '');
                            if (viewTask.projectId?._id) {
                              formData.append('projectId', viewTask.projectId._id);
                            } else if (viewTask.projectId) {
                              formData.append('projectId', viewTask.projectId);
                            }
                            
                            const response = await api.put(`/tasks/${viewTask._id}`, formData, {
                              headers: {
                                'Content-Type': 'multipart/form-data'
                              }
                            });
                            
                            if (response.data?.success) {
                              const updated = response.data.data;
                              setTasks((prev) =>
                                prev.map((t) => (t._id === updated._id ? updated : t))
                              );
                              setViewTask(null);
                            }
                          } catch (err) {
                            console.error('Error assigning task:', err);
                          }
                        }}
                        className="assign-form-simple"
                      >
                        <div className="assignment-controls">
                          <Form.Select
                            value={viewTask.tempAssignee || ''}
                            onChange={(e) =>
                              setViewTask({ ...viewTask, tempAssignee: e.target.value })
                            }
                            className="assignment-select mb-2"
                          >
                            <option value="">Choose team member...</option>
                            {users.map((u) => (
                              <option key={u._id} value={u._id}>
                                {u.username}
                              </option>
                            ))}
                          </Form.Select>
                          <Button type="submit" className="btn-assign">
                            Assign
                          </Button>
                        </div>
                      </Form>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="actions-section">
                    {user?.role === 'admin' && !viewTask.showAssign && (
                      <div className="admin-actions mb-3">
                        <Button
                          className="action-btn-simple edit me-2"
                          onClick={() => {
                            const taskToEdit = {
                              ...viewTask,
                              status: viewTask.status || 'TO_DO',
                              projectId: viewTask.projectId?._id || viewTask.projectId
                            };
                            setEditTask(taskToEdit);
                            setViewTask(null);
                          }}
                        >
                          Edit Task
                        </Button>

                        <Button
                          className="action-btn-simple assign"
                          onClick={() => {
                            setViewTask({ ...viewTask, showAssign: true });
                          }}
                        >
                          {viewTask.assignedTo ? 'Reassign' : 'Assign'}
                        </Button>
                      </div>
                    )}
                    
                    <Button 
                      className="action-btn-simple close"
                      onClick={() => {
                        setViewTask(null);
                        setShowThumbnail(false);
                        setThumbnailSrc('');
                      }}
                    >
                      Close
                    </Button>

                    {/* Simple Task Info */}
                    <div className="task-info-simple mt-4">
                      <div className="info-item">
                        <span>Created:</span>
                        <span>{formatDate(viewTask.createdAt)}</span>
                      </div>
                      {viewTask.updatedAt && viewTask.updatedAt !== viewTask.createdAt && (
                        <div className="info-item">
                          <span>Updated:</span>
                          <span>{formatDate(viewTask.updatedAt)}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Modal.Body>
        </Modal>
      )}

      {/* Image Popup */}
      {showImagePopup && (
        <div className="image-popup-overlay" onClick={() => setShowImagePopup(false)}>
          <div className="image-popup-content" onClick={(e) => e.stopPropagation()}>
            <img 
              src={popupImageSrc} 
              alt="Full size preview" 
              className="popup-image"
            />
            <button 
              className="popup-close-btn"
              onClick={() => setShowImagePopup(false)}
            >
              ×
            </button>
          </div>
        </div>
      )}

    </div>
  );
};

export default KanbanBoard;
