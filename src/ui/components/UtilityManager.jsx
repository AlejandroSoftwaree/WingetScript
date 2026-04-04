import React from 'react';
import { Box, Text } from 'ink';

const UtilityManager = ({ action, payload }) => {
  const containerWidth = process.stdout.columns - 4;

  if (action === 'error') {
     return (
       <Box flexDirection="column" borderStyle="round" borderColor="red" paddingX={1} marginX={1} width={containerWidth} marginBottom={1}>
          <Text color="red" bold>ERROR AL EJECUTAR UTILIDAD</Text>
          <Text>{payload}</Text>
       </Box>
     );
  }

  if (action === 'addWin10' || action === 'addWin11') {
     const title = action === 'addWin10' ? 'MENÚ DE CONTEXTO ESTILO WINDOWS 10' : 'MENÚ DE CONTEXTO ESTILO WINDOWS 11';
     const successMsg = action === 'addWin10' 
        ? 'El menú contextual ha sido cambiado al estilo de Windows 10 y el explorador fue reiniciado.'
        : 'El menú contextual ha sido revertido al estilo predeterminado de Windows 11 y el explorador fue reiniciado.';
     
     const message = payload === 'SUCCESS' ? successMsg : 'La clave de registro solicitada no aplicó cambios porque ya se encuentra en ese formato.';

     return (
       <Box flexDirection="column" borderStyle="round" borderColor="green" paddingX={1} marginX={1} width={containerWidth} marginBottom={1}>
          <Text color="cyan" bold underline>{title}</Text>
          <Text color={payload === 'SUCCESS' ? 'green' : 'yellow'}>{message}</Text>
       </Box>
     );
  }

  if (action === 'exportDirectory') {
     return (
       <Box flexDirection="column" borderStyle="round" borderColor="green" paddingX={1} marginX={1} width={containerWidth} marginBottom={1}>
          <Text color="cyan" bold underline>ÁRBOL DE DIRECTORIOS EXPORTADO</Text>
          <Text>El árbol fue procesado y guardado en: <Text color="green">{payload.path}</Text></Text>
          <Text dimColor>Un total de <Text color="yellow">{payload.count}</Text> iteraciones de exploración fueron ejecutadas.</Text>
       </Box>
     );
  }

  if (action === 'testColor') {
     return (
       <Box flexDirection="column" borderStyle="round" borderColor="magenta" paddingX={1} marginX={1} width={containerWidth} marginBottom={1}>
          <Text color="cyan" bold underline>TEST DE COLORES EXHAUSTIVO</Text>
          <Box flexDirection="column" marginTop={1}>
            <Text color="black" backgroundColor="white">Esto es una prueba de colores estática (Black).</Text>
            <Text color="blue">Esto es una prueba de colores estática (Blue).</Text>
            <Text color="cyan">Esto es una prueba de colores estática (Cyan).</Text>
            <Text color="gray">Esto es una prueba de colores estática (Gray).</Text>
            <Text color="green">Esto es una prueba de colores estática (Green).</Text>
            <Text color="magenta">Esto es una prueba de colores estática (Magenta).</Text>
            <Text color="red">Esto es una prueba de colores estática (Red).</Text>
            <Text color="white">Esto es una prueba de colores estática (White).</Text>
            <Text color="yellow">Esto es una prueba de colores estática (Yellow).</Text>
          </Box>
       </Box>
     );
  }

  return null;
};

export default UtilityManager;
