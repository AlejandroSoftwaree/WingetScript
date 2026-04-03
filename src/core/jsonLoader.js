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
