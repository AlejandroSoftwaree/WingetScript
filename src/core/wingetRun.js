import { spawn } from 'child_process';

/**
 * Ejecuta un comando de Winget.
 * @param {string} action - La acción (install, download, upgrade, uninstall).
 * @param {string} id - El ID del programa.
 * @returns {Promise<void>}
 */
export const runWinget = (action, id) => {
  return new Promise((resolve, reject) => {
    // Mapeo de mis verbos a los verbos reales de Winget
    const actionMap = {
      'install': 'install',
      'download': 'download',
      'update': 'upgrade',
      'delete': 'uninstall'
    };

    const wingetAction = actionMap[action] || action;

    console.log(`\nEjecutando: winget ${wingetAction} -e --id ${id}`);

    const winget = spawn('winget', [wingetAction, '-e', '--id', id], {
      shell: true,
      stdio: 'inherit' // Esto permite que las barras de progreso se vean en la terminal
    });

    winget.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        console.error(`\nError: Winget finalizó con código ${code}`);
        resolve(); // Resolvemos de todos modos para no romper el bucle si uno falla
      }
    });

    winget.on('error', (err) => {
      console.error(`\nFallo al iniciar el proceso: ${err.message}`);
      reject(err);
    });
  });
};

/**
 * Ejecuta una acción sobre una lista de IDs.
 * @param {string} action - La acción a realizar.
 * @param {string[]} ids - Lista de IDs de programas.
 */
export const runWingetBatch = async (action, ids) => {
  if (!ids || ids.length === 0) {
    console.log('\nNo hay programas para procesar en esta categoría.');
    return;
  }

  console.log(`\nProcesando ${ids.length} programas...`);
  
  for (const id of ids) {
    await runWinget(action, id);
  }

  console.log('\n¡Proceso finalizado!');
};
