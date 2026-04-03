import React, { useState, useEffect } from 'react';
import { Box, Text, useInput } from 'ink';
import TextInput from 'ink-text-input';
import { getAllProgramsFlat } from '../../core/jsonLoader.js';

const SuggestionOverlay = ({ suggestions, activeIndex }) => {
  if (suggestions.length === 0) return null;

  return (
    <Box 
      flexDirection="column" 
      borderStyle="single" 
      borderColor="gray" 
      paddingX={1}
      marginBottom={0}
      width={60}
    >
      {suggestions.map((s, i) => (
        <Text key={s.value} color={i === activeIndex ? 'cyan' : 'white'} wrap="truncate">
          {i === activeIndex ? '❯ ' : '  '}
          {s.label}
        </Text>
      ))}
    </Box>
  );
};

const InteractiveShell = ({ onExecute, isExecuting }) => {
  const [input, setInput] = useState('');
  const [history, setHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [activeIndex, setActiveIndex] = useState(0);
  const [suggestions, setSuggestions] = useState([]);

  const verbs = ['install', 'download', 'update', 'delete', 'id', 'utility', 'help', 'exit'];
  const categories = ['all', 'generalPrograms', 'developmentPrograms', 'browserPrograms', 'gamingPrograms', 'socialNetworkPrograms', 'consolePrograms'];

  useEffect(() => {
    // Solo sugerir si el input empieza con / y tiene más de 0 caracteres después del /
    // O si estamos en niveles más profundos (parámetros o IDs)
    if (!input.startsWith('/') || input.length < 1) {
      setSuggestions([]);
      return;
    }

    const parts = input.split(' ');
    const currentPart = parts[parts.length - 1];
    let newSuggestions = [];

    if (parts.length === 1) {
      const query = currentPart.slice(1).toLowerCase();
      // Si el query está vacío (solo escribió /), mostramos todos los verbos
      newSuggestions = verbs
        .filter(v => v.startsWith(query))
        .map(v => ({ label: `/${v}`, value: v, type: 'verb' }));
    } else if (parts.length === 2) {
      const verb = parts[0].slice(1);
      const query = currentPart.startsWith('--') ? currentPart.slice(2).toLowerCase() : currentPart.toLowerCase();
      
      let options = [...categories];
      if (verb === 'install') options.push('custom');

      newSuggestions = options
        .filter(o => o.toLowerCase().startsWith(query))
        .map(o => ({ label: `--${o}`, value: o, type: 'param' }));
    } else if (parts.length === 3 && parts[1] === '--custom') {
      const query = currentPart.toLowerCase();
      const allIds = getAllProgramsFlat();
      newSuggestions = allIds
        .filter(p => p.id.toLowerCase().includes(query))
        .slice(0, 6) // Reducimos lista para evitar bugs de scroll
        .map(p => ({ label: p.id, value: p.id, type: 'id' }));
    }

    setSuggestions(newSuggestions);
    setActiveIndex(0);
  }, [input]);

  useInput((data, key) => {
    if (isExecuting) return;

    // Navegación de sugerencias
    if (suggestions.length > 0) {
      if (key.upArrow) {
        setActiveIndex(prev => Math.max(0, prev - 1));
        return;
      }
      if (key.downArrow) {
        setActiveIndex(prev => Math.min(suggestions.length - 1, prev + 1));
        return;
      }
      if (key.tab || (key.return && suggestions.length > 0)) {
        const selected = suggestions[activeIndex];
        const parts = input.split(' ');
        
        if (selected.type === 'verb') {
          setInput(`/${selected.value} `);
        } else if (selected.type === 'param') {
          if (selected.value === 'custom') {
            setInput(`${parts[0]} --custom `);
          } else {
            setInput(`${parts[0]} --${selected.value}`);
          }
        } else if (selected.type === 'id') {
          setInput(`${parts[0]} ${parts[1]} ${selected.value}`);
        }
        setSuggestions([]);
        return;
      }
    }

    // Historial (solo si no hay sugerencias)
    if (suggestions.length === 0) {
      if (key.upArrow && history.length > 0) {
        const nextIndex = historyIndex + 1;
        if (nextIndex < history.length) {
          setHistoryIndex(nextIndex);
          setInput(history[history.length - 1 - nextIndex]);
        }
        return;
      }
      if (key.downArrow) {
        if (historyIndex > 0) {
          const nextIndex = historyIndex - 1;
          setHistoryIndex(nextIndex);
          setInput(history[history.length - 1 - nextIndex]);
        } else {
          setHistoryIndex(-1);
          setInput('');
        }
        return;
      }
    }

    if (key.escape) {
        setInput('');
        setSuggestions([]);
        setHistoryIndex(-1);
    }
  });

  const handleSubmit = (value) => {
    if (value.trim() === '') return;
    // Si hay sugerencias, el Enter arriba las maneja. Si no, ejecutamos.
    if (suggestions.length === 0) {
        setHistory(prev => [...prev, value]);
        setHistoryIndex(-1);
        onExecute(value);
        setInput('');
    }
  };

  return (
    <Box flexDirection="column">
      {/* Sugerencias arriba del input */}
      <SuggestionOverlay suggestions={suggestions} activeIndex={activeIndex} />
      
      <Box borderStyle="round" borderColor="gray" paddingX={1} width={70}>
        <Text color="cyan">❯ </Text>
        <TextInput 
          value={input} 
          onChange={setInput} 
          onSubmit={handleSubmit}
          placeholder='Escribe "/" para comandos'
        />
      </Box>
      <Box marginLeft={1}>
        <Text dimColor size="small">
          <Text color="yellow">↑↓</Text>: Navegar | <Text color="yellow">Tab</Text>: Autocompletar | <Text color="red">ESC</Text>: Limpiar
        </Text>
      </Box>
    </Box>
  );
};

export default InteractiveShell;
