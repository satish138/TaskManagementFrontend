import React, { useState, useEffect } from "react";
import { Modal, Button, Form, Row, Col } from "react-bootstrap";
import { toast } from "react-toastify";

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
  // Reset image states when modal is closed
  useEffect(() => {
    if (!show) {
      setShowFullImage(false);
      setFullImageSrc("");
      setShowImagePopup(false);
      setPopupImageSrc("");
    }
  }, [show]);
  const [file, setFile] = useState(null);
  const [showFullImage, setShowFullImage] = useState(false);
  const [fullImageSrc, setFullImageSrc] = useState("");
  const [showImagePopup, setShowImagePopup] = useState(false);
  const [popupImageSrc, setPopupImageSrc] = useState("");
  const [Image, setImage] = useState(false);
  // Normalize values for selects
  const projectValue =
    typeof taskData?.projectId === "object" && taskData?.projectId !== null
      ? taskData?.projectId?._id
      : taskData?.projectId || "";

  const assignedValue =
    typeof taskData?.assignedTo === "object" && taskData?.assignedTo !== null
      ? taskData?.assignedTo?._id
      : taskData?.assignedTo || "";

  const handleChange = (field, value) => {
    setTaskData((prev) => ({ ...(prev || {}), [field]: value }));
  };

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!taskData?.heading?.trim()) {
      toast.error("Task title is required");
      return;
    }

    const formData = new FormData();
    formData.append("heading", taskData?.heading || "");
    formData.append("description", taskData?.description || "");

    // Always use normalized values
    if (projectValue) formData.append("projectId", projectValue);
    if (assignedValue) formData.append("assignedTo", assignedValue);

    // Always include status for edit mode, with fallback to TO_DO
    if (mode === "edit") {
      formData.append("status", taskData?.status || "TO_DO");
    }

    if (file) {
      formData.append("file", file);
    }

    onSubmit(formData);
  };

  return (
    <>
      <Modal show={show} onHide={onClose} centered size="lg" className="task-modal" style={{marginLeft:"130px"}} >
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
                  onChange={(e) => handleChange("heading", e.target.value)}
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
                  onChange={(e) => handleChange("projectId", e.target.value)}
                >
                  <option value="">Select Project</option>
                  {projects.map((p) => (
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
              onChange={(e) => handleChange("description", e.target.value)}
              placeholder="Enter task description"
            />
          </Form.Group>

          {isAdmin && (
            <Form.Group className="mb-3">
              <Form.Label className="fw-bold">Assign User</Form.Label>
              <Form.Select
                value={assignedValue}
                onChange={(e) => handleChange("assignedTo", e.target.value)}
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
            <Form.Label className="fw-bold">Attachment</Form.Label>
            <Form.Control type="file" onChange={handleFileChange} />
            {mode === "edit" && taskData?.file && (
              <div className="mt-2">
                <p className="mb-1"><small>Current file: {taskData.file.split('/').pop()}</small></p>
                {taskData.file.match(/\.(jpg|jpeg|png|gif|webp|svg)$/i) ? (
                  <div>
                    <img 
                      src={`http://localhost:5000/${taskData.file}`} 
                      alt="Attachment preview" 
                      style={{ maxWidth: '100%', maxHeight: '150px', marginBottom: '10px', cursor: 'pointer' }} 
                      className="img-thumbnail cursor-pointer"
                      onClick={() => {
                        setShowImagePopup(true);
                        setPopupImageSrc(`http://localhost:5000/${taskData.file}`);
                      }}
                    />
                    <div>
                      {/* <button 
                        onClick={() => {
                          setShowFullImage(!showFullImage);
                          setFullImageSrc(`http://localhost:5000/${taskData.file}`);
                        }} 
                        className="btn btn-sm btn-outline-primary"
                      >
                        {showFullImage ? 'Hide Full Image' : 'View Full Image'}
                      </button> */}
                      {/* Removed the full image view section as requested */}
                    </div>
                    <span></span>
                  </div>
                ) : (
                  <a
                    href={`http://localhost:5000/${taskData.file}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-sm btn-outline-primary"
                  >
                    Open Attachment
                  </a>
                )}
              </div>
            )}
          </Form.Group>

          <div className="d-flex justify-content-end mt-4 gap-2">
          
            <Button type="submit" variant="outline-success">
              {mode === "edit" ? "Save Changes" : "Create Task"}
            </Button>
          </div>
        </Form>
      </Modal.Body>
      </Modal>

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
    </>
  );
};


export default TaskModal;
