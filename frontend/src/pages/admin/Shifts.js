import React, { useState, useEffect } from 'react';
import { apiGet, apiPost, apiPut } from '../../services/api';
import Spinner from '../../components/Spinner';

const Shifts = () => {
  const [shifts, setShifts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [newShift, setNewShift] = useState({
    date: '',
    startTime: '',
    endTime: '',
    role: 'estafeta',
    assignedTo: ''
  });
  const [people, setPeople] = useState([]);

  const fetchShifts = async () => {
    setLoading(true);
    try {
      const data = await apiGet('/office/shifts');
      setShifts(data);
    } catch (err) {
      console.error('Error fetching shifts:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchPeople = async () => {
    try {
      const data = await apiGet('/office/people');
      setPeople(data);
    } catch (err) {
      console.error('Error fetching people for shifts:', err);
    }
  };

  useEffect(() => {
    fetchShifts();
    fetchPeople();
  }, []);

  const handleCreateShift = async (e) => {
    e.preventDefault();
    try {
      const created = await apiPost('/office/shifts', newShift);
      setShifts((prev) => [...prev, created]);
      setNewShift({ date: '', startTime: '', endTime: '', role: 'estafeta', assignedTo: '' });
    } catch (err) {
      console.error('Error creating shift:', err);
    }
  };

  const handleUpdateShift = async (id, updatedFields) => {
    try {
      const updatedShift = await apiPut(`/office/shifts/${id}`, updatedFields);
      setShifts((prev) =>
        prev.map((s) => (s._id === id ? updatedShift : s))
      );
    } catch (err) {
      console.error('Error updating shift:', err);
    }
  };

  if (loading) return <Spinner />;

  return (
    <div>
      <h2>Shifts Management</h2>
      <form onSubmit={handleCreateShift} style={{ marginBottom: '20px' }}>
        <div>
          <label>Date</label>
          <input
            type="date"
            value={newShift.date}
            onChange={(e) => setNewShift({ ...newShift, date: e.target.value })}
          />
        </div>
        <div>
          <label>Start Time</label>
          <input
            type="time"
            value={newShift.startTime}
            onChange={(e) => setNewShift({ ...newShift, startTime: e.target.value })}
          />
        </div>
        <div>
          <label>End Time</label>
          <input
            type="time"
            value={newShift.endTime}
            onChange={(e) => setNewShift({ ...newShift, endTime: e.target.value })}
          />
        </div>
        <div>
          <label>Role</label>
          <select
            value={newShift.role}
            onChange={(e) => setNewShift({ ...newShift, role: e.target.value })}
          >
            <option value="chefe">Chefe</option>
            <option value="estafeta">Estafeta</option>
          </select>
        </div>
        <div>
          <label>Assigned To</label>
          <select
            value={newShift.assignedTo}
            onChange={(e) => setNewShift({ ...newShift, assignedTo: e.target.value })}
          >
            <option value=""> -- Unassigned -- </option>
            {people.map((p) => (
              <option key={p._id} value={p._id}>{p.name}</option>
            ))}
          </select>
        </div>
        <button type="submit">Create Shift</button>
      </form>
      <table className="data-table">
        <thead>
          <tr>
            <th>Date</th>
            <th>Start</th>
            <th>End</th>
            <th>Role</th>
            <th>Assigned</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {shifts.map((shift) => (
            <tr key={shift._id}>
              <td>{shift.date?.slice(0, 10)}</td>
              <td>{shift.startTime}</td>
              <td>{shift.endTime}</td>
              <td>{shift.role}</td>
              <td>{shift.assignedTo?.name || 'Unassigned'}</td>
              <td>{shift.status}</td>
              <td>
                {shift.status !== 'encerrado' && (
                  <button onClick={() => handleUpdateShift(shift._id, { status: 'encerrado' })}>
                    Close Shift
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default Shifts;