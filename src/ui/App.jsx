import React, { useState, useEffect } from 'react';
import { Box, Text, useInput, useApp } from 'ink';
import figlet from 'figlet';
import InteractiveShell from './components/InteractiveShell.jsx';
import ProcessingStatus from './components/ProcessingStatus.jsx';
import Help from './components/Help.jsx';
import { getProgramsByCategory, getProgramData } from '../core/jsonLoader.js';
import { runWinget, runWingetBatch } from '../core/wingetRun.js';

const App = () => {
  const { exit } = useApp();
  const [isExecuting, setIsExecuting] = useState(false);
  const [banner, setBanner] = useState('');
  const [showHelp, setShowHelp] = useState(false);

  // Buffer alternativo para aislar de estilos de terminal y Winget
  useEffect(() => {
    // Entrar en buffer alternativo (\x1b[?1049h)
    process.stdout.write('\x1b[?1049h');
    
    setBanner(figlet.textSync('WINGET CLI', { font: 'Small' }));

    return () => {
      // Salir del buffer alternativo al cerrar (\x1b[?1049l)
      process.stdout.write('\x1b[?1049l');
    };
  }, []);

  const handleExecute = async (commandString) => {
    const cleanCommand = commandString.trim();
    
    if (cleanCommand === '/help') {
      setShowHelp(true);
      return;
    }

    if (cleanCommand === '/exit' || cleanCommand === '/quit') {
        exit();
        return;
    }
    
    setShowHelp(false);

    const parts = cleanCommand.split(' ');
    const verb = parts[0].startsWith('/') ? parts[0].slice(1) : parts[0];
    const param = parts[1] ? parts[1].replace('--', '') : null;
    const extra = parts[2] || null;

    if (!verb) return;

    setIsExecuting(true);
    
    try {
      if (param === 'all') {
        const data = getProgramData();
        for (const cat in data) {
          await runWingetBatch(verb, data[cat]);
        }
      } else if (param === 'custom' && extra) {
        await runWinget(verb, extra);
      } else if (param) {
        const ids = getProgramsByCategory(param);
        await runWingetBatch(verb, ids);
      }
    } catch (error) {
      console.error('\nError:', error.message);
    } finally {
      setIsExecuting(false);
    }
  };

  return (
    <Box flexDirection="column" width="100%" height="100%" padding={1}>
      {/* Área Superior (Visualización) */}
      <Box flexDirection="column" flexGrow={1}>
        <Text color="cyan">{banner}</Text>
        
        {showHelp && <Help />}
        
        {!showHelp && !isExecuting && (
          <Box marginTop={1} flexDirection="column">
            <Text color="gray">Modo Shell Interactiva Aislada.</Text>
            <Text color="gray">Escribe <Text color="yellow">/help</Text> para ayuda o <Text color="yellow">/exit</Text> para salir.</Text>
          </Box>
        )}
      </Box>

      {/* Área Inferior (Control) */}
      <Box flexDirection="column" width="100%">
        <ProcessingStatus isExecuting={isExecuting} />
        <InteractiveShell onExecute={handleExecute} isExecuting={isExecuting} />
      </Box>
    </Box>
  );
};

export default App;
