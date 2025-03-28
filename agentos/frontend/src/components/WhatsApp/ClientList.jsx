import React, { useState, useEffect } from 'react';
import { Table, Button, Badge, Group, Text, Card, Loader, ActionIcon, useMantineTheme } from '@mantine/core';
import { IconRefresh, IconQrcode, IconTrash, IconCheck } from '@tabler/icons-react';
import { getActiveClients, generateQRCode, removeWhatsAppClient } from '../../api/whatsappService';
import ActionIcons from './ActionIcons';

const ClientList = ({ onSelectClient }) => {
  const theme = useMantineTheme();
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchClients = async () => {
    setLoading(true);
    try {
      const data = await getActiveClients();
      setClients(data);
      setError(null);
    } catch (err) {
      setError('Falha ao carregar clientes WhatsApp');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClients();
  }, []);

  const handleGenerateQR = async (clientId) => {
    try {
      await generateQRCode(clientId);
      fetchClients(); // Recarregar para obter o novo QR
    } catch (err) {
      console.error('Erro ao gerar QR code:', err);
    }
  };

  const handleRemoveClient = async (clientId) => {
    if (window.confirm('Tem certeza que deseja remover este cliente?')) {
      try {
        await removeWhatsAppClient(clientId);
        fetchClients();
      } catch (err) {
        console.error('Erro ao remover cliente:', err);
      }
    }
  };

  if (loading) {
    return (
      <Card p="xl" withBorder shadow="sm" radius="md">
        <Group position="center">
          <Loader color={theme.primaryColor} />
          <Text>Carregando clientes...</Text>
        </Group>
      </Card>
    );
  }

  if (error) {
    return (
      <Card p="xl" withBorder shadow="sm" radius="md" styles={{ root: { borderColor: theme.colors.red[5] } }}>
        <Text color="red">{error}</Text>
        <Button onClick={fetchClients} leftIcon={<IconRefresh size={16} />} mt="md" color="red">
          Tentar novamente
        </Button>
      </Card>
    );
  }

  return (
    <Card p="md" withBorder shadow="sm" radius="md">
      <Group position="apart" mb="md">
        <Text weight={700} size="lg">Clientes WhatsApp</Text>
        <Button 
          onClick={fetchClients} 
          leftIcon={<IconRefresh size={16} />} 
          variant="subtle"
          color={theme.primaryColor}
        >
          Atualizar
        </Button>
      </Group>

      {clients.length === 0 ? (
        <Text color="dimmed" align="center" py="xl">
          Nenhum cliente WhatsApp encontrado
        </Text>
      ) : (
        <Table striped highlightOnHover>
          <thead>
            <tr>
              <th>ID</th>
              <th>Tipo</th>
              <th>Número</th>
              <th>Status</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {clients.map((client) => (
              <tr key={client.id} onClick={() => onSelectClient(client.id)} style={{ cursor: 'pointer' }}>
                <td>{client.id}</td>
                <td>
                  <Badge 
                    color={client.type === 'bailey' ? 'blue' : 'violet'}
                    variant="light"
                    size="sm"
                  >
                    {client.type === 'bailey' ? 'Grupos' : 'Direto'}
                  </Badge>
                </td>
                <td>{client.phoneNumber}</td>
                <td>
                  <Badge 
                    color={client.isReady ? 'green' : 'orange'}
                    variant="dot"
                    size="sm"
                  >
                    {client.isReady ? 'Conectado' : 'Desconectado'}
                  </Badge>
                </td>
                <td>
                  <ActionIcons 
                    clientId={client.id} 
                    onGenerateQR={handleGenerateQR} 
                    onRemoveClient={handleRemoveClient}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}
    </Card>
  );
};

export default ClientList;
