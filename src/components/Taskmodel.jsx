import React from "react";
import { Modal, Button, Form, Row, Col } from "react-bootstrap";

const TaskModal = ({
  show,
  onClose,
  onSubmit,
  taskData,
  setTaskData,
  projects,
  users,
  isAdmin,
  mode = "create",
}) => {
  const handleChange = (field, value) => {
    setTaskData(prev => ({ ...(prev || {}), [field]: value }));
  };

  const projectValue = taskData?.projectId?._id || taskData?.projectId || "";
  const assignedValue =
    taskData?.assignedTo?._id || taskData?.assignedTo || "";

  const handleSubmit = e => {
    e.preventDefault();
    onSubmit(taskData);
  };

  return (
    <Modal show={show} onHide={onClose} centered size="lg" className="task-modal">
      <Modal.Header closeButton>
        <Modal.Title>{mode === "edit" ? "Edit Task" : "Create Task"}</Modal.Title>
      </Modal.Header>

      <Modal.Body>
        <Form onSubmit={handleSubmit}>
          <Row className="mb-3">
            <Col md={8}>
              <Form.Group>
                <Form.Label className="fw-bold">Task Title</Form.Label>
                <Form.Control
                  type="text"
                  value={taskData?.heading || ""}
                  onChange={e => handleChange("heading", e.target.value)}
                  placeholder="Enter task title"
                  required
                />
              </Form.Group>
            </Col>
            <Col md={4}>
              <Form.Group>
                <Form.Label className="fw-bold">Project</Form.Label>
                <Form.Select
                  value={projectValue}
                  onChange={e => handleChange("projectId", e.target.value)}
                  className="form-control"
                >
                  <option value="">Select Project</option>
                  {projects.map(p => (
                    <option key={p._id} value={p._id}>
                      {p.title}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>
          </Row>

          <Form.Group className="mb-3">
            <Form.Label className="fw-bold">Description</Form.Label>
            <Form.Control
              as="textarea"
              rows={3}
              value={taskData?.description || ""}
              onChange={e => handleChange("description", e.target.value)}
              placeholder="Enter task description"
            />
          </Form.Group>

          {isAdmin && (
            <Form.Group className="mb-3">
              <Form.Label className="fw-bold">Assign User</Form.Label>
              <Form.Select
                value={assignedValue}
                onChange={e => handleChange("assignedTo", e.target.value)}
                className="form-control"
              >
                <option value="">Unassigned</option>
                {users.map(u => (
                  <option key={u._id} value={u._id}>
                    {u.username}
                  </option>
                ))}
              </Form.Select>
            </Form.Group>
          )}

          <div className="d-flex justify-content-end mt-4 gap-2">
            <Button variant="secondary" onClick={onClose}>
              Close
            </Button>
            <Button type="submit" variant="primary">
              {mode === "edit" ? "Save Changes" : "Create Task"}
            </Button>
          </div>
        </Form>
      </Modal.Body>
    </Modal>
  );
};

export default TaskModal;
