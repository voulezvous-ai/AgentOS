import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Popover, UnstyledButton, Text, Paper } from '@mantine/core';
import { IconRobot, IconX } from '@tabler/icons-react';
import '../styles/VoxChatWidget.css';

// Um widget flutuante para acesso rápido ao Vox a partir de qualquer página
const VoxChatWidget = () => {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();

  const handleOpenFullChat = () => {
    navigate('/vox');
    setIsOpen(false);
  };

  return (
    <div className="vox-chat-widget">
      <Popover
        opened={isOpen}
        onChange={setIsOpen}
        position="top-end"
        width={300}
        shadow="md"
      >
        <Popover.Target>
          <UnstyledButton
            className="vox-widget-button"
            onClick={() => setIsOpen((o) => !o)}
          >
            <IconRobot size={24} />
          </UnstyledButton>
        </Popover.Target>

        <Popover.Dropdown className="vox-widget-dropdown">
          <Paper withBorder p="sm" className="vox-widget-content">
            <div className="vox-widget-header">
              <Text weight={600}>Vox Assistant</Text>
              <UnstyledButton 
                onClick={() => setIsOpen(false)}
                className="vox-widget-close"
              >
                <IconX size={16} />
              </UnstyledButton>
            </div>
            
            <Text size="sm" color="dimmed" mb="md">
              Acesse o assistente Vox, o guardião central do AgentOS.
            </Text>
            
            <div className="vox-widget-preview">
              <Text size="sm" className="vox-message-preview">
                "Olá! Eu sou o Vox, o guardião central do AgentOS. Como posso ajudar você hoje?"
              </Text>
            </div>
            
            <UnstyledButton 
              className="vox-widget-open-full" 
              onClick={handleOpenFullChat}
            >
              Abrir Chat Completo
            </UnstyledButton>
          </Paper>
        </Popover.Dropdown>
      </Popover>
    </div>
  );
};

export default VoxChatWidget;
