import React, { useState, useEffect } from 'react';
import { Box, Text } from 'ink';
import Spinner from 'ink-spinner';
import theme from '../../core/theme.json';

const ProcessingStatus = ({ isExecuting, progress }) => {
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    let timeInterval;
    if (isExecuting) {
      timeInterval = setInterval(() => {
        setSeconds((s) => s + 1);
      }, 1000);
    } else {
      setSeconds(0);
    }

    return () => clearInterval(timeInterval);
  }, [isExecuting]);

  if (!isExecuting) return null;

  const formatTime = (s) => {
    const mins = Math.floor(s / 60);
    const secs = s % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <Box paddingLeft={1} marginBottom={0} justifyContent="space-between" width={process.stdout.columns - 4}>
      <Box>
        <Text color={theme.text.warning}><Spinner type="dots" /> </Text>
        <Text color={theme.text.primary}>Ejecutando proceso...</Text>
        {progress && <Text color={theme.text.success}> {progress}</Text>}
      </Box>
      <Box>
        <Text color={theme.text.muted}><Spinner type="clock" /> [{formatTime(seconds)}]</Text>
      </Box>
    </Box>
  );
};

export default ProcessingStatus;
