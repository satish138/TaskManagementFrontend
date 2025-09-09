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
      }
    } catch (e) {
      console.error(e);
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
    }
  } catch (error) {
    console.error("Error updating task:", error);
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
      }
    } catch (e) {
      console.error("Error updating task status:", e);
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
        <Modal style={{marginLeft:"130px"}} show={!!viewTask} onHide={() => {
                  setViewTask(null);
                  setShowThumbnail(false);
                  setThumbnailSrc('');
                  setShowImagePopup(false);
                  setPopupImageSrc('');
                }} centered size="lg">
          <Modal.Header closeButton className="bg-primary text-white">
            <Modal.Title>{viewTask.heading}</Modal.Title>
          </Modal.Header>

          <Modal.Body>
            <div className="row">
              {/* Left column: Details */}
              <div className="col-md-8">
                <div className="mb-3">
                  <p><strong>Description:</strong></p>
                  <div className="p-3 bg-light rounded">{viewTask.description || 'No description'}</div>
                </div>

                <div className="mb-2">
                  <p><strong>Project:</strong> {viewTask.projectId?.title || 'None'}</p>
                </div>

                <div className="mb-2">
                  <p><strong>Assigned To:</strong> {viewTask.assignedTo?.username || 'Unassigned'}</p>
                </div>

                <div className="mb-2">
                  <p><strong>Created By:</strong> {viewTask.createdBy?.username}</p>
                </div>

                {/* File attachment display if present */}
                {viewTask.file && (
                  <div className="mb-2">
                    <p><strong>Attachment:</strong> {viewTask.file.split('/').pop()}</p>
                    {viewTask.file.match(/\.(jpg|jpeg|png|gif|webp|svg)$/i) ? (
                      <div className="mb-2">
                        <div className="mt-3 position-relative">
                          <img 
                            src={`http://localhost:5000/${viewTask.file}`} 
                            alt="Attachment preview" 
                            className="img-fluid rounded cursor-pointer" 
                            style={{ maxWidth: '100%', maxHeight: '100px' }}
                            onClick={() => {
                              setShowImagePopup(true);
                              setPopupImageSrc(`http://localhost:5000/${viewTask.file}`);
                            }}
                          />
                        </div>
                      </div>
                    ) : (
                      <a href={`http://localhost:5000/${viewTask.file}`} target="_blank" rel="noopener noreferrer" className="btn btn-sm btn-outline-primary">
                        <FaRegFilePdf size={30}/>
                      </a>
                    )}
                  </div>
                )}

                {/* Inline Assign Section */}
                {user?.role === 'admin' && viewTask.showAssign && (
                  <Form
                    onSubmit={async (e) => {
                      e.preventDefault();
                      try {
                        // Create FormData for assignment update
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
                    className="d-flex align-items-center gap-2 mt-3"
                  >
                    <Form.Select
                      value={viewTask.tempAssignee || ''}
                      onChange={(e) =>
                        setViewTask({ ...viewTask, tempAssignee: e.target.value })
                      }
                      className="flex-grow-1"
                    >
                      <option value="">Select User</option>
                      {users.map((u) => (
                        <option key={u._id} value={u._id}>
                          {u.username}
                        </option>
                      ))}
                    </Form.Select>
                    <Button type="submit" variant="success">
                      Save
                    </Button>
                  </Form>
                )}
              </div>

              {/* Right column: Action buttons */}
              <div className="col-md-4 d-flex flex-column gap-2">
                <Button variant="secondary" onClick={() => {
                  setViewTask(null);
                  setShowThumbnail(false);
                  setThumbnailSrc('');
                }}>
                  Close
                </Button>

                {user?.role === 'admin' && !viewTask.showAssign && (
                  <>
                    <Button
                      variant="primary"
                      onClick={() => {
                        // Ensure we include the status when editing
                        const taskToEdit = {
                          ...viewTask,
                          status: viewTask.status || 'TO_DO', // Explicitly include status with fallback
                          projectId: viewTask.projectId?._id || viewTask.projectId // Preserve project ID
                        };
                        setEditTask(taskToEdit);
                        setViewTask(null);
                      }}
                    >
                      Edit Task
                    </Button>

                    <Button
                      variant="success"
                      onClick={() => {
                        setViewTask({ ...viewTask, showAssign: true });
                      }}
                    >
                      Assign Task
                    </Button>
                  </>
                )}
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
