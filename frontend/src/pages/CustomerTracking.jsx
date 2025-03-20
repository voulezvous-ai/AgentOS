
import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';

const CustomerTracking = () => {
  const { orderId } = useParams();
  const [order, setOrder] = useState(null);

  useEffect(() => {
    axios.get(`/api/orders/${orderId}`).then((response) => {
      setOrder(response.data);
    });
  }, [orderId]);

  return (
    <div>
      <h2>Status da Sua Entrega</h2>
      {order ? (
        <>
          <p>🚚 Seu pedido está na posição: <strong>{order.deliveryQueue.indexOf(orderId) + 1}</strong></p>
          <p>⏳ Estimativa de chegada: <strong>{order.estimatedArrival} minutos</strong></p>
        </>
      ) : (
        <p>Carregando informações...</p>
      )}
    </div>
  );
};

export default CustomerTracking;
