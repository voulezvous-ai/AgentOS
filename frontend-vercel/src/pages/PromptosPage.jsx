import React, { useState, useRef, useEffect } from 'react';
import { Box, Title, Text, Container, Paper, Code, Divider, TextInput, Group, ActionIcon, ScrollArea } from '@mantine/core';
import { IconTerminal, IconSend } from '@tabler/icons-react';

const PromptosPage = () => {
  const [commandHistory, setCommandHistory] = useState([
    { type: 'system', content: 'Welcome to PromptOS v1.0.0' },
    { type: 'system', content: 'Type "help" to see available commands' }
  ]);
  const [currentCommand, setCurrentCommand] = useState('');
  const viewportRef = useRef(null);

  // Scroll to bottom when command history updates
  useEffect(() => {
    if (viewportRef.current) {
      viewportRef.current.scrollTo({ top: viewportRef.current.scrollHeight, behavior: 'smooth' });
    }
  }, [commandHistory]);

  // Process command
  const processCommand = (cmd) => {
    // Add user command to history
    setCommandHistory(prev => [...prev, { type: 'user', content: cmd }]);
    
    // Process command
    const lowerCmd = cmd.toLowerCase().trim();
    
    if (lowerCmd === 'help') {
      setCommandHistory(prev => [...prev, { 
        type: 'system', 
        content: `Available commands:
  help                  Display this help message
  version               Show PromptOS version
  clear                 Clear the terminal
  agent <name> <task>   Run a specific agent with a task
  list agents           List all available agents
  connect <service>     Connect to an external service
  status                Show system status`
      }]);
    } 
    else if (lowerCmd === 'version') {
      setCommandHistory(prev => [...prev, { 
        type: 'system', 
        content: 'PromptOS v1.0.0 (Build 2025.03.27)' 
      }]);
    }
    else if (lowerCmd === 'clear') {
      setCommandHistory([
        { type: 'system', content: 'Terminal cleared' }
      ]);
    }
    else if (lowerCmd === 'list agents') {
      setCommandHistory(prev => [...prev, { 
        type: 'system', 
        content: `Available agents:
  - VoxAgent         General purpose AI assistant
  - BookkeeperAgent  Documentation and logging assistant
  - DevOpsAgent      Deployment and infrastructure assistant
  - SecurityAgent    Security monitoring and auditing
  - AnalyticsAgent   Data analysis and reporting`
      }]);
    }
    else if (lowerCmd === 'status') {
      setCommandHistory(prev => [...prev, { 
        type: 'system', 
        content: `System Status:
  - CPU: 12% utilization
  - Memory: 1.2GB / 8GB
  - Disk: 34.5GB free
  - Network: 5 active connections
  - Services: All operational
  - Last backup: 2025-03-27 12:00:00`
      }]);
    }
    else if (lowerCmd.startsWith('agent ')) {
      const parts = cmd.split(' ');
      if (parts.length >= 3) {
        const agentName = parts[1];
        const task = parts.slice(2).join(' ');
        setCommandHistory(prev => [...prev, { 
          type: 'system', 
          content: `Executing task with ${agentName}:\n"${task}"\n\nProcessing...` 
        }]);
        
        // Simulate agent response after a delay
        setTimeout(() => {
          setCommandHistory(prev => [...prev, { 
            type: 'system', 
            content: `${agentName} completed task:\n"${task}"\n\nResult: Task executed successfully.` 
          }]);
        }, 2000);
      } else {
        setCommandHistory(prev => [...prev, { 
          type: 'system', 
          content: 'Error: Invalid command format. Use "agent <name> <task>"' 
        }]);
      }
    }
    else if (lowerCmd.startsWith('connect ')) {
      const service = cmd.split(' ')[1];
      setCommandHistory(prev => [...prev, { 
        type: 'system', 
        content: `Connecting to ${service}...\nConnection established.` 
      }]);
    }
    else {
      setCommandHistory(prev => [...prev, { 
        type: 'system', 
        content: `Command not recognized: ${cmd}\nType "help" for available commands.` 
      }]);
    }
    
    // Clear current command
    setCurrentCommand('');
  };

  // Handle command submission
  const handleSubmit = (e) => {
    e.preventDefault();
    if (currentCommand.trim()) {
      processCommand(currentCommand);
    }
  };

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
          <ScrollArea h={300} viewportRef={viewportRef}>
            {commandHistory.map((item, index) => (
              <Box key={index} mb={10}>
                {item.type === 'user' ? (
                  <Group spacing="xs">
                    <Text color="blue" component="span">$</Text>
                    <Code sx={{ backgroundColor: 'transparent' }}>{item.content}</Code>
                  </Group>
                ) : (
                  <Text sx={{ whiteSpace: 'pre-wrap' }}>{item.content}</Text>
                )}
              </Box>
            ))}
          </ScrollArea>
          
          <form onSubmit={handleSubmit}>
            <Group mt="md">
              <Text color="blue" component="span">$</Text>
              <TextInput
                sx={{ flex: 1 }}
                value={currentCommand}
                onChange={(e) => setCurrentCommand(e.target.value)}
                placeholder="Type a command..."
                variant="unstyled"
              />
              <ActionIcon type="submit" color="blue" variant="subtle">
                <IconSend size={18} />
              </ActionIcon>
            </Group>
          </form>
        </Paper>
      </Paper>
    </Container>
  );
};

export default PromptosPage;
