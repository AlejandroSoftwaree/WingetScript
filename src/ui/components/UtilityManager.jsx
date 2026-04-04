import React from 'react';
import { Box, Text } from 'ink';
import theme from '../../core/theme.json';

const UtilityManager = ({ action, payload }) => {
   const containerWidth = process.stdout.columns - 4;

   if (action === 'error') {
      return (
         <Box flexDirection="column" borderStyle="round" borderColor={theme.borders.error} paddingX={1} marginX={1} width={containerWidth} marginBottom={1}>
            <Text color={theme.text.danger} bold>ERROR AL EJECUTAR UTILIDAD</Text>
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
         <Box flexDirection="column" borderStyle="round" borderColor={theme.borders.success} paddingX={1} marginX={1} width={containerWidth} marginBottom={1}>
            <Text color={theme.text.secondary} bold>{title}</Text>
            <Text color={payload === 'SUCCESS' ? theme.text.success : theme.text.warning}>{message}</Text>
         </Box>
      );
   }

   if (action === 'exportDirectory') {
      return (
         <Box flexDirection="column" borderStyle="round" borderColor={theme.borders.success} paddingX={1} marginX={1} width={containerWidth} marginBottom={1}>
            <Text color={theme.text.secondary} bold>ÁRBOL DE DIRECTORIOS EXPORTADO</Text>
            <Text>El árbol fue procesado y guardado en: <Text color={theme.text.success}>{payload.path}</Text></Text>
            <Text dimColor>Un total de <Text color={theme.text.warning}>{payload.count}</Text> iteraciones de exploración fueron ejecutadas.</Text>
         </Box>
      );
   }

   if (action === 'testColor') {
      return (
         <Box flexDirection="column" borderStyle="round" borderColor={theme.borders.default} paddingX={1} marginX={1} width={containerWidth} marginBottom={1}>
            <Text color={theme.text.secondary} bold>TEST DE COLORES EXHAUSTIVO</Text>
            <Box flexDirection="column" marginTop={1}>
               <Text color="black" backgroundColor="white">(Black).</Text>
               <Text color="blue">(Blue).</Text>
               <Text color="cyan">(Cyan).</Text>
               <Text color="gray">(Gray).</Text>
               <Text color="green">(Green).</Text>
               <Text color="magenta">(Magenta).</Text>
               <Text color="red">(Red).</Text>
               <Text color="white">(White).</Text>
               <Text color="yellow">(Yellow).</Text>
            </Box>
         </Box>
      );
   }

   return null;
};

export default UtilityManager;
