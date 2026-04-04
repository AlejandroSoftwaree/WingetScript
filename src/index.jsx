//!/usr/bin/env node
import { Command } from 'commander';
import React from 'react';
import { render } from 'ink';
import App from './ui/App.jsx';

const program = new Command();

program
  .name('winget-cli')
  .description('Winget automation CLI with interactive TUI')
  .version('1.0.0');

// Si no hay argumentos, lanzamos la interfaz de Ink
program.action(() => {
  console.clear();
  render(<App />);
});

program.parse(process.argv);
