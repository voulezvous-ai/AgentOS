import React from 'react';
import { Container, Title, Paper, Text, Group, SimpleGrid, Badge } from '@mantine/core';
import { IconBrandWhatsapp } from '@tabler/icons-react';

const WhatsAppDashboard = () => {
  return (
    <Container size="lg" py="xl">
      <Group mb="xl">
        <IconBrandWhatsapp size={32} color="#25D366" />
        <Title order={1}>WhatsApp Integration</Title>
      </Group>
      
      <Paper withBorder p="xl" radius="md" mb="xl">
        <Title order={3} mb="md">Connection Status</Title>
        <Group>
          <Badge color="green" size="lg">Connected</Badge>
          <Text>Last sync: 10 minutes ago</Text>
        </Group>
      </Paper>
      
      <SimpleGrid cols={2} breakpoints={[{ maxWidth: 'sm', cols: 1 }]}>
        <Paper withBorder p="xl" radius="md">
          <Title order={3} mb="md">Recent Messages</Title>
          <Text color="dimmed">
            • Customer inquiry about product availability (5 min ago)<br />
            • Support request from existing client (15 min ago)<br />
            • New lead requesting information (30 min ago)<br />
            • Automated response sent to inquiry (45 min ago)<br />
            • Agent handover from bot to human agent (1 hour ago)
          </Text>
        </Paper>
        
        <Paper withBorder p="xl" radius="md">
          <Title order={3} mb="md">Analytics</Title>
          <Text>Total conversations: 156</Text>
          <Text>Active conversations: 23</Text>
          <Text>Messages sent today: 87</Text>
          <Text>Messages received today: 104</Text>
          <Text>Average response time: 3.5 minutes</Text>
        </Paper>
      </SimpleGrid>
    </Container>
  );
};

export default WhatsAppDashboard;
