import React, { useEffect, useState } from 'react';
import api from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import './Project.css';

const Project = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newProject, setNewProject] = useState({ title: '', description: '' });
  const [editingProject, setEditingProject] = useState(null);

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const response = await api.get('/projects');
      setProjects(response.data.data || response.data);
    } catch (e) {
      setError('Failed to load projects');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProject = async (e) => {
    e.preventDefault();
    if (!newProject.title.trim()) return;

    try {
      const response = await api.post('/projects', newProject);
      if (response.data.success) {
        const created = response.data.data;
        setProjects((prev) => [created, ...prev]);
        setNewProject({ title: '', description: '' });
        setShowCreateForm(false);
        toast.success('Project created successfully!');
      }
    } catch (e) {
      const errorMsg = e.response?.data?.message || 'Failed to create project';
      setError(errorMsg);
      toast.error(errorMsg);
    }
  };

  const handleUpdateProject = async (e) => {
    e.preventDefault();
    if (!editingProject.title.trim()) return;

    try {
      const response = await api.put(`/projects/${editingProject.id}`, editingProject);
      if (response.data.success) {
        const updated = response.data.data;
        setProjects((prev) => prev.map(p => p.id === updated.id ? updated : p));
        setEditingProject(null);
        toast.success('Project updated successfully!');
      }
    } catch (e) {
      const errorMsg = e.response?.data?.message || 'Failed to update project';
      setError(errorMsg);
      toast.error(errorMsg);
    }
  };

  const startEdit = (project) => {
    setEditingProject({ ...project });
    setShowCreateForm(false);
  };

  const cancelEdit = () => {
    setEditingProject(null);
  };

  if (loading) {
    return <div className="loading">Loading Projects...</div>;
  }

  if (error) {
    return <div className="error">{error}</div>;
  }
  const handleDeleteProject = async (projectId) => {
  // Only allow deletion if user is admin
  if (user.role !== 'admin') {
    toast.error('Only administrators can delete projects');
    return;
  }

  if (!window.confirm('Are you sure you want to delete this project?')) return;

  try {
    const response = await api.delete(`/projects/${projectId}`);
    if (response.data.success) {
      // Remove the deleted project from state
      setProjects((prev) => prev.filter((p) => p.id !== projectId));
      toast.success('Project deleted successfully!');
    }
  } catch (e) {
    console.error('Failed to delete project:', e);
    const errorMsg = e.response?.data?.message || 'Failed to delete project';
    toast.error(errorMsg);
  }
};


  return (
    <div className="project-container">
      <header className="project-header">
        <div className="container">
          <div className="header-content">
            <h1 className="dashboard-title">Project Management</h1>
            <div className="user-info">
              <span className="user-welcome">{user.username} ({user.role})</span>
              <button className="btn btn-secondary" onClick={() => navigate('/')}>Back to Dashboard</button>
            </div>
          </div>
        </div>
      </header>

      <div className="dashboard-content">
        <div className="container">
          {/* Only admin can create projects */}
          {user.role === 'admin' && (
            <div className="project-toolbar mb-3">
              <button
                className="btn btn-primary"
                onClick={() => {
                  setShowCreateForm(!showCreateForm);
                  setEditingProject(null);
                }}
              >
                {showCreateForm ? 'Cancel' : 'Create New Project'}
              </button>
              <div className="project-stats">
                <span className="stat-item">
                  <strong>{projects.length}</strong> Total Projects
                </span>
              </div>
            </div>
          )}

          {showCreateForm && user.role === 'admin' && (
            <div className="card project-form-card fade-in mb-4">
              <h3 className="card-title">Create New Project</h3>
              <form onSubmit={handleCreateProject}>
                <div className="form-group mb-2">
                  <label className="form-label">Project Title *</label>
                  <input
                    type="text"
                    value={newProject.title}
                    onChange={(e) => setNewProject({ ...newProject, title: e.target.value })}
                    required
                    className="form-control"
                    placeholder="Enter project title"
                  />
                </div>
                <div className="form-group mb-2">
                  <label className="form-label">Description</label>
                  <textarea
                    value={newProject.description}
                    onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
                    className="form-control"
                    rows="3"
                    placeholder="Enter project description"
                  />
                </div>
                <div className="form-actions mt-2">
                  <button type="submit" className="btn btn-success me-2">Create Project</button>
                  <button type="button" className="btn btn-secondary" onClick={() => setShowCreateForm(false)}>Cancel</button>
                </div>
              </form>
            </div>
          )}

          {editingProject && user.role === 'admin' && (
            <div className="card project-form-card fade-in mb-4">
              <h3 className="card-title">Edit Project</h3>
              <form onSubmit={handleUpdateProject}>
                <div className="form-group mb-2">
                  <label className="form-label">Project Title *</label>
                  <input
                    type="text"
                    value={editingProject.title}
                    onChange={(e) => setEditingProject({ ...editingProject, title: e.target.value })}
                    required
                    className="form-control"
                    placeholder="Enter project title"
                  />
                </div>
                <div className="form-group mb-2">
                  <label className="form-label">Description</label>
                  <textarea
                    value={editingProject.description}
                    onChange={(e) => setEditingProject({ ...editingProject, description: e.target.value })}
                    className="form-control"
                    rows="3"
                    placeholder="Enter project description"
                  />
                </div>
                <div className="form-actions mt-2">
                  <button type="submit" className="btn btn-success me-2">Update Project</button>
                  <button type="button" className="btn btn-secondary" onClick={cancelEdit}>Cancel</button>
                </div>
              </form>
            </div>
          )}

          <div className="projects-grid">
            {projects.length === 0 ? (
              <div className="empty-state text-center my-5">
                <div className="empty-icon">📁</div>
                <h3>No Projects Yet</h3>
                <p>Create your first project to get started with project management.</p>
                {user.role === 'admin' && (
                  <button className="btn btn-primary" onClick={() => setShowCreateForm(true)}>
                    Create Project
                  </button>
                )}
              </div>
            ) : (
              projects.map((project) => (
                <div key={project.id} className="project-card">
                  <div className="project-header">
                    <h3 className="project-title">{project.title}</h3>
                    {user.role === 'admin' && (
                      <div className="project-actions">
                        <button
                          className="btn-icon"
                          onClick={() => startEdit(project)}
                          title="Edit Project"
                        >
                          ✏️
                        </button>
                        <button
                          className="btn-icon delete"
                          onClick={() => handleDeleteProject(project.id)}
                          title="Delete Project"
                        >
                          🗑️
                        </button>
                      </div>
                    )}
                  </div>

                  {project.description && <p className="project-description">{project.description}</p>}

                  <div className="project-footer d-flex justify-content-between align-items-center">
                    <div className="project-meta">
                      <span className="project-date">
                        Created: {new Date(project.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <button
                      className="btn btn-outline"
                      onClick={() => navigate(`/kanban?project=${project.title}`)}
                    >
                      View Tasks
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Project;
