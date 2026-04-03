import React, { useState } from 'react';
import { Box, Text, useInput } from 'ink';
import TextInput from 'ink-text-input';

const CommandInput = ({ onSlash, isDisabled }) => {
  const [value, setValue] = useState('');

  useInput((input) => {
    if (input === '/' && !isDisabled) {
      onSlash();
      setValue('');
    }
  });

  return (
    <Box flexDirection="column" marginTop={1}>
      <Box 
        borderStyle="round" 
        borderColor="gray" 
        paddingX={1} 
        width={60}
      >
        <Text color="cyan">❯ </Text>
        <TextInput 
          value={value} 
          onChange={setValue} 
          placeholder='Escribe "/" para ver el listado de comandos'
          focus={!isDisabled}
        />
      </Box>
      <Box marginLeft={1}>
        <Text dimColor size="small">
          Presiona <Text color="red">ESC</Text> para cancelar o volver al inicio.
        </Text>
      </Box>
    </Box>
  );
};

export default CommandInput;
