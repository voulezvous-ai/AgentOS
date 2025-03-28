import React, { useState } from 'react';
import { Paper, Avatar, Group, Text, ActionIcon, Popover, Textarea, Button, Stack, Box } from '@mantine/core';
import { IconRobot, IconMessageCircle, IconX, IconSend } from '@tabler/icons-react';

const VoxChatWidget = () => {
  const [opened, setOpened] = useState(false);

  return (
    <Popover
      opened={opened}
      onChange={setOpened}
      position="top-end"
      width={320}
      shadow="md"
      withinPortal
    >
      <Popover.Target>
        <ActionIcon
          color="blue"
          variant="filled"
          radius="xl"
          size="xl"
          onClick={() => setOpened((o) => !o)}
          sx={{
            position: 'fixed',
            bottom: 20,
            right: 20,
            zIndex: 1000,
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
          }}
        >
          {opened ? <IconX size={24} /> : <IconMessageCircle size={24} />}
        </ActionIcon>
      </Popover.Target>

      <Popover.Dropdown p={0}>
        <Paper radius="md" withBorder>
          <Group position="apart" p="md" sx={{ borderBottom: '1px solid #eaeaea' }}>
            <Group>
              <Avatar color="blue" radius="xl">
                <IconRobot size={20} />
              </Avatar>
              <Text weight={500}>Vox Assistant</Text>
            </Group>
            <ActionIcon onClick={() => setOpened(false)}>
              <IconX size={18} />
            </ActionIcon>
          </Group>

          <Stack spacing="xs" sx={{ height: '300px', overflowY: 'auto' }} p="md">
            <Group align="flex-start" spacing="xs">
              <Avatar color="blue" radius="xl" size="sm">
                <IconRobot size={16} />
              </Avatar>
              <Box sx={{ maxWidth: '80%' }}>
                <Paper p="sm" radius="md" withBorder>
                  <Text size="sm">Hello! I'm Vox, your AI assistant. How can I help you today?</Text>
                </Paper>
              </Box>
            </Group>
          </Stack>

          <Group position="apart" p="md" sx={{ borderTop: '1px solid #eaeaea' }}>
            <Textarea
              placeholder="Type your message..."
              sx={{ flex: 1 }}
              autosize
              minRows={1}
              maxRows={3}
            />
            <Button color="blue" radius="xl" px={12}>
              <IconSend size={16} />
            </Button>
          </Group>
        </Paper>
      </Popover.Dropdown>
    </Popover>
  );
};

export default VoxChatWidget;
