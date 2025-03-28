import React, { useEffect, useState } from 'react';
import { apiGet, apiPost, apiDelete } from '../../services/api';
import Spinner from '../../components/Spinner';

const People = () => {
  const [people, setPeople] = useState([]);
  const [loading, setLoading] = useState(false);
  const [newPerson, setNewPerson] = useState({
    name: '',
    email: '',
    role: 'estafeta'
  });

  const fetchPeople = async () => {
    setLoading(true);
    try {
      const data = await apiGet('/office/people');
      setPeople(data);
    } catch (err) {
      console.error('Error fetching people:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPeople();
  }, []);

  const handleCreatePerson = async (e) => {
    e.preventDefault();
    if (!newPerson.name || !newPerson.email) return;
    try {
      await apiPost('/office/people', newPerson);
      setNewPerson({ name: '', email: '', role: 'estafeta' });
      fetchPeople();
    } catch (err) {
      console.error('Error creating person:', err);
    }
  };

  const handleDeletePerson = async (personId) => {
    if (!window.confirm('Are you sure?')) return;
    try {
      await apiDelete(`/office/people/${personId}`);
      fetchPeople();
    } catch (err) {
      console.error('Error deleting person:', err);
    }
  };

  return (
    <div className="admin-people">
      <h2>Manage People</h2>
      <form onSubmit={handleCreatePerson} className="create-person-form">
        <input
          type="text"
          placeholder="Name"
          value={newPerson.name}
          onChange={(e) => setNewPerson({ ...newPerson, name: e.target.value })}
        />
        <input
          type="email"
          placeholder="Email"
          value={newPerson.email}
          onChange={(e) => setNewPerson({ ...newPerson, email: e.target.value })}
        />
        <select
          value={newPerson.role}
          onChange={(e) => setNewPerson({ ...newPerson, role: e.target.value })}
        >
          <option value="chefe">Chefe</option>
          <option value="estafeta">Estafeta</option>
        </select>
        <button type="submit">Create</button>
      </form>
      {loading ? (
        <Spinner />
      ) : (
        <table className="data-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {people.map((p) => (
              <tr key={p._id}>
                <td>{p.name}</td>
                <td>{p.email}</td>
                <td>{p.role}</td>
                <td>
                  <button onClick={() => handleDeletePerson(p._id)}>
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default People;