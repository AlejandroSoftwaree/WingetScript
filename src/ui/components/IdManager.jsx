import React, { useState, useEffect } from 'react';
import { Box, Text, useInput } from 'ink';
import SelectInput from 'ink-select-input';
import TextInput from 'ink-text-input';
import { getProgramData, addProgramId, addCategory, removeProgramId, updateProgramId, formatJsonValues } from '../../core/jsonLoader.js';
import theme from '../../core/theme.json';

const IdManager = ({ command, onFinished }) => {
  const { action, value1, value2 } = command;
  const [data, setData] = useState(() => getProgramData());
  const [statusMsg, setStatusMsg] = useState('');
  const [isSuccess, setIsSuccess] = useState(true);

  // Estados para el flujo interactivo
  const [step, setStep] = useState('init');
  const [selectedCat, setSelectedCat] = useState('');
  const [selectedId, setSelectedId] = useState('');
  const [newIdInput, setNewIdInput] = useState('');

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
      setStep('done');
      setTimeout(onFinished, 2000);
    } else if (action === 'add') {
      if (value1 === 'category' && value2) {
        const result = addCategory(value2);
        if (result) {
          setStatusMsg(`Categoría '${value2}' agregada correctamente.`);
          setIsSuccess(true);
        } else {
          setStatusMsg(`Fallo: La categoría '${value2}' ya existe o hubo un error.`);
          setIsSuccess(false);
        }
        setStep('done');
        setTimeout(onFinished, 2500);
      } else if (value1 && value2 && pData[value1]) {
        // Soporte directo autocompletado: /id add <categoria> <id>
        const result = addProgramId(value1, value2);
        if (result) {
          setStatusMsg(`ID '${value2}' agregado correctamente a la categoría '${value1}'.`);
          setIsSuccess(true);
        } else {
          setStatusMsg(`Fallo: El ID '${value2}' ya existe en la categoría '${value1}'.`);
          setIsSuccess(false);
        }
        setStep('done');
        setTimeout(onFinished, 2500);
      }
    } else if (action === 'delete') {
      if (!value1 || value1 === 'null' || value1 === 'undefined' || value1.trim() === '') {
        setStep('select_cat'); // Entra al modo interactivo si no hay argumentos
        return;
      }

      let foundCategory = null;
      let targetId = value1;

      // Soporte para comando directo: /id delete <categoria> <id>
      if (pData[value1] && value2 && value2 !== 'null' && value2 !== 'undefined') {
        foundCategory = value1;
        targetId = value2;
      } else {
        for (const cat in pData) {
          if (pData[cat].includes(targetId)) {
            foundCategory = cat;
            break;
          }
        }
      }

      if (foundCategory) {
        removeProgramId(foundCategory, targetId);
        setStatusMsg(`ID '${targetId}' eliminado de la categoría '${foundCategory}'.`);
        setIsSuccess(true);
      } else {
        setStatusMsg(`El ID '${targetId}' no se encontró en ninguna categoría.`);
        setIsSuccess(false);
      }
      setStep('done');
      setTimeout(onFinished, 2500);
    } else if (action === 'update') {
      if (!value1 || value1 === 'null' || value1 === 'undefined' || value1.trim() === '') {
        setStep('select_cat'); // Entra al modo interactivo
        return;
      }

      // Soporte para comando interactivo pre-rellenado: /id update <categoria> <id_viejo>
      if (pData[value1] && value2 && value2 !== 'null' && value2 !== 'undefined') {
        setSelectedCat(value1);
        setSelectedId(value2);
        setStep('input_new_id');
        return;
      }

      let foundCategory = null;
      let targetOldId = value1;
      let targetNewId = value2;

      for (const cat in pData) {
        if (pData[cat].includes(targetOldId)) {
          foundCategory = cat;
          break;
        }
      }

      if (foundCategory && targetNewId) {
        const result = updateProgramId(foundCategory, targetOldId, targetNewId);
        if (result) {
          setStatusMsg(`ID '${targetOldId}' actualizado a '${targetNewId}' en '${foundCategory}'.`);
          setIsSuccess(true);
        } else {
          setStatusMsg(`Fallo al actualizar. Tal vez el nuevo ID ya exista.`);
          setIsSuccess(false);
        }
      } else {
        setStatusMsg(`Faltan argumentos o el ID '${targetOldId}' no se encontró.`);
        setIsSuccess(false);
      }
      setStep('done');
      setTimeout(onFinished, 2500);
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
  if (action === 'add' && value1 !== 'category' && step !== 'done') {
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
      setStep('done');
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

  // Lógica interactiva para /id delete y /id update (Paso 1: Categoría)
  if (step === 'select_cat') {
    const categoryOptions = Object.keys(data).map(cat => ({ label: cat, value: cat }));
    return (
      <Box flexDirection="column" marginTop={1}>
        <Text color={theme.text.secondary}>
          {action === 'delete' ? '¿De qué categoría deseas eliminar un ID?' : '¿En qué categoría está el ID que deseas actualizar?'}
        </Text>
        <Box marginLeft={2} marginTop={1}>
          <SelectInput
            items={categoryOptions}
            onSelect={(item) => {
              setSelectedCat(item.value);
              setStep('select_id');
            }}
          />
        </Box>
      </Box>
    );
  }

  // Lógica interactiva (Paso 2: Seleccionar ID)
  if (step === 'select_id') {
    const ids = data[selectedCat] || [];
    if (ids.length === 0) {
      setTimeout(onFinished, 2500);
      return (
        <Box marginTop={1}><Text color={theme.text.danger}>No hay programas en la categoría '{selectedCat}'.</Text></Box>
      );
    }
    const idOptions = ids.map(id => ({ label: id, value: id }));
    return (
      <Box flexDirection="column" marginTop={1}>
        <Text color={theme.text.secondary}>
          {action === 'delete' ? 'Selecciona el ID que deseas eliminar:' : 'Selecciona el ID que deseas actualizar:'}
        </Text>
        <Box marginLeft={2} marginTop={1}>
          <SelectInput
            items={idOptions}
            onSelect={(item) => {
              if (action === 'delete') {
                removeProgramId(selectedCat, item.value);
                setStatusMsg(`ID '${item.value}' eliminado de la categoría '${selectedCat}'.`);
                setIsSuccess(true);
                setStep('done');
                setTimeout(onFinished, 2500);
              } else {
                setSelectedId(item.value);
                setStep('input_new_id');
              }
            }}
          />
        </Box>
      </Box>
    );
  }

  // Lógica interactiva (Paso 3 EXCLUSIVO para UPDATE: Escribir nuevo valor)
  if (step === 'input_new_id') {
    return (
      <Box flexDirection="column" marginTop={1}>
        <Text color={theme.text.secondary}>Introduce el nuevo valor para '{selectedId}':</Text>
        <Box borderStyle="round" borderColor={theme.borders.default} paddingX={1} width={60} marginTop={1}>
          <Text color="cyan">❯ </Text>
          <TextInput
            value={newIdInput}
            onChange={setNewIdInput}
            onSubmit={(val) => {
              if (val.trim() !== '') {
                const result = updateProgramId(selectedCat, selectedId, val.trim());
                if (result) {
                  setStatusMsg(`ID '${selectedId}' actualizado a '${val.trim()}'.`);
                  setIsSuccess(true);
                } else {
                  setStatusMsg(`Fallo al actualizar. Tal vez '${val.trim()}' ya exista.`);
                  setIsSuccess(false);
                }
                setStep('done');
                setTimeout(onFinished, 2500);
              }
            }}
          />
        </Box>
        <Box marginLeft={1}>
          <Text dimColor size="small">Presiona <Text color={theme.text.success}>Enter</Text> para confirmar.</Text>
        </Box>
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
