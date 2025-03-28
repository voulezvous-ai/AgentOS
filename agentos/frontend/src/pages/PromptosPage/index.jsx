import React from 'react';
import { Box, Title, Text, Container, Paper, Code, Divider } from '@mantine/core';
import { IconTerminal } from '@tabler/icons-react';

const PromptosPage = () => {
  return (
    <Container size="lg" py="xl">
      <Paper shadow="md" p="xl" radius="md" withBorder>
        <Box sx={{ display: 'flex', alignItems: 'center', marginBottom: 20 }}>
          <IconTerminal size={32} stroke={1.5} />
          <Title order={1} ml="md">PromptOS</Title>
        </Box>
        
        <Divider my="lg" />
        
        <Text size="lg" mb="md">
          Welcome to PromptOS, the command-line interface for AgentOS. This terminal provides a powerful way to interact with the AgentOS ecosystem.
        </Text>
        
        <Paper withBorder p="md" bg="dark.8" mb="xl">
          <Code block sx={{ backgroundColor: 'transparent', color: 'white' }}>
            {`$ promptos help
            
Available commands:
  help                  Display this help message
  version               Show PromptOS version
  agent <name> <task>   Run a specific agent with a task
  list agents           List all available agents
  connect <service>     Connect to an external service
  status                Show system status`}
          </Code>
        </Paper>
        
        <Text size="md">
          Type commands in the terminal below to get started. Try 'help' for a list of available commands.
        </Text>
        
        <Paper withBorder p="md" bg="dark.8" mt="lg">
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Text color="dimmed" mr={5}>$</Text>
            <Code block sx={{ backgroundColor: 'transparent', color: 'white', flex: 1 }}>
              {`_`}
            </Code>
          </Box>
        </Paper>
      </Paper>
    </Container>
  );
};

export default PromptosPage;
