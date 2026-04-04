import { exec } from 'child_process';
import { promises as fs } from 'fs';
import { createWriteStream } from 'fs';
import path from 'path';

// Ejecuta un comando en powershell evitando inyección de string usando Base64
const runPsEncoded = (scriptStr) => {
  return new Promise((resolve, reject) => {
    // Windows PowerShell expects UTF16LE encoding for -EncodedCommand
    const buf = Buffer.from(scriptStr, 'utf16le');
    const encoded = buf.toString('base64');
    
    exec(`powershell -NoProfile -ExecutionPolicy Bypass -EncodedCommand ${encoded}`, (error, stdout, stderr) => {
      if (error) {
        reject(error);
        return;
      }
      resolve(stdout.trim());
    });
  });
};

export const setWin10ContextMenu = async () => {
    const psCmd = `
        $regPath = "HKCU:\\Software\\Classes\\CLSID\\{86ca1aa0-34aa-4e8b-a509-50c905bae2a2}\\InprocServer32"
        if (!(Test-Path $regPath)) {
            New-Item -Path $regPath -Force | Out-Null
            Set-ItemProperty -Path $regPath -Name "(default)" -Value "" | Out-Null
            taskkill /f /im explorer.exe | Out-Null
            Start-Process explorer.exe
            Write-Output "SUCCESS"
        } else {
            Write-Output "ALREADY_EXISTS"
        }
    `;
    return await runPsEncoded(psCmd);
};

export const setWin11ContextMenu = async () => {
    const psCmd = `
        $regPath = "HKCU:\\Software\\Classes\\CLSID\\{86ca1aa0-34aa-4e8b-a509-50c905bae2a2}\\InprocServer32"
        if (Test-Path $regPath) {
            Remove-Item -Path $regPath -Force
            taskkill /f /im explorer.exe | Out-Null
            Start-Process explorer.exe
            Write-Output "SUCCESS"
        } else {
            Write-Output "ALREADY_REVERTED"
        }
    `;
    return await runPsEncoded(psCmd);
};

export const exportDirectoryTree = async (rootPath, outputPath) => {
  try {
    const rootStat = await fs.stat(rootPath);
    if (!rootStat.isDirectory()) {
       throw new Error('NOT_A_DIRECTORY');
    }
  } catch (e) {
    if (e.message === 'NOT_A_DIRECTORY') throw e;
    throw new Error('INVALID_PATH');
  }

  // Resuelve la ruta relativa usando el current working dir si es necesario
  const absRoot = path.resolve(rootPath);
  const absOutput = path.resolve(outputPath);

  const writeStream = createWriteStream(absOutput, { encoding: 'utf8' });
  writeStream.write(`Directorio: ${absRoot}\n\n`);

  let count = 0;

  const traverse = async (currentPath, level) => {
    const indent = '\t#'.repeat(level);
    const leaf = path.basename(currentPath) || currentPath;
    writeStream.write(`${indent}${leaf}\n`);
    count++;

    let entries;
    try {
       entries = await fs.readdir(currentPath, { withFileTypes: true });
    } catch(e) { return; } // ignora errores de permisos en carpetas del sistema

    const folders = entries.filter(e => e.isDirectory()).sort((a,b) => a.name.localeCompare(b.name));
    const files = entries.filter(e => e.isFile()).sort((a,b) => a.name.localeCompare(b.name));

    for (const folder of folders) {
      await traverse(path.join(currentPath, folder.name), level + 1);
    }
    
    for (const file of files) {
       const fileIndent = '\t'.repeat(level + 1);
       writeStream.write(`${fileIndent}${file.name}\n`);
       count++;
    }
  };

  await traverse(absRoot, 0);
  writeStream.end();
  
  return new Promise((resolve) => {
    writeStream.on('finish', () => resolve({ count, path: absOutput }));
  });
};
