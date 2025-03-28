import React from 'react';
import { Container, Title, Paper, Text, Group, Avatar, Textarea, Button, Stack, Box } from '@mantine/core';
import { IconRobot, IconSend, IconMicrophone } from '@tabler/icons-react';

const VoxPage = () => {
  return (
    <Container size="lg" py="xl">
      <Group mb="xl">
        <IconRobot size={32} />
        <Title order={1}>Vox AI Assistant</Title>
      </Group>
      
      <Paper withBorder p="md" radius="md" mb="xl">
        <Text size="lg" mb="xl">
          Vox is your AI assistant for AgentOS. Ask questions, request tasks, or get help with any aspect of the system.
        </Text>
        
        <Stack spacing="md" sx={{ height: '400px', overflowY: 'auto' }} mb="md" p="md">
          {/* AI Message */}
          <Group align="flex-start" spacing="xs">
            <Avatar color="blue" radius="xl">
              <IconRobot size={24} />
            </Avatar>
            <Box sx={{ maxWidth: '80%' }}>
              <Paper p="md" radius="md" withBorder>
                <Text>Hello! I'm Vox, your AI assistant for AgentOS. How can I help you today?</Text>
              </Paper>
              <Text size="xs" color="dimmed" mt={4}>Vox • 2 min ago</Text>
            </Box>
          </Group>
          
          {/* User Message */}
          <Group align="flex-start" spacing="xs" position="right">
            <Box sx={{ maxWidth: '80%' }}>
              <Paper p="md" radius="md" bg="blue.5" sx={{ color: 'white' }}>
                <Text>Can you help me understand how the AgentOS architecture works?</Text>
              </Paper>
              <Text size="xs" color="dimmed" mt={4} align="right">You • 1 min ago</Text>
            </Box>
            <Avatar radius="xl">U</Avatar>
          </Group>
          
          {/* AI Response */}
          <Group align="flex-start" spacing="xs">
            <Avatar color="blue" radius="xl">
              <IconRobot size={24} />
            </Avatar>
            <Box sx={{ maxWidth: '80%' }}>
              <Paper p="md" radius="md" withBorder>
                <Text>
                  AgentOS is designed as a comprehensive enterprise software architecture with multiple components:
                  <br /><br />
                  1. <b>Core Services</b>: Documentation, deployment orchestration<br />
                  2. <b>Frontend</b>: UI components and user experience<br />
                  3. <b>API Gateway</b>: Authentication and service routing<br />
                  4. <b>Vox</b>: AI assistant integration (that's me!)<br />
                  5. <b>Bookeeper</b>: Logging and audit trails<br />
                  6. <b>Metrics</b>: Monitoring and dashboards<br />
                  7. <b>WebSocket</b>: Real-time communication<br />
                  <br />
                  Each component is designed to be modular, scalable, and follows high standards for code quality, testing, and documentation. Would you like me to elaborate on any specific component?
                </Text>
              </Paper>
              <Text size="xs" color="dimmed" mt={4}>Vox • Just now</Text>
            </Box>
          </Group>
        </Stack>
        
        <Group position="apart" align="flex-end">
          <Textarea
            placeholder="Ask Vox a question..."
            sx={{ flex: 1 }}
            autosize
            minRows={2}
            maxRows={4}
          />
          <Group>
            <Button variant="outline" color="blue">
              <IconMicrophone size={20} />
            </Button>
            <Button color="blue">
              <IconSend size={20} />
            </Button>
          </Group>
        </Group>
      </Paper>
    </Container>
  );
};

export default VoxPage;
