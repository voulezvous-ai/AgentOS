import React from 'react';
import { Container, Title, Paper, Text, Group, SimpleGrid, Badge, Stack, Avatar, Grid } from '@mantine/core';
import { IconBrandWhatsapp, IconMessage, IconUser, IconClock, IconChartLine } from '@tabler/icons-react';

const WhatsAppDashboard = () => {
  // Sample conversation data
  const conversations = [
    { id: 1, name: 'John Smith', message: 'I need help with my order', time: '5 min ago', unread: 2 },
    { id: 2, name: 'Maria Garcia', message: 'When will my order arrive?', time: '15 min ago', unread: 0 },
    { id: 3, name: 'Robert Johnson', message: 'Thanks for your help!', time: '30 min ago', unread: 0 },
    { id: 4, name: 'Sarah Williams', message: 'Is the product in stock?', time: '45 min ago', unread: 1 },
    { id: 5, name: 'David Brown', message: 'Can I get a refund?', time: '1 hour ago', unread: 0 },
  ];

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
      
      <Grid>
        <Grid.Col span={8}>
          <Paper withBorder p="xl" radius="md" mb="xl">
            <Title order={3} mb="md">Recent Conversations</Title>
            <Stack spacing="md">
              {conversations.map((conv) => (
                <Paper key={conv.id} withBorder p="md" radius="md">
                  <Group position="apart">
                    <Group>
                      <Avatar color="blue" radius="xl">{conv.name.charAt(0)}</Avatar>
                      <div>
                        <Group spacing="xs">
                          <Text weight={500}>{conv.name}</Text>
                          {conv.unread > 0 && (
                            <Badge size="sm" color="red" variant="filled" radius="xl">
                              {conv.unread}
                            </Badge>
                          )}
                        </Group>
                        <Text size="sm" color="dimmed">{conv.message}</Text>
                      </div>
                    </Group>
                    <Text size="xs" color="dimmed">{conv.time}</Text>
                  </Group>
                </Paper>
              ))}
            </Stack>
          </Paper>
        </Grid.Col>
        
        <Grid.Col span={4}>
          <SimpleGrid cols={1} spacing="md">
            <Paper withBorder p="md" radius="md">
              <Group>
                <ThemeIcon size="lg" radius="md" color="green">
                  <IconMessage size={20} />
                </ThemeIcon>
                <div>
                  <Text size="xs" color="dimmed" transform="uppercase" weight={700}>
                    Messages Today
                  </Text>
                  <Text weight={700} size="xl">187</Text>
                </div>
              </Group>
            </Paper>
            
            <Paper withBorder p="md" radius="md">
              <Group>
                <ThemeIcon size="lg" radius="md" color="blue">
                  <IconUser size={20} />
                </ThemeIcon>
                <div>
                  <Text size="xs" color="dimmed" transform="uppercase" weight={700}>
                    Active Contacts
                  </Text>
                  <Text weight={700} size="xl">42</Text>
                </div>
              </Group>
            </Paper>
            
            <Paper withBorder p="md" radius="md">
              <Group>
                <ThemeIcon size="lg" radius="md" color="violet">
                  <IconClock size={20} />
                </ThemeIcon>
                <div>
                  <Text size="xs" color="dimmed" transform="uppercase" weight={700}>
                    Avg. Response Time
                  </Text>
                  <Text weight={700} size="xl">3.5 min</Text>
                </div>
              </Group>
            </Paper>
            
            <Paper withBorder p="md" radius="md">
              <Group>
                <ThemeIcon size="lg" radius="md" color="orange">
                  <IconChartLine size={20} />
                </ThemeIcon>
                <div>
                  <Text size="xs" color="dimmed" transform="uppercase" weight={700}>
                    Resolution Rate
                  </Text>
                  <Text weight={700} size="xl">94%</Text>
                </div>
              </Group>
            </Paper>
          </SimpleGrid>
        </Grid.Col>
      </Grid>
      
      <Paper withBorder p="xl" radius="md" mt="xl">
        <Title order={3} mb="md">Integration Status</Title>
        <SimpleGrid cols={3} breakpoints={[{ maxWidth: 'sm', cols: 1 }]}>
          <div>
            <Text weight={500}>API Status</Text>
            <Badge color="green">Operational</Badge>
          </div>
          <div>
            <Text weight={500}>Webhook Status</Text>
            <Badge color="green">Operational</Badge>
          </div>
          <div>
            <Text weight={500}>Message Queue</Text>
            <Badge color="green">Operational</Badge>
          </div>
        </SimpleGrid>
      </Paper>
    </Container>
  );
};

export default WhatsAppDashboard;
