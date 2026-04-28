import React, { useState, useEffect } from 'react';
import { Box, Text, useInput } from 'ink';
import SelectInput from 'ink-select-input';
import TextInput from 'ink-text-input';
import { getProgramData, getAllProgramsFlat, addProgramId, addCategory, removeProgramId, updateProgramId, formatJsonValues } from '../../core/jsonLoader.js';
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
      if (onFinished) onFinished();
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
      // /add category <nombre>
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
      } else {
        // /add id → flujo interactivo: primero seleccionar categoría
        setStep('select_cat_for_add');
        return;
      }

    } else if (action === 'delete') {
      if (!value1 || value1 === 'null' || value1 === 'undefined' || value1.trim() === '') {
        setStep('select_id_all');
        return;
      }

      let foundCategory = null;
      let targetId = value1;

      // Soporte para /id delete <categoria> <id>
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
        setStep('select_id_all');
        return;
      }

      // /id update <categoria> <id_viejo> → salta a TextInput
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

  // /id list
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

  // /add id → Paso 1: Seleccionar categoría
  if (step === 'select_cat_for_add') {
    const categoryOptions = Object.keys(data).map(cat => ({ label: cat, value: cat }));
    return (
      <Box flexDirection="column" borderStyle="round" borderColor={theme.borders.utility} paddingX={1} marginX={1} width={process.stdout.columns - 4} marginBottom={1}>
        <Text color={theme.text.secondary} bold>ADD ID → Selecciona la categoría de destino:</Text>
        <Box marginLeft={2} marginTop={1}>
          <SelectInput
            items={categoryOptions}
            onSelect={(item) => {
              setSelectedCat(item.value);
              setStep('input_new_id');
            }}
          />
        </Box>
        <Text dimColor>ESC para cancelar</Text>
      </Box>
    );
  }

  // /id delete y /id update → Lista plana de todos los IDs
  if (step === 'select_id_all') {
    const allPrograms = getAllProgramsFlat();
    const allIdOptions = allPrograms.map(p => ({
      label: `${p.id}  [${p.category}]`,
      value: p.id
    }));
    const label = action === 'delete' ? 'DELETE → Selecciona el ID a eliminar:' : 'UPDATE → Selecciona el ID a actualizar:';
    const borderColor = action === 'delete' ? theme.borders.error : theme.borders.highlight;

    return (
      <Box flexDirection="column" borderStyle="round" borderColor={borderColor} paddingX={1} marginX={1} width={process.stdout.columns - 4} marginBottom={1}>
        <Text color={theme.text.secondary} bold>{label}</Text>
        <Box marginLeft={2} marginTop={1}>
          <SelectInput
            items={allIdOptions}
            onSelect={(item) => {
              const prog = allPrograms.find(p => p.id === item.value);
              if (action === 'delete') {
                removeProgramId(prog.category, item.value);
                setStatusMsg(`ID '${item.value}' eliminado de '${prog.category}'.`);
                setIsSuccess(true);
                setStep('done');
                setTimeout(onFinished, 2500);
              } else {
                setSelectedCat(prog.category);
                setSelectedId(item.value);
                setStep('input_new_id');
              }
            }}
          />
        </Box>
        <Text dimColor>ESC para cancelar</Text>
      </Box>
    );
  }

  // Paso final de ADD e UPDATE: Escribir el valor
  if (step === 'input_new_id') {
    const isAdd = action === 'add';
    const promptText = isAdd
      ? `ADD → Categoría: '${selectedCat}' — Ingresa el nuevo Winget ID:`
      : `UPDATE → Reemplazando '${selectedId}' — Ingresa el nuevo ID:`;
    const borderColor = isAdd ? theme.borders.utility : theme.borders.highlight;

    return (
      <Box flexDirection="column" borderStyle="round" borderColor={borderColor} paddingX={1} marginX={1} width={process.stdout.columns - 4} marginBottom={1}>
        <Text color={theme.text.secondary} bold>{promptText}</Text>
        <Box paddingX={1} marginTop={1}>
          <Text color={theme.text.secondary}>❯ </Text>
          <TextInput
            value={newIdInput}
            onChange={setNewIdInput}
            onSubmit={(val) => {
              if (val.trim() === '') return;
              if (isAdd) {
                const result = addProgramId(selectedCat, val.trim());
                if (result) {
                  setStatusMsg(`ID '${val.trim()}' agregado a '${selectedCat}'.`);
                  setIsSuccess(true);
                } else {
                  setStatusMsg(`Fallo: '${val.trim()}' ya existe en '${selectedCat}'.`);
                  setIsSuccess(false);
                }
              } else {
                const result = updateProgramId(selectedCat, selectedId, val.trim());
                if (result) {
                  setStatusMsg(`ID '${selectedId}' actualizado a '${val.trim()}'.`);
                  setIsSuccess(true);
                } else {
                  setStatusMsg(`Fallo al actualizar. Tal vez '${val.trim()}' ya exista.`);
                  setIsSuccess(false);
                }
              }
              setStep('done');
              setTimeout(onFinished, 2500);
            }}
          />
        </Box>
        <Text dimColor>Presiona <Text color={theme.text.success}>Enter</Text> para confirmar · ESC para cancelar</Text>
      </Box>
    );
  }

  // Fallback: mensaje de estado (done, errores silenciosos)
  return (
    <Box flexDirection="column" marginTop={2} marginX={1}>
      {statusMsg && <Text color={isSuccess ? theme.text.success : theme.text.danger}>{statusMsg}</Text>}
    </Box>
  );
};

export default IdManager;
