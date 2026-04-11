import { spawn } from 'child_process';
import stripAnsi from 'strip-ansi';

/**
 * Ejecuta un comando de Winget.
 * @param {string} action - La acción (install, download, upgrade, uninstall).
 * @param {string} id - El ID del programa.
 * @returns {Promise<void>}
 */
let currentWingetProcess = null;

export const runWinget = (action, id, onData, onProgress) => {
   return new Promise((resolve, reject) => {
      const actionMap = {
         'install': 'install',
         'download': 'download',
         'update': 'upgrade',
         'delete': 'uninstall'
      };

      const wingetAction = actionMap[action] || action;
      const headerMsg = `Ejecutando: winget ${wingetAction} -e --id ${id}\n\n`;
      let localLog = headerMsg;
      if (onData) onData(headerMsg);

      // stdio: 'pipe' convierte la salida al formato asíncrono y omite pintar directo
      const winget = spawn('winget', [wingetAction, '-e', '--id', id], {
         stdio: 'pipe'
      });

      currentWingetProcess = winget;
      let streamBuffer = '';

      winget.stdout.on('data', (data) => {
         const rawString = data.toString('utf8');

         if (onProgress) {
            const lines = rawString.split(/[\r\n]+/);
            for (const line of lines) {
               if (line.match(/\d+(?:\.\d+)?\s*[KMG]B\s*\/\s*\d+(?:\.\d+)?\s*[KMG]B/)) {
                  onProgress(line.trim());
               }
            }
         }

         streamBuffer += rawString;

         // Extraer lineas completas del buffer
         let lfIndex;
         while ((lfIndex = streamBuffer.search(/[\r\n]/)) !== -1) {
            // Extraemos la linea hasta el salto
            const rawLine = streamBuffer.substring(0, lfIndex);
            const terminator = streamBuffer[lfIndex];

            // Avanzar el buffer
            if (terminator === '\r' && streamBuffer[lfIndex + 1] === '\n') {
               streamBuffer = streamBuffer.substring(lfIndex + 2);
            } else {
               streamBuffer = streamBuffer.substring(lfIndex + 1);
            }

            let cleanLine = stripAnsi(rawLine).replace(/[\b]/g, '').trim();

            // Ignorar lineas vacías, spinners o barras de progreso
            if (!cleanLine) continue;
            if (/^[\/\\\-\| █▉▊▋▌▍▎▏▓▒░]+$/.test(cleanLine)) continue;
            if (cleanLine.match(/\d+(?:\.\d+)?\s*[KMG]B\s*\/\s*\d+(?:\.\d+)?\s*[KMG]B/)) continue;

            const outLine = cleanLine + '\n';
            localLog += outLine;
            if (onData) onData(outLine);
         }
      });

      winget.stderr.on('data', (data) => {
         const errData = stripAnsi(data.toString('utf8'));
         localLog += errData;
         if (onData) onData(errData);
      });

      winget.on('close', (code) => {
         // Flush residual si el buffer quedo con algo al cerrar
         if (streamBuffer.trim()) {
            const finalClean = stripAnsi(streamBuffer).replace(/[\b]/g, '').trim();
            if (finalClean && !/^[\/\\\-\| █▉▊▋▌▍▎▏▓▒░]+$/.test(finalClean) && !finalClean.match(/\d+(?:\.\d+)?\s*[KMG]B\s*\/\s*\d+(?:\.\d+)?\s*[KMG]B/)) {
               const finalOut = finalClean + '\n';
               localLog += finalOut;
               if (onData) onData(finalOut);
            }
         }

         currentWingetProcess = null;
         if (code !== 0) {
            localLog += `\nError: Winget finalizó con código ${code}`;
         }
         resolve(localLog);
      });

      winget.on('error', (err) => {
         currentWingetProcess = null;
         reject(new Error(`${localLog}\nFallo al iniciar el proceso: ${err.message}`));
      });
   });
};

// Hook de gracia para Ctrl+C en OS para matar The Child Process
process.on('SIGINT', () => {
   if (currentWingetProcess) {
      currentWingetProcess.kill('SIGINT');
   }
   process.exit(0);
});

/**
 * Ejecuta una acción sobre una lista de IDs y compila los resultados.
 * @param {string} action - La acción a realizar.
 * @param {string[]} ids - Lista de IDs de programas.
 * @param {function} onData - Callback para stream.
 * @param {function} onProgress - Callback para barra de descargas.
 * @returns {Promise<string>} Logs encadenados.
 */
export const runWingetBatch = async (action, ids, onData, onProgress) => {
   if (!ids || ids.length === 0) {
      return 'No hay programas para procesar en esta categoría.';
   }

   let finalLog = `\nProcesando ${ids.length} programas...\n`;
   if (onData) onData(finalLog);

   for (const id of ids) {
      const res = await runWinget(action, id, onData, onProgress);
      finalLog += res + '\n';
   }

   const endMsg = '\n¡Proceso finalizado!';
   finalLog += endMsg;
   if (onData) onData(endMsg);

   return finalLog;
};
