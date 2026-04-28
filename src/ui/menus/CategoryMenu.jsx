import React from 'react';
import { Box, Text } from 'ink';
import SelectInput from 'ink-select-input';
import { getProgramData } from '../../core/jsonLoader.js';

const CategoryMenu = ({ verb, onSelect }) => {
  const data = getProgramData();
  const dynamicCats = data ? Object.keys(data) : [];

  const items = [
    { label: 'All - Ejecutar sobre todos', value: 'all' },
    ...dynamicCats.map(cat => ({ label: cat, value: cat })),
  ];

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
