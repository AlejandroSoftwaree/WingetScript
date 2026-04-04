import React, { useState, useEffect } from 'react';
import { Box, Text, useInput, useApp, Static } from 'ink';
import figlet from 'figlet';
import InteractiveShell from './components/InteractiveShell.jsx';
import ProcessingStatus from './components/ProcessingStatus.jsx';
import Help from './components/Help.jsx';
import IdManager from './components/IdManager.jsx';
import UtilityManager from './components/UtilityManager.jsx';
import { getProgramsByCategory, getProgramData } from '../core/jsonLoader.js';
import { runWinget, runWingetBatch } from '../core/wingetRun.js';
import { setWin10ContextMenu, setWin11ContextMenu, exportDirectoryTree } from '../core/systemUtils.js';

const App = () => {
  const { exit } = useApp();
  const [isExecuting, setIsExecuting] = useState(false);
  const [idCommand, setIdCommand] = useState(null);
  const [outputs, setOutputs] = useState([{ id: 'banner', type: 'banner' }]);

  useEffect(() => {
    // Inicia app
  }, []);

  const handleExecute = async (commandString) => {
    const cleanCommand = commandString.trim();
    
    setOutputs(prev => [...prev, { id: Date.now().toString() + '_cmd', type: 'command_log', input: commandString }]);

    if (cleanCommand === '/help') {
      setOutputs(prev => [...prev, { id: Date.now().toString(), type: 'help' }]);
      return;
    }

    if (cleanCommand === '/exit' || cleanCommand === '/quit') {
        console.clear();
        exit();
        return;
    }

    const parts = cleanCommand.split(' ');
    const verb = parts[0].startsWith('/') ? parts[0].slice(1) : parts[0];
    const param = parts[1] ? parts[1].replace('--', '') : null;
    const extra = parts[2] || null;

    if (!verb) return;

    if (verb === 'id') {
      if (param === 'list') {
         setOutputs(prev => [...prev, { id: Date.now().toString(), type: 'idList' }]);
         return;
      }
      setIdCommand({ action: param, value1: extra, value2: parts[3] || null });
      return;
    }

    if (verb === 'utility') {
      if (param === 'testColor') {
          setOutputs(prev => [...prev, { id: Date.now().toString(), type: 'utility', action: param }]);
          return;
      }
      try {
        setIsExecuting(true);
        if (param === 'addWin10') {
           const res = await setWin10ContextMenu();
           setOutputs(prev => [...prev, { id: Date.now().toString(), type: 'utility', action: param, payload: res }]);
        } else if (param === 'addWin11') {
           const res = await setWin11ContextMenu();
           setOutputs(prev => [...prev, { id: Date.now().toString(), type: 'utility', action: param, payload: res }]);
        } else if (param === 'exportDirectory') {
           if (!extra || !parts[3]) {
              setOutputs(prev => [...prev, { id: Date.now().toString(), type: 'utility', action: 'error', payload: 'Faltan parámetros.\nSintaxis: /utility exportDirectory <origen> <destino.txt>' }]);
           } else {
              const res = await exportDirectoryTree(extra, parts[3]);
              setOutputs(prev => [...prev, { id: Date.now().toString(), type: 'utility', action: param, payload: res }]);
           }
        }
      } catch (err) {
         setOutputs(prev => [...prev, { id: Date.now().toString(), type: 'utility', action: 'error', payload: err.message }]);
      } finally {
         setIsExecuting(false);
      }
      return;
    }

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
    <Box flexDirection="column" width="100%" padding={1}>
      <Static items={outputs}>
        {item => {
          if (item.type === 'banner') return <Text key={item.id} color="cyan">{figlet.textSync('WINGET CLI', { font: 'Small' })}</Text>;
          if (item.type === 'command_log') return (
            <Box key={item.id} borderStyle="round" borderColor="gray" paddingX={1} marginX={1} width={process.stdout.columns - 4} paddingBottom={0} marginBottom={0}>
              <Text color="cyan">❯ </Text>
              <Text>{item.input}</Text>
            </Box>
          );
          if (item.type === 'help') return <Help key={item.id} />;
          if (item.type === 'idList') return <IdManager key={item.id} command={{action: 'list'}} />;
          if (item.type === 'utility') return <UtilityManager key={item.id} action={item.action} payload={item.payload} />;
          return null;
        }}
      </Static>

      <Box flexDirection="column" width="100%">
        {idCommand && <IdManager command={idCommand} onFinished={() => setIdCommand(null)} />}
        
        {!idCommand && !isExecuting && outputs.length === 1 && (
          <Box marginTop={1} flexDirection="column" marginX={1}>
            <Text color="gray">Modo Shell Interactiva Libre.</Text>
            <Text color="gray">Escribe <Text color="yellow">/help</Text> para ayuda o <Text color="yellow">/exit</Text> para salir.</Text>
          </Box>
        )}

        {!idCommand && (
            <Box flexDirection="column">
               <ProcessingStatus isExecuting={isExecuting} />
               <InteractiveShell onExecute={handleExecute} isExecuting={isExecuting} />
            </Box>
        )}
      </Box>
    </Box>
  );
};

export default App;
