import React, { useState } from 'react';
import { Box, Text } from 'ink';
import TextInput from 'ink-text-input';
import SelectInput from 'ink-select-input';
import { getAllProgramsFlat } from '../../core/jsonLoader.js';

const SearchMenu = ({ verb, onSelect }) => {
  const [query, setQuery] = useState('');
  const allPrograms = getAllProgramsFlat();

  // Filtramos los programas según lo que escribe el usuario
  const filteredPrograms = allPrograms
    .filter(prog => prog.id.toLowerCase().includes(query.toLowerCase()))
    .slice(0, 10); // Limitamos a 10 resultados por pantalla

  const items = filteredPrograms.map(prog => ({
    label: `${prog.id} (${prog.category})`,
    value: prog.id
  }));

  return (
    <Box flexDirection="column">
      <Text color="magenta" bold marginBottom={1}>
        [{verb.toUpperCase()} {'->'} CUSTOM] Busca y selecciona el programa:
      </Text>
      
      <Box marginBottom={1}>
        <Text>Escribe para filtrar: </Text>
        <TextInput value={query} onChange={setQuery} />
      </Box>

      {items.length > 0 ? (
        <SelectInput items={items} onSelect={onSelect} />
      ) : (
        <Text color="red">No se encontraron programas que coincidan.</Text>
      )}
      
      <Text dimColor marginTop={1}>
        (Usa las flechas para navegar y Enter para seleccionar)
      </Text>
    </Box>
  );
};

export default SearchMenu;
