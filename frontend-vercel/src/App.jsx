import React, { useState } from 'react';
import { AppShell, Header, Navbar, UnstyledButton, Group, Text, ThemeIcon, createStyles, Divider } from '@mantine/core';
import { Routes, Route, Link, Navigate, useLocation } from 'react-router-dom';
import { 
  IconDashboard, 
  IconBrandWhatsapp, 
  IconUsers, 
  IconCalendar, 
  IconSettings,
  IconDeviceNfc,
  IconRobot,
  IconTerminal
} from '@tabler/icons-react';

// Pages
import Dashboard from './pages/Dashboard';
import WhatsAppDashboard from './pages/WhatsAppDashboard';
import RFIDManagement from './pages/RFIDManagement';
import VoxPage from './pages/VoxPage';
import PromptosPage from './pages/PromptosPage';
import VoxChatWidget from './components/VoxChatWidget';

// Styles for navigation items
const useStyles = createStyles((theme) => ({
  link: {
    display: 'block',
    width: '100%',
    padding: theme.spacing.xs,
    borderRadius: theme.radius.sm,
    color: theme.colors.dark[0],
    '&:hover': {
      backgroundColor: theme.colors.dark[6],
    },
  },
  linkActive: {
    '&, &:hover': {
      backgroundColor: theme.fn.variant({ variant: 'light', color: theme.primaryColor }).background,
      color: theme.fn.variant({ variant: 'light', color: theme.primaryColor }).color,
    },
  },
}));

// Navigation item component
const NavItem = ({ icon, color, label, path, active, onClick }) => {
  const { classes, cx } = useStyles();
  
  return (
    <UnstyledButton
      className={cx(classes.link, { [classes.linkActive]: active })}
      onClick={onClick}
      component={Link}
      to={path}
    >
      <Group>
        <ThemeIcon color={color} variant="light">
          {icon}
        </ThemeIcon>
        <Text size="sm">{label}</Text>
      </Group>
    </UnstyledButton>
  );
};

// Main App component
function App() {
  const location = useLocation();
  const [opened, setOpened] = useState(false);
  
  // Navigation items configuration
  const navItems = [
    { 
      icon: <IconTerminal size={16} />, 
      color: 'blue', 
      label: 'PromptOS', 
      path: '/' 
    },
    { 
      icon: <IconDashboard size={16} />, 
      color: 'teal', 
      label: 'Dashboard', 
      path: '/dashboard' 
    },
    { 
      icon: <IconBrandWhatsapp size={16} />, 
      color: 'green', 
      label: 'WhatsApp', 
      path: '/whatsapp' 
    },
    { 
      icon: <IconDeviceNfc size={16} />, 
      color: 'orange', 
      label: 'RFID', 
      path: '/rfid' 
    },
    { 
      icon: <IconRobot size={16} />, 
      color: 'violet', 
      label: 'Vox AI', 
      path: '/vox' 
    },
  ];

  return (
    <AppShell
      padding="md"
      navbar={
        <Navbar width={{ base: 250 }} p="xs" hiddenBreakpoint="sm" hidden={!opened}>
          <Navbar.Section grow mt="md">
            {navItems.map((item) => (
              <NavItem
                key={item.path}
                icon={item.icon}
                color={item.color}
                label={item.label}
                path={item.path}
                active={location.pathname === item.path}
                onClick={() => setOpened(false)}
              />
            ))}
          </Navbar.Section>
          
          <Navbar.Section>
            <Divider my="sm" />
            <NavItem
              icon={<IconSettings size={16} />}
              color="gray"
              label="Settings"
              path="/settings"
              active={location.pathname === '/settings'}
              onClick={() => setOpened(false)}
            />
          </Navbar.Section>
        </Navbar>
      }
      header={
        <Header height={60} p="xs">
          <Group position="apart">
            <Group>
              <Text size="xl" weight={700}>AgentOS</Text>
            </Group>
          </Group>
        </Header>
      }
      styles={(theme) => ({
        main: { backgroundColor: theme.colors.dark[8] },
      })}
    >
      <Routes>
        <Route path="/" element={<PromptosPage />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/whatsapp" element={<WhatsAppDashboard />} />
        <Route path="/rfid" element={<RFIDManagement />} />
        <Route path="/vox" element={<VoxPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      
      <VoxChatWidget />
    </AppShell>
  );
}

export default App;
