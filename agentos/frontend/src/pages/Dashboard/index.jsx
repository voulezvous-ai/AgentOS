import React from 'react';
import { Container, Grid, Paper, Title, Text, Group, ThemeIcon, SimpleGrid, RingProgress } from '@mantine/core';
import { IconUsers, IconRobot, IconBrandGithub, IconServer, IconTerminal } from '@tabler/icons-react';

const Dashboard = () => {
  return (
    <Container size="lg" py="xl">
      <Title order={1} mb="xl">AgentOS Dashboard</Title>
      
      <SimpleGrid cols={4} breakpoints={[{ maxWidth: 'sm', cols: 1 }]} mb="xl">
        <Paper withBorder p="md" radius="md">
          <Group position="apart">
            <div>
              <Text color="dimmed" size="xs" transform="uppercase" weight={700}>Active Agents</Text>
              <Text weight={700} size="xl">3</Text>
            </div>
            <ThemeIcon color="blue" variant="light" size={38} radius="md">
              <IconRobot size={22} />
            </ThemeIcon>
          </Group>
        </Paper>
        
        <Paper withBorder p="md" radius="md">
          <Group position="apart">
            <div>
              <Text color="dimmed" size="xs" transform="uppercase" weight={700}>Active Users</Text>
              <Text weight={700} size="xl">12</Text>
            </div>
            <ThemeIcon color="teal" variant="light" size={38} radius="md">
              <IconUsers size={22} />
            </ThemeIcon>
          </Group>
        </Paper>
        
        <Paper withBorder p="md" radius="md">
          <Group position="apart">
            <div>
              <Text color="dimmed" size="xs" transform="uppercase" weight={700}>GitHub Commits</Text>
              <Text weight={700} size="xl">87</Text>
            </div>
            <ThemeIcon color="violet" variant="light" size={38} radius="md">
              <IconBrandGithub size={22} />
            </ThemeIcon>
          </Group>
        </Paper>
        
        <Paper withBorder p="md" radius="md">
          <Group position="apart">
            <div>
              <Text color="dimmed" size="xs" transform="uppercase" weight={700}>Services</Text>
              <Text weight={700} size="xl">5</Text>
            </div>
            <ThemeIcon color="orange" variant="light" size={38} radius="md">
              <IconServer size={22} />
            </ThemeIcon>
          </Group>
        </Paper>
      </SimpleGrid>
      
      <Grid>
        <Grid.Col span={8}>
          <Paper withBorder p="md" radius="md" h={300}>
            <Title order={3} mb="md">Recent Activity</Title>
            <Text color="dimmed">
              • Vox Agent completed documentation task (10 min ago)<br />
              • PromptOS service restarted (25 min ago)<br />
              • New user registered (1 hour ago)<br />
              • System update completed (2 hours ago)<br />
              • BookeeperAgent generated monthly report (3 hours ago)
            </Text>
          </Paper>
        </Grid.Col>
        
        <Grid.Col span={4}>
          <Paper withBorder p="md" radius="md" h={300}>
            <Title order={3} mb="md">System Health</Title>
            <Group position="center">
              <RingProgress
                size={150}
                thickness={16}
                sections={[{ value: 87, color: 'green' }]}
                label={
                  <Text size="xl" align="center" weight={700}>
                    87%
                  </Text>
                }
              />
            </Group>
            <Text align="center" mt="md" color="dimmed">System operating normally</Text>
          </Paper>
        </Grid.Col>
      </Grid>
    </Container>
  );
};

export default Dashboard;
