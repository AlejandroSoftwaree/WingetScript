import React, { useState, useEffect } from 'react';
import { Box, Text, useInput } from 'ink';
import SelectInput from 'ink-select-input';
import { getProgramData, addProgramId, addCategory, removeProgramId, updateProgramId, formatJsonValues } from '../../core/jsonLoader.js';
import theme from '../../core/theme.json';

const IdManager = ({ command, onFinished }) => {
  const { action, value1, value2 } = command;
  const [data, setData] = useState(() => getProgramData());
  const [statusMsg, setStatusMsg] = useState('');
  const [isSuccess, setIsSuccess] = useState(true);

  useInput((input, key) => {
    if (key.escape) {
      onFinished();
    }
  });

  useEffect(() => {
    const pData = getProgramData();
    setData(pData);

    if (action === 'format') {
      formatJsonValues();
      setStatusMsg('El JSON ha sido formateado y ordenado exitosamente.');
      setTimeout(onFinished, 2000);
    } else if (action === 'add' && value1 === 'category' && value2) {
      const result = addCategory(value2);
      if (result) {
        setStatusMsg(`Categoría '${value2}' agregada correctamente.`);
        setIsSuccess(true);
      } else {
        setStatusMsg(`Fallo: La categoría '${value2}' ya existe o hubo un error.`);
        setIsSuccess(false);
      }
      setTimeout(onFinished, 2500);
    } else if (action === 'delete') {
      // Buscamos la categoria para el ID si existe
      let foundCategory = null;
      for (const cat in pData) {
        if (pData[cat].includes(value1)) {
          foundCategory = cat;
          break;
        }
      }

      if (foundCategory) {
        removeProgramId(foundCategory, value1);
        setStatusMsg(`ID '${value1}' eliminado de la categoría '${foundCategory}'.`);
        setIsSuccess(true);
        setTimeout(onFinished, 2500);
      } else {
        setStatusMsg(`El ID '${value1}' no se encontró en ninguna categoría.`);
        setIsSuccess(false);
        setTimeout(onFinished, 2500);
      }
    } else if (action === 'update' && value1 && value2) {
      let foundCategory = null;
      for (const cat in pData) {
        if (pData[cat].includes(value1)) {
          foundCategory = cat;
          break;
        }
      }

      if (foundCategory) {
        const result = updateProgramId(foundCategory, value1, value2);
        if (result) {
          setStatusMsg(`ID '${value1}' actualizado a '${value2}' en '${foundCategory}'.`);
          setIsSuccess(true);
        } else {
          setStatusMsg(`Fallo al actualizar. Tal vez el nuevo ID ya exista.`);
          setIsSuccess(false);
        }
        setTimeout(onFinished, 2500);
      } else {
        setStatusMsg(`El ID '${value1}' no se encontró en ninguna categoría.`);
        setIsSuccess(false);
        setTimeout(onFinished, 2500);
      }
    }
  }, [action, value1, value2]);

  if (!data) return <Text color={theme.text.warning}>Cargando datos...</Text>;

  // Lógica para /id list
  if (action === 'list') {
    return (
      <Box flexDirection="column" marginTop={1} paddingY={1} borderStyle="round" borderColor={theme.borders.default} marginX={1} width={process.stdout.columns - 4} paddingX={1} marginBottom={1}>
        <Text color={theme.text.secondary} bold>LISTA DE PROGRAMAS (IDs)</Text>
        <Box flexDirection="row" marginTop={1} marginBottom={1}>
          <Box width={25} flexShrink={0}><Text bold color={theme.text.warning}>Categoría</Text></Box>
          <Box width={12} flexShrink={0}><Text bold color={theme.text.warning}>Cant.</Text></Box>
          <Box flexShrink={1} flexGrow={1}><Text bold color={theme.text.warning}>ID</Text></Box>
        </Box>
        {Object.keys(data).map(cat => (
          <Box flexDirection="row" key={cat} marginBottom={1}>
            <Box width={25} flexShrink={0}><Text>{cat}</Text></Box>
            <Box width={12} flexShrink={0}><Text>{data[cat].length.toString()}</Text></Box>
            <Box flexShrink={1} flexGrow={1}>
              <Text wrap="wrap">{data[cat].join(', ')}</Text>
            </Box>
          </Box>
        ))}
      </Box>
    );
  }

  // Lógica para /id add <id>
  if (action === 'add' && value1 !== 'category') {
    const categoryOptions = Object.keys(data).map(cat => ({
      label: cat,
      value: cat
    }));

    const handleSelectCategory = (item) => {
      const result = addProgramId(item.value, value1);
      if (result) {
        setStatusMsg(`ID '${value1}' agregado correctamente a la categoría '${item.value}'.`);
        setIsSuccess(true);
      } else {
        setStatusMsg(`Fallo: El ID '${value1}' ya existe en la categoría '${item.value}'.`);
        setIsSuccess(false);
      }
      // Volvemos tras una confirmación
      setTimeout(onFinished, 2500);
    };

    return (
      <Box flexDirection="column" marginTop={1}>
        <Text color={theme.text.secondary}>¿A qué categoría deseas agregar el ID '{value1}'?</Text>
        {statusMsg ? (
          <Text color={isSuccess ? theme.text.success : theme.text.danger}>{statusMsg}</Text>
        ) : (
          <Box marginLeft={2} marginTop={1}>
            <SelectInput items={categoryOptions} onSelect={handleSelectCategory} />
          </Box>
        )}
      </Box>
    );
  }

  // Fallback genérico para acciones silenciosas (ej: format, action sin select)
  return (
    <Box flexDirection="column" marginTop={2}>
      {statusMsg && <Text color={isSuccess ? theme.text.success : theme.text.danger}>{statusMsg}</Text>}
    </Box>
  );
};

export default IdManager;
