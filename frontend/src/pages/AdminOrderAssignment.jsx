
import React, { useState, useEffect } from 'react';
import axios from 'axios';

const AdminOrderAssignment = () => {
  const [couriers, setCouriers] = useState([]);
  const [orders, setOrders] = useState([]);
  const [selectedCourier, setSelectedCourier] = useState('');
  const [selectedOrders, setSelectedOrders] = useState([]);
  const [autoRoute, setAutoRoute] = useState(true);

  useEffect(() => {
    axios.get('/api/couriers').then((res) => setCouriers(res.data));
    axios.get('/api/orders/pending').then((res) => setOrders(res.data));
  }, []);

  const assignOrders = () => {
    axios.post('/api/orders/assign', {
      courierId: selectedCourier,
      orders: selectedOrders,
      autoRoute
    }).then(() => alert('Pedidos atribuídos com sucesso!'));
  };

  return (
    <div>
      <h2>Atribuir Pedidos ao Estafeta</h2>

      <label>Selecionar Estafeta:</label>
      <select onChange={(e) => setSelectedCourier(e.target.value)}>
        <option value="">Selecione...</option>
        {couriers.map((c) => (
          <option key={c.id} value={c.id}>{c.name}</option>
        ))}
      </select>

      <label>Selecionar Pedidos:</label>
      <ul>
        {orders.map((o) => (
          <li key={o.orderId}>
            <input
              type="checkbox"
              onChange={() => {
                setSelectedOrders((prev) =>
                  prev.includes(o.orderId)
                    ? prev.filter((id) => id !== o.orderId)
                    : [...prev, o.orderId]
                );
              }}
            />
            Pedido #{o.orderId} - Cliente: {o.customerId}
          </li>
        ))}
      </ul>

      <label>
        <input
          type="checkbox"
          checked={autoRoute}
          onChange={() => setAutoRoute(!autoRoute)}
        />
        Calcular Rota Automática
      </label>

      <button onClick={assignOrders}>Atribuir Pedidos</button>
    </div>
  );
};

export default AdminOrderAssignment;
