import React, { useState, useEffect } from 'react';
import { Box, Text, useInput } from 'ink';
import CustomTextInput from './CustomTextInput.jsx';
import { getAllProgramsFlat } from '../../core/jsonLoader.js';
import theme from '../../core/theme.json';

const verbs = ['install', 'download', 'update', 'delete', 'id', 'utility', 'help', 'exit'];
const categories = ['all', 'generalPrograms', 'developmentPrograms', 'browserPrograms', 'gamingPrograms', 'socialNetworkPrograms', 'consolePrograms'];

function hslToHex(h, s, l) {
  l /= 100;
  const a = s * Math.min(l, 1 - l) / 100;
  const f = n => {
    const k = (n + h / 30) % 12;
    const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * color).toString(16).padStart(2, '0');
  };
  return `#${f(0)}${f(8)}${f(4)}`;
}

const useRainbowBorder = () => {
    const [hue, setHue] = useState(0);
    useEffect(() => {
        const timer = setInterval(() => {
            setHue(h => (h + 5) % 360);
        }, 50);
        return () => clearInterval(timer);
    }, []);
    return hslToHex(hue, 100, 50);
};

const getSuggestionsFor = (inputStr) => {
  if (!inputStr.startsWith('/') || inputStr.length < 1) {
    return [];
  }
  const parts = inputStr.split(' ');
  const currentPart = parts[parts.length - 1];
  let newSuggestions = [];

  if (parts.length === 1) {
    const query = currentPart.slice(1).toLowerCase();
    if (verbs.includes(query)) {
      parts.push('');
    } else {
      return verbs
        .filter(v => v.startsWith(query))
        .map(v => ({ label: `/${v}`, value: v, type: 'verb' }));
    }
  }

  if (parts.length === 2) {
    const verb = parts[0].slice(1);
    const queryStr = parts[1] || '';
    const query = queryStr.startsWith('--') ? queryStr.slice(2).toLowerCase() : queryStr.toLowerCase();
    const verbsWithParams = ['install', 'download', 'update', 'delete'];
    
    if (verbsWithParams.includes(verb)) {
      let options = [...categories];
      if (verb === 'install') options.push('custom');
      
      if (options.includes(query)) {
        parts.push('');
      } else {
        return options
          .filter(o => o.toLowerCase().startsWith(query))
          .map(o => ({ label: `--${o}`, value: o, type: 'param' }));
      }
    } else if (verb === 'id') {
      const idOptions = ['list', 'add', 'delete', 'update'];
      
      if (idOptions.includes(query)) {
        parts.push('');
      } else {
        return idOptions
          .filter(o => o.startsWith(query))
          .map(o => ({ label: o, value: o, type: 'id_subcmd' }));
      }
    } else if (verb === 'utility') {
      const utilOptions = ['addWin10', 'addWin11', 'exportDirectory', 'testColor'];

      if (utilOptions.includes(query)) {
        parts.push('');
      } else {
        return utilOptions
          .filter(o => o.toLowerCase().startsWith(query))
          .map(o => ({ label: o, value: o, type: 'id_subcmd' }));
      }
    } else {
      return [];
    }
  }

  if (parts.length === 3) {
    const currentParam = parts[1].toLowerCase();
    if (currentParam === '--custom') {
      const query = (parts[2] || '').toLowerCase();
      const allIds = getAllProgramsFlat();
      return allIds
        .filter(p => p.id.toLowerCase().includes(query))
        .slice(0, 6)
        .map(p => ({ label: p.id, value: p.id, type: 'id' }));
    } else if (parts[0].toLowerCase() === '/id' && currentParam === 'add') {
      const query = (parts[2] || '').toLowerCase();
      if ('category'.startsWith(query) && query !== '') {
        return [{ label: 'category', value: 'category', type: 'id_subcmd_cat' }];
      }
    }
  }
  
  return [];
};

const SuggestionOverlay = ({ suggestions, activeIndex, animatedBorder }) => {
  if (suggestions.length === 0) return null;

  return (
      <Box 
      flexDirection="column" 
      borderStyle="round" 
      borderColor={animatedBorder} 
      paddingX={1}
      marginX={1}
      marginBottom={0}
      width={process.stdout.columns - 4}
    >
      {suggestions.map((s, i) => {
        const isSelected = i === activeIndex;
        const prefix = isSelected ? '❯ ' : '  ';
        const rawText = `${prefix}${s.label}`;
        // Llenando de espacios hasta el final del box para simular un background de fila completo
        const targetWidth = (process.stdout.columns || 80) - 8;
        const paddedText = rawText.padEnd(targetWidth, ' ');

        return (
          <Text 
            key={s.value}
            color={theme.text.primary} 
            backgroundColor={isSelected ? theme.backgrounds.selection : undefined}
            wrap="truncate"
          >
            {paddedText}
          </Text>
        );
      })}
    </Box>
  );
};

const InteractiveShell = ({ onExecute, isExecuting }) => {
  const [input, setInput] = useState('');
  const [history, setHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [cursorKey, setCursorKey] = useState(0);
  const [activeIndex, setActiveIndex] = useState(0);
  const [suggestions, setSuggestions] = useState([]);
  const [suppressSuggestions, setSuppressSuggestions] = useState(false);
  const animatedBorder = useRainbowBorder();

  useEffect(() => {
    if (suppressSuggestions) {
      setSuppressSuggestions(false);
      setSuggestions([]); // Forzamos apagado temporal de predicciones al cargar historial
      return;
    }
    setSuggestions(getSuggestionsFor(input));
    setActiveIndex(0);
  }, [input]);

  useInput((char, key) => {
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
        
        let newInput = '';
        if (selected.type === 'verb') {
          newInput = `/${selected.value} `;
        } else if (selected.type === 'param') {
          if (selected.value === 'custom') {
            newInput = `${parts[0]} --custom `;
          } else {
            newInput = `${parts[0]} --${selected.value} `;
          }
        } else if (selected.type === 'id') {
          newInput = `${parts[0]} ${parts[1]} ${selected.value} `;
        } else if (selected.type === 'id_subcmd') {
          newInput = `${parts[0]} ${selected.value} `;
        } else if (selected.type === 'id_subcmd_cat') {
          newInput = `${parts[0]} ${parts[1]} ${selected.value} `;
        }
        setInput(newInput);
        setSuggestions([]);
        setCursorKey(prev => prev + 1);
        
        if (key.return) {
          const futureSuggestions = getSuggestionsFor(newInput);
          if (futureSuggestions.length === 0) {
            setHistory(prev => [...prev, newInput.trim()]);
            setHistoryIndex(-1);
            onExecute(newInput.trim());
            setInput('');
          }
        }
        return;
      }
    }

    // Historial (solo si no hay sugerencias explícitas abiertas en ese momento)
    if (suggestions.length === 0 || suppressSuggestions) {
      if (key.upArrow && history.length > 0) {
        const nextIndex = historyIndex + 1;
        if (nextIndex < history.length) {
          setHistoryIndex(nextIndex);
          setSuppressSuggestions(true);
          setInput(history[history.length - 1 - nextIndex]);
          setCursorKey(prev => prev + 1);
        }
        return;
      }
      if (key.downArrow) {
        if (historyIndex > 0) {
          const nextIndex = historyIndex - 1;
          setHistoryIndex(nextIndex);
          setSuppressSuggestions(true);
          setInput(history[history.length - 1 - nextIndex]);
          setCursorKey(prev => prev + 1);
        } else {
          setHistoryIndex(-1);
          setSuppressSuggestions(true);
          setInput('');
          setCursorKey(prev => prev + 1);
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
      <SuggestionOverlay suggestions={suggestions} activeIndex={activeIndex} animatedBorder={theme.borders.default} />
      
      <Box borderStyle="round" borderColor={animatedBorder} paddingX={1} marginX={1} width={process.stdout.columns - 4}>
        <Text color={theme.text.secondary}>❯ </Text>
        <CustomTextInput 
          key={cursorKey}
          value={input} 
          onChange={setInput} 
          onSubmit={handleSubmit}
          disableSubmit={suggestions.length > 0}
          placeholder='Escribe "/" para comandos'
        />
      </Box>
      <Box marginLeft={1}>
        <Text dimColor size="small">
          <Text color={theme.text.warning}>↑↓</Text>: Navegar | <Text color={theme.text.warning}>Tab</Text>: Autocompletar | <Text color={theme.text.danger}>ESC</Text>: Limpiar
        </Text>
      </Box>
    </Box>
  );
};

export default InteractiveShell;
