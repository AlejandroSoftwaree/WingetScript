import React from 'react';
import { Box, Text } from 'ink';
import SelectInput from 'ink-select-input';

const MainMenu = ({ onSelect }) => {
  const items = [
    { label: '/install  - Instalar programas', value: 'install' },
    { label: '/download - Descargar instaladores', value: 'download' },
    { label: '/update   - Actualizar programas', value: 'update' },
    { label: '/delete   - Desinstalar programas', value: 'delete' },
    { label: '/id       - Gestionar lista de IDs', value: 'id' },
    { label: '/utility  - Utilidades del sistema', value: 'utility' },
  ];

  return (
    <Box flexDirection="column">
      <Text color="cyan" bold marginBottom={1}>
        ¿Qué comando deseas ejecutar? (Usa las flechas y presiona Enter)
      </Text>
      <SelectInput items={items} onSelect={onSelect} />
    </Box>
  );
};

export default MainMenu;
