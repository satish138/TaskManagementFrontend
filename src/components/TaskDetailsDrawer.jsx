import { Offcanvas, Button } from "react-bootstrap";

const TaskDetailsDrawer = ({ show, onClose, task, users, handleUpdateTask }) => {
  return (
    <Offcanvas show={show} onHide={onClose} placement="end">
      <Offcanvas.Header closeButton>
        <Offcanvas.Title>Task Details</Offcanvas.Title>
      </Offcanvas.Header>
      <Offcanvas.Body>
        <h5>{task?.title}</h5>
        <p>{task?.description}</p>

        <div className="d-flex justify-content-between mt-3">
          <Button
            variant="primary"
            onClick={() =>
              handleUpdateTask({ ...task, assignedTo: users[0]?._id })
            }
          >
            Assign User
          </Button>
          <Button
            variant="secondary"
            onClick={() => {
              // here you can switch into edit mode or open another form
              console.log("Edit clicked");
            }}
          >
            Edit
          </Button>
        </div>
      </Offcanvas.Body>
    </Offcanvas>
  );
};

export default TaskDetailsDrawer;
