import React, { useState } from 'react';
import { Modal, Button, Form } from 'react-bootstrap';
import { toast } from 'react-toastify';

const CreateTaskModal = ({
  show,
  onClose,
  onSubmit,
  newTask,
  setNewTask,
  projects,
  createProjectId,
  setCreateProjectId,
  users,
  selectedUser,
  setSelectedUser,
  isAdmin,
  mode = 'create', // 'create' or 'edit'
}) => {
  const [file, setFile] = useState(null); // ✅ file state

  const handleTitleChange = (value) => {
    setNewTask((prev) => ({ ...(prev || {}), heading: value }));
  };

  const handleDescriptionChange = (value) => {
    setNewTask((prev) => ({ ...(prev || {}), description: value }));
  };

  const handleProjectChange = (val) => {
    if (mode === 'edit') {
      setNewTask((prev) => ({ ...(prev || {}), projectId: val || null }));
    } else {
      setCreateProjectId(val);
    }
  };

  const handleAssignedChange = (val) => {
    if (mode === 'edit') {
      setNewTask((prev) => ({ ...(prev || {}), assignedTo: val || null }));
    } else {
      setSelectedUser(val);
    }
  };

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const onFormSubmit = (e) => {
    e.preventDefault();

    if (!newTask?.heading?.trim()) {
      toast.error('Task title is required');
      return;
    }

    // ✅ prepare FormData for file upload
    const formData = new FormData();
    formData.append('heading', newTask?.heading || '');
    formData.append('description', newTask?.description || '');
    if (mode === 'edit') {
      if (newTask?.projectId) formData.append('projectId', newTask.projectId);
      if (newTask?.assignedTo) formData.append('assignedTo', newTask.assignedTo);
      if (newTask?.status) formData.append('status', newTask.status);
    } else {
      if (createProjectId) formData.append('projectId', createProjectId);
      if (selectedUser) formData.append('assignedTo', selectedUser);
    }
    if (file) {
      formData.append('file', file);
    }

    onSubmit(formData); // send to parent handler
  };

  const projectValue =
    mode === 'edit'
      ? newTask?.projectId?._id || newTask?.projectId || ''
      : createProjectId ?? '';

  const assignedValue =
    mode === 'edit'
      ? newTask?.assignedTo?._id || newTask?.assignedTo || ''
      : selectedUser ?? '';

  return (
    <Modal show={show} onHide={onClose} centered style={{marginLeft:"130px"}}>
      <Modal.Header closeButton>
        <Modal.Title>{mode === 'edit' ? 'Edit Task' : 'Create Task'}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form onSubmit={onFormSubmit} encType="multipart/form-data">
          <Form.Group className="mb-3">
            <Form.Label>Task Title</Form.Label>
            <Form.Control
              type="text"
              value={newTask?.heading || ''}
              onChange={(e) => handleTitleChange(e.target.value)}
              required
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Description</Form.Label>
            <Form.Control
              as="textarea"
              rows={3}
              value={newTask?.description || ''}
              onChange={(e) => handleDescriptionChange(e.target.value)}
            />
          </Form.Group>

          {isAdmin && (
            <Form.Group className="mb-3">
              <Form.Label>Assign User</Form.Label>
              <Form.Select
                value={assignedValue}
                onChange={(e) => handleAssignedChange(e.target.value)}
              >
                <option value="">Unassigned</option>
                {users.map((u) => (
                  <option key={u._id} value={u._id}>
                    {u.username}
                  </option>
                ))}
              </Form.Select>
            </Form.Group>
          )}

          <Form.Group className="mb-3">
            <Form.Label>Project</Form.Label>
            <Form.Select
              value={projectValue}
              onChange={(e) => handleProjectChange(e.target.value)}
            >
              <option value="">Select Project</option>
              {projects.map((p) => (
                <option key={p._id} value={p._id}>
                  {p.title}
                </option>
              ))}
            </Form.Select>
          </Form.Group>

          {/* ✅ File Upload */}
          <Form.Group className="mb-3">
            <Form.Label>Attach File (optional)</Form.Label>
            <Form.Control type="file" onChange={handleFileChange} />
          </Form.Group>

          <Button type="submit" variant="primary" className="w-100">
            {mode === 'edit' ? 'Save Changes' : 'Add Task'}
          </Button>
        </Form>
      </Modal.Body>
    </Modal>
  );
};

export default CreateTaskModal;
