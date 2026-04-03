import React, { useState, useEffect } from 'react';
import { Box, Text } from 'ink';
import Spinner from 'ink-spinner';

const ProcessingStatus = ({ isExecuting }) => {
  const [colorIndex, setColorIndex] = useState(0);
  const [seconds, setSeconds] = useState(0);
  
  const colors = ['#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#FF00FF', '#00FFFF'];

  useEffect(() => {
    let colorInterval;
    let timeInterval;

    if (isExecuting) {
      colorInterval = setInterval(() => {
        setColorIndex((prev) => (prev + 1) % colors.length);
      }, 2000); // 2 segundos por transición

      timeInterval = setInterval(() => {
        setSeconds((s) => s + 1);
      }, 1000);
    } else {
      setSeconds(0);
    }

    return () => {
      clearInterval(colorInterval);
      clearInterval(timeInterval);
    };
  }, [isExecuting]);

  if (!isExecuting) return null;

  const formatTime = (s) => {
    const mins = Math.floor(s / 60);
    const secs = s % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <Box paddingLeft={1} marginBottom={0}>
      <Text color={colors[colorIndex]}>
        <Spinner type="dots" /> Ejecutando proceso... <Text bold>[{formatTime(seconds)}]</Text>
      </Text>
    </Box>
  );
};

export default ProcessingStatus;
