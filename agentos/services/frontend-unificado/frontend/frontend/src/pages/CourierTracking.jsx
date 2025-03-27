
import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';

const CourierTracking = () => {
  const { courierId } = useParams();
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    axios.get(`/api/orders/courier/${courierId}`).then((response) => {
      setOrders(response.data);
    });
  }, [courierId]);

  return (
    <div>
      <h2>Sua Rota de Entrega</h2>
      {orders.length > 0 ? (
        <ol>
          {orders.map((order, index) => (
            <li key={order.orderId}>
              <p>📍 Entrega #{index + 1} - Cliente {order.customerId}</p>
              <p>⏳ Estimativa: {order.estimatedArrival} min</p>
            </li>
          ))}
        </ol>
      ) : (
        <p>Sem entregas no momento.</p>
      )}
    </div>
  );
};

export default CourierTracking;
