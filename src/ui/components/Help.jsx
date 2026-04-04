import React from 'react';
import { Box, Text } from 'ink';

const Help = () => {
  const commands = [
    {
      name: 'install',
      desc: 'Instala programas del sistema.',
      params: [
        { name: 'All', desc: 'Instala todos los grupos de programas.' },
        { name: 'Custom', desc: 'Permite buscar e instalar un programa específico.' },
        { name: 'Categorías', desc: 'Instala un grupo (General, Dev, etc).' }
      ]
    },
    {
      name: 'download',
      desc: 'Descarga instaladores para uso offline.',
      params: [{ name: 'Categorías', desc: 'Descarga el grupo seleccionado.' }]
    },
    {
      name: 'update',
      desc: 'Busca y aplica actualizaciones.',
      params: [{ name: 'Categorías', desc: 'Actualiza el grupo seleccionado.' }]
    },
    {
      name: 'delete',
      desc: 'Desinstala programas de la lista.',
      params: [{ name: 'Categorías', desc: 'Elimina el grupo seleccionado.' }]
    }
  ];

  return (
    <Box flexDirection="column" paddingY={1} borderStyle="round" borderColor="gray" marginX={1} width={process.stdout.columns - 4} paddingX={1} marginBottom={1}>
      <Text color="cyan" bold underline>LISTADO DE COMANDOS DISPONIBLES</Text>
      {commands.map((cmd) => (
        <Box key={cmd.name} flexDirection="column" marginTop={1}>
          <Text bold color="yellow">/{cmd.name} <Text dimColor>- {cmd.desc}</Text></Text>
          {cmd.params.map((param) => (
            <Box key={param.name} marginLeft={2}>
              <Text color="gray">ㄴ {param.name}: <Text italic>{param.desc}</Text></Text>
            </Box>
          ))}
        </Box>
      ))}
    </Box>
  );
};

export default Help;
