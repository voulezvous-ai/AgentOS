
import React, { useEffect, useState } from 'react';
import axios from 'axios';

const OrderDetails = ({ orderId, userType }) => {
  const [trackingLinks, setTrackingLinks] = useState(null);

  useEffect(() => {
    axios.get(`/api/orders/${orderId}`).then((response) => {
      setTrackingLinks(response.data.trackingLinks);
    });
  }, [orderId]);

  return (
    <div>
      {trackingLinks ? (
        <a href={userType === 'customer' ? trackingLinks.customer : trackingLinks.courier} target="_blank" rel="noopener noreferrer">
          Acompanhar Pedido
        </a>
      ) : (
        <p>Carregando link...</p>
      )}
    </div>
  );
};

export default OrderDetails;
