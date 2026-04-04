import React, { useState, useEffect } from 'react';
import { Text, useInput } from 'ink';

const CustomTextInput = ({ value = '', onChange, onSubmit, disableSubmit, placeholder }) => {
  const [cursorOffset, setCursorOffset] = useState(value.length);

  useInput((char, key) => {
    // Saltos por palabra (Ctrl + Flechas, Alt + Flechas / Secuencias ANSI crudas)
    if (char === '\x1b[1;5D' || char === '\x1b[5D' || char === '\x1b[1;3D' || char === '\x1b\x1b[D' || (key.ctrl && key.leftArrow) || (key.meta && key.leftArrow)) {
      let newOffset = cursorOffset;
      while (newOffset > 0 && value[newOffset - 1] === ' ') newOffset--;
      while (newOffset > 0 && value[newOffset - 1] !== ' ') newOffset--;
      setCursorOffset(newOffset);
      return;
    }
    if (char === '\x1b[1;5C' || char === '\x1b[5C' || char === '\x1b[1;3C' || char === '\x1b\x1b[C' || (key.ctrl && key.rightArrow) || (key.meta && key.rightArrow)) {
      let newOffset = cursorOffset;
      const len = value.length;
      while (newOffset < len && value[newOffset] === ' ') newOffset++;
      while (newOffset < len && value[newOffset] !== ' ') newOffset++;
      setCursorOffset(newOffset);
      return;
    }

    if (key.leftArrow) {
      setCursorOffset(prev => Math.max(0, prev - 1));
      return;
    }
    if (key.rightArrow) {
      setCursorOffset(prev => Math.min(value.length, prev + 1));
      return;
    }

    // Ctrl+Backspace, Alt+Backspace, Ctrl+W, \x08 (Raw Backspace en Windows CLI node)
    const isWordDelete = 
        char === '\x17' || 
        char === '\x08' || 
        char === '\x1f' || 
        (key.ctrl && char === 'w') || 
        (key.meta && (key.delete || key.backspace)) || 
        (key.ctrl && (key.delete || key.backspace));

    if (isWordDelete) {
      if (value === '/' || value === '') return;
      
      const beforeCursor = value.slice(0, cursorOffset);
      const afterCursor = value.slice(cursorOffset);
      
      const match = beforeCursor.match(/^(.*?\s+)?\S+\s*$/);
      let newBefore = match ? (match[1] || '') : '';
      if (newBefore === '' && beforeCursor.startsWith('/')) {
        newBefore = '/';
      }
      
      const res = newBefore + afterCursor;
      onChange(res);
      setCursorOffset(newBefore.length);
      return;
    }

    if (key.backspace || key.delete) {
      if (cursorOffset > 0) {
        const res = value.slice(0, cursorOffset - 1) + value.slice(cursorOffset);
        onChange(res);
        setCursorOffset(cursorOffset - 1);
      }
      return;
    }

    if (key.return) {
      if (!disableSubmit && onSubmit) onSubmit(value);
      return;
    }

    if (key.tab || key.upArrow || key.downArrow || key.escape || char === '\x1b') {
        return;
    }

    if (typeof char === 'string' && char.length > 0) {
      const isVisible = !key.ctrl && !key.meta;
      if (isVisible) {
         const res = value.slice(0, cursorOffset) + char + value.slice(cursorOffset);
         onChange(res);
         setCursorOffset(cursorOffset + char.length);
      }
    }
  });

  const partBeforeCursor = value.slice(0, cursorOffset);
  const cursorChar = value.slice(cursorOffset, cursorOffset + 1) || ' ';
  const partAfterCursor = value.slice(cursorOffset + 1);

  if (!value && placeholder) {
    return (
      <Text>
        <Text backgroundColor="cyan" color="black">{placeholder[0]}</Text>
        <Text color="gray">{placeholder.slice(1)}</Text>
      </Text>
    );
  }

  return (
    <Text>
      <Text>{partBeforeCursor}</Text>
      <Text backgroundColor="cyan" color="black">{cursorChar}</Text>
      <Text>{partAfterCursor}</Text>
    </Text>
  );
};

export default CustomTextInput;
