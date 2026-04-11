import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

let cachedData = null;

/**
 * Carga el archivo ProgramasId.json solo cuando es necesario.
 * @returns {Object} El contenido del JSON.
 */
export const getProgramData = () => {
  if (cachedData) return cachedData;

  // El JSON está en la raíz del proyecto (un nivel arriba de donde se ejecute el bundle en /dist)
  const jsonPath = path.resolve(__dirname, '../ProgramasId.json');

  try {
    const rawData = fs.readFileSync(jsonPath, 'utf8');
    cachedData = JSON.parse(rawData);
    return cachedData;
  } catch (error) {
    console.error('Error al cargar ProgramasId.json:', error.message);
    return null;
  }
};

/**
 * Obtiene los IDs de una categoría específica.
 * @param {string} categoryKey - La clave de la categoría en el JSON.
 * @returns {string[]} Lista de IDs.
 */
export const getProgramsByCategory = (categoryKey) => {
  const data = getProgramData();
  if (!data || !data[categoryKey]) return [];
  return data[categoryKey];
};

/**
 * Obtiene todos los IDs de todas las categorías en una lista aplanada.
 * @returns {Array<{id: string, category: string}>}
 */
export const getAllProgramsFlat = () => {
  const data = getProgramData();
  if (!data) return [];

  const allPrograms = [];
  for (const category in data) {
    data[category].forEach(id => {
      allPrograms.push({ id, category });
    });
  }
  return allPrograms;
};

/**
 * Guarda los datos en ProgramasId.json con formato ordenado.
 */
export const saveProgramData = (data) => {
  const jsonPath = path.resolve(__dirname, '../ProgramasId.json');
  try {
    const sortedData = {};
    const sortedKeys = Object.keys(data).sort();

    for (const key of sortedKeys) {
      if (Array.isArray(data[key])) {
        sortedData[key] = [...data[key]]
          .filter(item => item && typeof item === 'string' && item.trim() !== '')
          .sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()));
      }
    }

    fs.writeFileSync(jsonPath, JSON.stringify(sortedData, null, 2), 'utf8');
    cachedData = sortedData;
  } catch (error) {
    console.error('Error al guardar ProgramasId.json:', error.message);
  }
};

export const addCategory = (categoryName) => {
  const data = getProgramData();
  if (!data) return false;

  if (data[categoryName]) return false;

  data[categoryName] = [];
  saveProgramData(data);
  return true;
};

export const addProgramId = (categoryName, id) => {
  const data = getProgramData();
  if (!data || !data[categoryName]) return false;

  if (data[categoryName].includes(id)) return false;

  data[categoryName].push(id);
  saveProgramData(data);
  return true;
};

export const removeProgramId = (categoryName, id) => {
  const data = getProgramData();
  if (!data || !data[categoryName]) return false;

  const index = data[categoryName].indexOf(id);
  if (index === -1) return false;

  data[categoryName].splice(index, 1);
  saveProgramData(data);
  return true;
};

export const updateProgramId = (categoryName, oldId, newId) => {
  const data = getProgramData();
  if (!data || !data[categoryName]) return false;

  const index = data[categoryName].indexOf(oldId);
  if (index === -1) return false;

  if (data[categoryName].includes(newId)) return false;

  data[categoryName][index] = newId;
  saveProgramData(data);
  return true;
};

export const formatJsonValues = () => {
  const data = getProgramData();
  if (data) saveProgramData(data);
};
