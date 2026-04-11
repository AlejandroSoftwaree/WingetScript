import React, { useState, useEffect } from 'react';
import { Box, Text, useInput, useApp, Static } from 'ink';
import figlet from 'figlet';
import InteractiveShell from './components/InteractiveShell.jsx';
import ProcessingStatus from './components/ProcessingStatus.jsx';
import Help from './components/Help.jsx';
import IdManager from './components/IdManager.jsx';
import UtilityManager from './components/UtilityManager.jsx';
import { AsciiMotionCli } from './components/squirrelAsciiMotion';
import { getProgramsByCategory, getProgramData } from '../core/jsonLoader.js';
import { runWinget, runWingetBatch } from '../core/wingetRun.js';
import { setWin10ContextMenu, setWin11ContextMenu, exportDirectoryTree } from '../core/systemUtils.js';
import theme from '../core/theme.json';

const App = () => {
  const { exit } = useApp();
  const [showSplash, setShowSplash] = useState(true);
  const [isExecuting, setIsExecuting] = useState(false);
  const [idCommand, setIdCommand] = useState(null);
  const [outputs, setOutputs] = useState([]);
  const [liveStream, setLiveStream] = useState('');
  const [downloadProgress, setDownloadProgress] = useState(null);

  useEffect(() => {
    // Inicia app (transición de Splash a CLI Shell)
    const splashTimer = setTimeout(() => {
      setShowSplash(false);
      setOutputs([
        { id: 'banner', type: 'banner' },
        { id: 'welcome', type: 'welcome' }
      ]);
    }, 3800); // Duración de la animación intro

    // Suprime de manera temporal la advertencia nativa por demasiados event listeners (MaxListenersExceededWarning)
    const originalEmit = process.emit;
    process.emit = function (name, ...args) {
      if (name === 'warning' && typeof args[0] === 'object' && args[0].name === 'MaxListenersExceededWarning') {
        return false;
      }
      return originalEmit.apply(process, [name, ...args]);
    };

    return () => {
      process.emit = originalEmit;
      clearTimeout(splashTimer);
    };
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
    setLiveStream('');
    setDownloadProgress(null);

    // Callback que almacena líneas para un visor fluído (evitando saturación de bytes)
    const handleStream = (chunk) => setLiveStream(prev => {
      const appended = prev + chunk;
      const lines = appended.split('\n');
      // Mantener vivas solo las ultimas 15 líneas para eficiencia
      return lines.slice(-15).join('\n');
    });

    try {
      if (param === 'all') {
        const data = getProgramData();
        for (const cat in data) {
          const result = await runWingetBatch(verb, data[cat], handleStream, setDownloadProgress);
          setOutputs(prev => [...prev, { id: Date.now().toString() + '_' + cat, type: 'winget_log', payload: result }]);
        }
      } else if (param === 'custom' && extra) {
        const result = await runWinget(verb, extra, handleStream, setDownloadProgress);
        setOutputs(prev => [...prev, { id: Date.now().toString(), type: 'winget_log', payload: result }]);
      } else if (param) {
        const ids = getProgramsByCategory(param);
        const result = await runWingetBatch(verb, ids, handleStream, setDownloadProgress);
        setOutputs(prev => [...prev, { id: Date.now().toString(), type: 'winget_log', payload: result }]);
      }
    } catch (error) {
      setOutputs(prev => [...prev, { id: Date.now().toString(), type: 'winget_log', payload: error.message }]);
    } finally {
      setIsExecuting(false);
    }
  };

  if (showSplash) {
    return (
      <Box flexDirection="column" alignItems="center" justifyContent="center" height={process.stdout.rows ? process.stdout.rows - 2 : undefined} width="100%">
        <AsciiMotionCli hasDarkBackground={true} autoPlay={true} loop={true} />
      </Box>
    );
  }

  return (
    <Box flexDirection="column" width="100%" padding={1}>
      <Static items={outputs}>
        {item => {
          if (item.type === 'banner') return <Text key={item.id} color={theme.text.secondary}>{figlet.textSync('WINGET CLI', { font: 'ANSI Shadow' })}</Text>;
          if (item.type === 'command_log') return (
            <Box key={item.id} borderStyle="round" borderColor={theme.borders.default} paddingX={1} marginX={1} width={process.stdout.columns - 4} paddingBottom={0} marginBottom={1}>
              <Text color={theme.text.secondary}>❯ </Text>
              <Text color={theme.text.primary}>{item.input}</Text>
            </Box>
          );
          if (item.type === 'help') return <Help key={item.id} />;
          if (item.type === 'idList') return <IdManager key={item.id} command={{ action: 'list' }} />;
          if (item.type === 'utility') return <UtilityManager key={item.id} action={item.action} payload={item.payload} />;
          if (item.type === 'winget_log') return (
            <Box key={item.id} flexDirection="column" borderStyle="round" borderColor={theme.borders.default} paddingX={1} marginX={1} width={process.stdout.columns - 4} marginBottom={1}>
              <Text>{item.payload}</Text>
            </Box>
          );
          if (item.type === 'welcome') return (
            <Box key={item.id} flexDirection="column" borderStyle="round" borderColor={theme.borders.default} paddingX={1} marginX={1} width={process.stdout.columns - 4} marginBottom={1}>
              <Text color={theme.text.primary}>Modo Shell Interactiva Libre.</Text>
              <Text color={theme.text.primary}>Escribe <Text color={theme.text.warning}>/help</Text> para ayuda o <Text color={theme.text.warning}>/exit</Text> para salir.</Text>
            </Box>
          );
          return null;
        }}
      </Static>

      <Box flexDirection="column" width="100%">
        {idCommand && <IdManager command={idCommand} onFinished={() => setIdCommand(null)} />}

        {!idCommand && (
          <Box flexDirection="column">
            {isExecuting && liveStream && (
              <Box flexDirection="column" borderStyle="round" borderColor={theme.borders.highlight} paddingX={1} marginX={1} width={process.stdout.columns - 4} marginBottom={1}>
                <Text color={theme.text.muted}>{liveStream}</Text>
              </Box>
            )}
            <ProcessingStatus isExecuting={isExecuting} progress={downloadProgress} />
            {!isExecuting && <InteractiveShell onExecute={handleExecute} isExecuting={isExecuting} />}
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default App;
