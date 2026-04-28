import React, { useState, useEffect, useRef } from 'react';
import { Box, Text, useInput } from 'ink';
import CustomTextInput from './CustomTextInput.jsx';
import { getAllProgramsFlat, getProgramsByCategory, getProgramData } from '../../core/jsonLoader.js';
import theme from '../../core/theme.json';

const OVERLAY_SIZE = 10; // Filas visibles en el overlay de sugerencias

const verbs = ['install', 'download', 'update', 'delete', 'id', 'add', 'utility', 'help', 'exit'];
const fallbackCategories = ['all', 'generalPrograms', 'developmentPrograms', 'browserPrograms', 'gamingPrograms', 'socialNetworkPrograms', 'consolePrograms'];

const getDynamicCategories = (excludeAll = false) => {
  const data = getProgramData();
  let cats = data ? Object.keys(data) : fallbackCategories.filter(c => c !== 'all');
  if (!excludeAll && !cats.includes('all')) {
    cats = ['all', ...cats];
  }
  return cats;
};

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
  if (!inputStr.startsWith('/') || inputStr.length < 1) return [];

  const rawParts = inputStr.match(/\S+/g) || [];
  if (inputStr.match(/\s+$/)) rawParts.push('');
  const parts = rawParts;
  const currentPart = parts[parts.length - 1];

  if (parts.length === 1) {
    const query = currentPart.slice(1).toLowerCase();
    if (verbs.includes(query)) { parts.push(''); }
    else return verbs.filter(v => v.startsWith(query)).map(v => ({ label: `/${v}`, value: v, type: 'verb' }));
  }

  if (parts.length === 2) {
    const verb = parts[0].slice(1);
    const queryStr = parts[1] || '';
    const query = queryStr.startsWith('--') ? queryStr.slice(2).toLowerCase() : queryStr.toLowerCase();
    const verbsWithParams = ['install', 'download', 'update', 'delete'];

    if (verbsWithParams.includes(verb)) {
      let options = getDynamicCategories(false);
      if (verb === 'install') options.push('custom');
      if (options.includes(query)) { parts.push(''); }
      else return options.filter(o => o.toLowerCase().startsWith(query)).map(o => ({ label: `--${o}`, value: o, type: 'param' }));

    } else if (verb === 'id') {
      const idOptions = ['list', 'delete', 'update'];
      if (idOptions.includes(query)) { parts.push(''); }
      else return idOptions.filter(o => o.startsWith(query)).map(o => ({ label: o, value: o, type: 'id_subcmd' }));

    } else if (verb === 'add') {
      const addOptions = ['id', 'category'];
      if (addOptions.includes(query)) { parts.push(''); }
      else return addOptions.filter(o => o.startsWith(query)).map(o => ({ label: o, value: o, type: 'id_subcmd' }));

    } else if (verb === 'utility') {
      const utilOptions = ['addWin10', 'addWin11', 'exportDirectory', 'testColor'];
      if (utilOptions.includes(query)) { parts.push(''); }
      else return utilOptions.filter(o => o.toLowerCase().startsWith(query)).map(o => ({ label: o, value: o, type: 'id_subcmd' }));

    } else {
      return [];
    }
  }

  if (parts.length === 3) {
    const verbStr = parts[0].slice(1).toLowerCase();
    const currentParam = parts[1].toLowerCase();
    const query3 = (parts[2] || '').toLowerCase();

    // /install --custom <id>  y  /download --custom <id>  etc.
    if (currentParam === '--custom') {
      const allIds = getAllProgramsFlat();
      return allIds.filter(p => p.id.toLowerCase().includes(query3)).map(p => ({ label: p.id, value: p.id, type: 'id' }));
    }

    // /id delete <id>  → tipo 'id' (auto-ejecuta al seleccionar)
    // /id update <id>  → tipo 'id_partial' (completa pero espera el nuevo valor)
    if (verbStr === 'id' && (currentParam === 'delete' || currentParam === 'update')) {
      const allIds = getAllProgramsFlat();
      return allIds.filter(p => p.id.toLowerCase().includes(query3)).map(p => ({
        label: `${p.id} [${p.category}]`,
        value: p.id,
        type: currentParam === 'update' ? 'id_partial' : 'id'
      }));
    }

    // /add id → muestra categorías para seleccionar destino
    if (verbStr === 'add' && currentParam === 'id') {
      const cats = getDynamicCategories(true); // sin 'all'
      return cats.filter(c => c.toLowerCase().startsWith(query3)).map(c => ({ label: c, value: c, type: 'add_cat' }));
    }

    return [];
  }

  return [];
};

// Overlay con ventana deslizante: muestra OVERLAY_SIZE filas del total
const SuggestionOverlay = ({ suggestions, activeIndex, animatedBorder }) => {
  if (suggestions.length === 0) return null;

  const half = Math.floor(OVERLAY_SIZE / 2);
  const start = Math.max(0, Math.min(activeIndex - half, suggestions.length - OVERLAY_SIZE));
  const end = Math.min(suggestions.length, start + OVERLAY_SIZE);
  const visible = suggestions.slice(start, end);
  const targetWidth = (process.stdout.columns || 80) - 8;

  return (
    <Box flexDirection="column" borderStyle="round" borderColor={animatedBorder} paddingX={1} marginX={1} marginBottom={0} width={process.stdout.columns - 4}>
      {suggestions.length > OVERLAY_SIZE && (
        <Text dimColor>{activeIndex + 1}/{suggestions.length} resultados</Text>
      )}
      {visible.map((s, i) => {
        const actualIndex = start + i;
        const isSelected = actualIndex === activeIndex;
        const prefix = isSelected ? '❯ ' : '  ';
        const paddedText = `${prefix}${s.label}`.padEnd(targetWidth, ' ');
        return (
          <Text key={`${s.value}-${actualIndex}`} color={theme.text.primary} backgroundColor={isSelected ? theme.backgrounds.selection : undefined} wrap="truncate">
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
  const historyIndexRef = useRef(-1); // ref para acceso síncrono en useInput
  const [cursorKey, setCursorKey] = useState(0);
  const [activeIndex, setActiveIndex] = useState(0);
  const [suggestions, setSuggestions] = useState([]);
  const suppressRef = useRef(false); // ref para suprimir sugerencias al navegar historial
  const animatedBorder = useRainbowBorder();

  useEffect(() => {
    if (suppressRef.current) {
      suppressRef.current = false;
      setSuggestions([]);
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
      if (key.tab || key.return) {
        const selected = suggestions[activeIndex];
        const parts = input.match(/\S+/g) || [];

        let newInput = '';
        if (selected.type === 'verb') {
          newInput = `/${selected.value} `;
        } else if (selected.type === 'param') {
          newInput = selected.value === 'custom' ? `${parts[0]} --custom ` : `${parts[0]} --${selected.value} `;
        } else if (selected.type === 'id' || selected.type === 'id_partial') {
          newInput = `${parts[0]} ${parts[1]} ${selected.value} `;
        } else if (selected.type === 'id_subcmd') {
          newInput = `${parts[0]} ${selected.value} `;
        } else if (selected.type === 'add_cat') {
          // /add id <categoria> → el usuario escribe el winget ID
          newInput = `${parts[0]} ${parts[1]} ${selected.value} `;
        }

        setInput(newInput);
        setSuggestions([]);
        setCursorKey(prev => prev + 1);

        // id_subcmd e id_partial nunca auto-ejecutan (esperan más input del usuario)
        if (key.return && selected.type !== 'id_subcmd' && selected.type !== 'id_partial') {
          const futureSuggestions = getSuggestionsFor(newInput);
          if (futureSuggestions.length === 0) {
            const trimmed = newInput.trim();
            if (trimmed) {
              setHistory(prev => [...prev, trimmed]);
              historyIndexRef.current = -1;
              setHistoryIndex(-1);
              onExecute(trimmed);
              setInput('');
            }
          }
        }
        return;
      }
    }

    // Historial: activo cuando no hay sugerencias o ya se está navegando historial
    if (suggestions.length === 0 || historyIndexRef.current >= 0) {
      if (key.upArrow && history.length > 0) {
        const nextIndex = historyIndexRef.current + 1;
        if (nextIndex < history.length) {
          historyIndexRef.current = nextIndex;
          setHistoryIndex(nextIndex);
          suppressRef.current = true;
          setInput(history[history.length - 1 - nextIndex]);
          setCursorKey(prev => prev + 1);
        }
        return;
      }
      if (key.downArrow) {
        if (historyIndexRef.current > 0) {
          const nextIndex = historyIndexRef.current - 1;
          historyIndexRef.current = nextIndex;
          setHistoryIndex(nextIndex);
          suppressRef.current = true;
          setInput(history[history.length - 1 - nextIndex]);
          setCursorKey(prev => prev + 1);
        } else {
          historyIndexRef.current = -1;
          setHistoryIndex(-1);
          suppressRef.current = true;
          setInput('');
          setCursorKey(prev => prev + 1);
        }
        return;
      }
    }

    if (key.escape) {
      setInput('');
      setSuggestions([]);
      historyIndexRef.current = -1;
      setHistoryIndex(-1);
    }
  });

  const handleSubmit = (value) => {
    if (value.trim() === '') return;
    if (suggestions.length === 0) {
      setHistory(prev => [...prev, value]);
      historyIndexRef.current = -1;
      setHistoryIndex(-1);
      onExecute(value);
      setInput('');
    }
  };

  return (
    <Box flexDirection="column">
      <SuggestionOverlay suggestions={suggestions} activeIndex={activeIndex} animatedBorder={theme.borders.default} />
      <Box borderStyle="round" borderColor={animatedBorder} paddingX={1} marginX={1} width={process.stdout.columns - 4}>
        <Text color={theme.text.secondary}>❯ </Text>
        <CustomTextInput
          key={cursorKey}
          value={input}
          onChange={setInput}
          onSubmit={handleSubmit}
          disableSubmit={suggestions.length > 0}
          placeholder='Escribe "/" para ver comandos'
        />
      </Box>
      <Box marginLeft={1}>
        <Text dimColor>
          <Text color={theme.text.warning}>↑↓</Text>: Navegar/Historial | <Text color={theme.text.warning}>Tab</Text>: Autocompletar | <Text color={theme.text.danger}>ESC</Text>: Limpiar
        </Text>
      </Box>
    </Box>
  );
};

export default InteractiveShell;
