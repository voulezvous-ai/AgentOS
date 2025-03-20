
import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';

const TrackingPage = () => {
  const { orderId } = useParams();
  const [trackingData, setTrackingData] = useState(null);
  const userType = new URLSearchParams(window.location.search).get('type');

  useEffect(() => {
    axios.get(`/api/orders/${orderId}`).then((response) => {
      setTrackingData(response.data.trackingLinks);
    });
  }, [orderId]);

  return (
    <div>
      <h2>Rastreamento do Pedido</h2>
      {trackingData ? (
        <>
          {userType === 'customer' ? (
            <>
              <p>Você está acompanhando a entrega.</p>
              <a href={`/chat/${orderId}`}>Falar com o Estafeta</a>
            </>
          ) : (
            <>
              <p>Você é o estafeta deste pedido.</p>
              <a href={`/chat/${orderId}`}>Falar com o Cliente</a>
            </>
          )}
        </>
      ) : (
        <p>Carregando informações...</p>
      )}
    </div>
  );
};

export default TrackingPage;
