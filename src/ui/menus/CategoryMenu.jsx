import React from 'react';
import { Box, Text } from 'ink';
import SelectInput from 'ink-select-input';

const CategoryMenu = ({ verb, onSelect }) => {
  const items = [
    { label: 'All - Ejecutar sobre todos', value: 'all' },
    { label: 'General (generalPrograms)', value: 'generalPrograms' },
    { label: 'Development (developmentPrograms)', value: 'developmentPrograms' },
    { label: 'Browsers (browserPrograms)', value: 'browserPrograms' },
    { label: 'Games (gamingPrograms)', value: 'gamingPrograms' },
    { label: 'Social (socialNetworkPrograms)', value: 'socialNetworkPrograms' },
    { label: 'Console (consolePrograms)', value: 'consolePrograms' },
  ];

  // Agregamos la opción Custom solo si el verbo es install
  if (verb === 'install') {
    items.push({ label: '-----------------------------------', value: 'separator' });
    items.push({ label: 'Custom - Seleccionar un programa específico', value: 'custom' });
  }

  const handleSelect = (item) => {
    if (item.value === 'separator') return;
    onSelect(item.value);
  };

  return (
    <Box flexDirection="column">
      <Text color="yellow" bold marginBottom={1}>
        [{verb.toUpperCase()}] ¿Qué grupo de programas deseas procesar?
      </Text>
      <SelectInput items={items} onSelect={handleSelect} />
    </Box>
  );
};

export default CategoryMenu;
