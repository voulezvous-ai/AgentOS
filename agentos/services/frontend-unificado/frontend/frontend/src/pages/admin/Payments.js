import React, { useState, useEffect } from 'react';
import { apiGet, apiPut } from '../../services/api';
import Spinner from '../../components/Spinner';

const Payments = () => {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchPayments = async () => {
    setLoading(true);
    try {
      const data = await apiGet('/office/payments');
      setPayments(data);
    } catch (error) {
      console.error('Error fetching payments:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, []);

  const handleMarkAsPaid = async (paymentId) => {
    try {
      const updated = await apiPut(`/office/payments/${paymentId}`, { status: 'pago' });
      setPayments((prev) => prev.map(p => p._id === updated._id ? updated : p));
    } catch (err) {
      console.error('Error marking payment as paid:', err);
    }
  };

  if (loading) return <Spinner />;

  return (
    <div>
      <h2>Payments Management</h2>
      <table className="data-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>User</th>
            <th>Amount</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {payments.map(pay => (
            <tr key={pay._id}>
              <td>{pay._id}</td>
              <td>{pay.userId?.name || 'Unknown'}</td>
              <td>{pay.amount}</td>
              <td>{pay.status}</td>
              <td>
                {pay.status === 'pendente' && (
                  <button onClick={() => handleMarkAsPaid(pay._id)}>
                    Mark as Paid
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

export default Payments;