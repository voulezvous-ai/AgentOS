import React, { useState, useEffect } from 'react';
import { 
  Title, 
  Text, 
  Paper, 
  TextInput, 
  Button, 
  Group, 
  Code, 
  Box, 
  Divider,
  Loader,
  Card,
  ScrollArea,
  Badge
} from '@mantine/core';
import { IconTerminal, IconSend, IconHistory } from '@tabler/icons-react';

function PromptosPage() {
  const [command, setCommand] = useState('');
  const [output, setOutput] = useState([]);
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState([]);

  // Função para enviar comandos ao microsserviço promptos
  const sendCommand = async () => {
    if (!command.trim()) return;
    
    setLoading(true);
    
    // Adiciona o comando ao histórico de saída
    setOutput(prev => [...prev, { type: 'command', content: command }]);
    
    try {
      // Simulação de chamada à API do promptos
      // Em produção, substituir por chamada real à API
      setTimeout(() => {
        const response = `Executando comando: "${command}"
> Processando...
> Comando executado com sucesso!`;
        
        setOutput(prev => [...prev, { type: 'response', content: response }]);
        setHistory(prev => [command, ...prev.slice(0, 9)]);
        setCommand('');
        setLoading(false);
      }, 1000);
      
    } catch (error) {
      setOutput(prev => [...prev, { 
        type: 'error', 
        content: `Erro ao executar comando: ${error.message}` 
      }]);
      setLoading(false);
    }
  };

  // Função para lidar com tecla Enter
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !loading) {
      sendCommand();
    }
  };

  // Função para usar comando do histórico
  const useHistoryCommand = (cmd) => {
    setCommand(cmd);
  };

  return (
    <Box p="md">
      <Group position="apart" mb="lg">
        <Title order={2}>
          <IconTerminal size={28} style={{ marginRight: 10, verticalAlign: 'middle' }} />
          PromptOS
        </Title>
        <Badge size="lg" color="blue">CLI Inteligente do AgentOS</Badge>
      </Group>
      
      <Text color="dimmed" mb="xl">
        Interface de linha de comando inteligente para interagir com o ecossistema AgentOS.
      </Text>
      
      <Group grow mb="md">
        <Paper p="md" withBorder>
          <Title order={4} mb="sm">Terminal</Title>
          <ScrollArea h={400} offsetScrollbars>
            {output.map((item, index) => (
              <Box 
                key={index} 
                mb="xs" 
                style={{ 
                  fontFamily: 'monospace',
                  color: item.type === 'error' ? 'red' : 
                         item.type === 'command' ? '#3A61FF' : 'inherit'
                }}
              >
                {item.type === 'command' ? `$ ${item.content}` : item.content}
              </Box>
            ))}
            {loading && (
              <Group>
                <Loader size="sm" />
                <Text>Processando comando...</Text>
              </Group>
            )}
          </ScrollArea>
          
          <Divider my="md" />
          
          <Group>
            <TextInput
              placeholder="Digite um comando..."
              value={command}
              onChange={(e) => setCommand(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={loading}
              style={{ flex: 1 }}
              icon={<IconTerminal size={16} />}
            />
            <Button 
              onClick={sendCommand} 
              disabled={loading || !command.trim()}
              rightIcon={<IconSend size={16} />}
            >
              Enviar
            </Button>
          </Group>
        </Paper>
        
        <Card withBorder>
          <Title order={4} mb="sm">
            <IconHistory size={20} style={{ marginRight: 5, verticalAlign: 'middle' }} />
            Histórico de Comandos
          </Title>
          <ScrollArea h={400} offsetScrollbars>
            {history.length > 0 ? (
              history.map((cmd, index) => (
                <Button 
                  key={index}
                  variant="subtle"
                  fullWidth
                  mb="xs"
                  onClick={() => useHistoryCommand(cmd)}
                  style={{ justifyContent: 'flex-start' }}
                >
                  {cmd}
                </Button>
              ))
            ) : (
              <Text color="dimmed" align="center" py="lg">
                Nenhum comando executado ainda
              </Text>
            )}
          </ScrollArea>
        </Card>
      </Group>
      
      <Paper p="md" withBorder mt="md">
        <Title order={4} mb="sm">Comandos Disponíveis</Title>
        <ScrollArea h={150} offsetScrollbars>
          <Code block>
            help                    - Exibe ajuda sobre comandos disponíveis
            status                  - Verifica o status dos serviços
            deploy [serviço]        - Realiza deploy de um serviço
            logs [serviço]          - Exibe logs de um serviço
            restart [serviço]       - Reinicia um serviço
            list-services           - Lista todos os serviços disponíveis
            sync-env                - Sincroniza variáveis de ambiente
          </Code>
        </ScrollArea>
      </Paper>
    </Box>
  );
}

export default PromptosPage;
