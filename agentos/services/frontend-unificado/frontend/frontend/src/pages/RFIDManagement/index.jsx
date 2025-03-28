import React from 'react';
import { Container, Title, Paper, Text, Group, SimpleGrid, Badge, Button, Table } from '@mantine/core';
import { IconDeviceNfc, IconPlus, IconRefresh } from '@tabler/icons-react';

const RFIDManagement = () => {
  // Sample RFID data
  const rfidData = [
    { id: '5F2A3B9C', name: 'Employee Badge', status: 'Active', lastSeen: '2025-03-27 15:30:22' },
    { id: 'A1B2C3D4', name: 'Visitor Pass', status: 'Inactive', lastSeen: '2025-03-25 09:15:47' },
    { id: 'E5F6G7H8', name: 'Security Access', status: 'Active', lastSeen: '2025-03-27 16:45:10' },
    { id: 'I9J0K1L2', name: 'Equipment Tag', status: 'Active', lastSeen: '2025-03-27 14:20:35' },
    { id: 'M3N4O5P6', name: 'Asset Tracker', status: 'Active', lastSeen: '2025-03-26 11:05:18' },
  ];

  return (
    <Container size="lg" py="xl">
      <Group mb="xl">
        <IconDeviceNfc size={32} />
        <Title order={1}>RFID Management</Title>
      </Group>
      
      <Group position="apart" mb="md">
        <Text size="lg">Manage your RFID tags and devices</Text>
        <Group>
          <Button leftIcon={<IconRefresh size={16} />} variant="outline">Refresh</Button>
          <Button leftIcon={<IconPlus size={16} />} color="blue">Add New Tag</Button>
        </Group>
      </Group>
      
      <Paper withBorder p="md" radius="md" mb="xl">
        <Title order={3} mb="md">RFID Tags</Title>
        <Table striped highlightOnHover>
          <thead>
            <tr>
              <th>Tag ID</th>
              <th>Name</th>
              <th>Status</th>
              <th>Last Seen</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {rfidData.map((tag) => (
              <tr key={tag.id}>
                <td><code>{tag.id}</code></td>
                <td>{tag.name}</td>
                <td>
                  <Badge 
                    color={tag.status === 'Active' ? 'green' : 'gray'}
                  >
                    {tag.status}
                  </Badge>
                </td>
                <td>{tag.lastSeen}</td>
                <td>
                  <Group spacing="xs">
                    <Button variant="subtle" size="xs">Edit</Button>
                    <Button variant="subtle" size="xs" color="red">Disable</Button>
                  </Group>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      </Paper>
      
      <SimpleGrid cols={2} breakpoints={[{ maxWidth: 'sm', cols: 1 }]}>
        <Paper withBorder p="xl" radius="md">
          <Title order={3} mb="md">Reader Status</Title>
          <Group mb="md">
            <Badge color="green" size="lg">Online</Badge>
            <Text>Last heartbeat: 2 minutes ago</Text>
          </Group>
          <Text>Total reads today: 156</Text>
          <Text>Unique tags detected: 23</Text>
          <Text>Signal strength: Excellent</Text>
        </Paper>
        
        <Paper withBorder p="xl" radius="md">
          <Title order={3} mb="md">Recent Activity</Title>
          <Text color="dimmed">
            • Tag E5F6G7H8 detected at Main Entrance (5 min ago)<br />
            • Tag 5F2A3B9C detected at Server Room (15 min ago)<br />
            • Tag I9J0K1L2 detected at Equipment Storage (30 min ago)<br />
            • New tag registered in system (45 min ago)<br />
            • Reader firmware updated (1 hour ago)
          </Text>
        </Paper>
      </SimpleGrid>
    </Container>
  );
};

export default RFIDManagement;
