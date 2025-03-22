import React from 'react';
import { Group, ActionIcon } from '@mantine/core';
import { IconQrcode, IconTrash } from '@tabler/icons-react';

const ActionIcons = ({ clientId, onGenerateQR, onRemoveClient }) => (
  <Group spacing={8}>
    <ActionIcon 
      color="blue" 
      onClick={(e) => {
        e.stopPropagation();
        onGenerateQR(clientId);
      }}
      title="Gerar QR Code"
    >
      <IconQrcode size={16} />
    </ActionIcon>
    <ActionIcon 
      color="red" 
      onClick={(e) => {
        e.stopPropagation();
        onRemoveClient(clientId);
      }}
      title="Remover cliente"
    >
      <IconTrash size={16} />
    </ActionIcon>
  </Group>
);

export default ActionIcons;
