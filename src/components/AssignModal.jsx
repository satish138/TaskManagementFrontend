import React from 'react';

const AssignModal = ({ tasks, users, taskId, userId, onChangeTask, onChangeUser, onSubmit, onClose }) => {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <h3 className="card-title">Assign Task</h3>
        <form onSubmit={onSubmit}>
          <div className="form-group">
            <label className="form-label">Task</label>
            <select
              className="form-control"
              value={taskId}
              onChange={(e) => onChangeTask(e.target.value)}
              required
            >
              <option value="">Select task...</option>
              {tasks.map((t) => (
                <option key={t._id} value={t._id}>{t.heading}</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Assign to</label>
            <select
              className="form-control"
              value={userId}
              onChange={(e) => onChangeUser(e.target.value)}
            >
              <option value="">Unassigned</option>
              {users.map((u) => (
                <option key={u._id} value={u._id}>{u.username}</option>
              ))}
            </select>
          </div>
          <div className="form-actions">
            <button type="submit" className="btn btn-success">Assign</button>
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AssignModal;


