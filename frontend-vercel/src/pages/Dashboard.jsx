import React from 'react';
import { Container, Grid, Paper, Title, Text, Group, ThemeIcon, SimpleGrid, RingProgress, Stack } from '@mantine/core';
import { IconUsers, IconRobot, IconBrandGithub, IconServer, IconTerminal, IconChartBar } from '@tabler/icons-react';

const Dashboard = () => {
  return (
    <Container size="lg" py="xl">
      <Title order={1} mb="xl">AgentOS Dashboard</Title>
      
      <SimpleGrid cols={4} breakpoints={[{ maxWidth: 'sm', cols: 1 }]} mb="xl">
        <Paper withBorder p="md" radius="md">
          <Group position="apart">
            <div>
              <Text color="dimmed" size="xs" transform="uppercase" weight={700}>Active Agents</Text>
              <Text weight={700} size="xl">5</Text>
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
              <Text weight={700} size="xl">7</Text>
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
            <Stack spacing="xs">
              <Group>
                <ThemeIcon color="blue" size="sm" radius="xl">
                  <IconRobot size={14} />
                </ThemeIcon>
                <Text color="dimmed">VoxAgent completed documentation task (10 min ago)</Text>
              </Group>
              <Group>
                <ThemeIcon color="teal" size="sm" radius="xl">
                  <IconTerminal size={14} />
                </ThemeIcon>
                <Text color="dimmed">PromptOS service restarted (25 min ago)</Text>
              </Group>
              <Group>
                <ThemeIcon color="green" size="sm" radius="xl">
                  <IconUsers size={14} />
                </ThemeIcon>
                <Text color="dimmed">New user registered (1 hour ago)</Text>
              </Group>
              <Group>
                <ThemeIcon color="orange" size="sm" radius="xl">
                  <IconServer size={14} />
                </ThemeIcon>
                <Text color="dimmed">System update completed (2 hours ago)</Text>
              </Group>
              <Group>
                <ThemeIcon color="violet" size="sm" radius="xl">
                  <IconChartBar size={14} />
                </ThemeIcon>
                <Text color="dimmed">BookeeperAgent generated monthly report (3 hours ago)</Text>
              </Group>
            </Stack>
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
            <Text align="center" size="xs" color="dimmed">Last checked: 2025-03-27 19:10:00</Text>
          </Paper>
        </Grid.Col>
      </Grid>
      
      <Grid mt="xl">
        <Grid.Col span={6}>
          <Paper withBorder p="md" radius="md">
            <Title order={3} mb="md">Microservices Status</Title>
            <Stack spacing="xs">
              <Group position="apart">
                <Text>AgentOS-Core</Text>
                <Text color="green">Operational</Text>
              </Group>
              <Group position="apart">
                <Text>AgentOS-Frontend</Text>
                <Text color="green">Operational</Text>
              </Group>
              <Group position="apart">
                <Text>AgentOS-API</Text>
                <Text color="green">Operational</Text>
              </Group>
              <Group position="apart">
                <Text>AgentOS-Vox</Text>
                <Text color="green">Operational</Text>
              </Group>
              <Group position="apart">
                <Text>AgentOS-Bookeeper</Text>
                <Text color="green">Operational</Text>
              </Group>
              <Group position="apart">
                <Text>AgentOS-Metrics</Text>
                <Text color="green">Operational</Text>
              </Group>
              <Group position="apart">
                <Text>AgentOS-WebSocket</Text>
                <Text color="green">Operational</Text>
              </Group>
            </Stack>
          </Paper>
        </Grid.Col>
        
        <Grid.Col span={6}>
          <Paper withBorder p="md" radius="md">
            <Title order={3} mb="md">Deployment Status</Title>
            <Stack spacing="xs">
              <Group position="apart">
                <Text>Frontend (Vercel)</Text>
                <Text color="green">Deployed</Text>
              </Group>
              <Group position="apart">
                <Text>Backend (Railway)</Text>
                <Text color="green">Deployed</Text>
              </Group>
              <Group position="apart">
                <Text>Last Deployment</Text>
                <Text>2025-03-27 19:15:00</Text>
              </Group>
              <Group position="apart">
                <Text>Build Status</Text>
                <Text color="green">Success</Text>
              </Group>
              <Group position="apart">
                <Text>CI/CD Pipeline</Text>
                <Text color="green">Operational</Text>
              </Group>
            </Stack>
          </Paper>
        </Grid.Col>
      </Grid>
    </Container>
  );
};

export default Dashboard;
