import React, { useEffect, useRef, useState } from 'react';

import { Button } from '@mui/material';
import { useTheme } from '@mui/material/styles';

interface ClearButtonProps {
  onClear: () => void;
  disabled: boolean;
}

const ClearButton: React.FC<ClearButtonProps> = ({ onClear, disabled }) => {
  const [showCancel, setShowCancel] = useState(false);
  const [progress, setProgress] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const timerDrawRef = useRef<NodeJS.Timeout | null>(null);
  const theme = useTheme();

  useEffect(() => {
    if (showCancel) {
      console.debug('useEffect setInterval');
      const startTime = Date.now();
      timerDrawRef.current = setInterval(() => {
        const elapsed = Date.now() - startTime;
        setProgress(Math.min(elapsed / 3000, 1));
      }, 10);

      return () => {
        if (timerDrawRef.current) {
          console.debug('clearing timeouut');
          clearInterval(timerDrawRef.current);
        }
      };
    }
  }, [showCancel]);

  const handleClick = () => {
    console.debug('click clearing');
    if (!showCancel) {
      setShowCancel(true);

      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }

      timerRef.current = setTimeout(() => {
        console.debug('clearing');
        onClear();
        setShowCancel(false);
        setProgress(0);
      }, 3000);
    } else {
      console.debug('clearing timeout click');
      setShowCancel(false);
      if (timerRef.current) {
        console.debug('clearing timeout ', timerRef.current);
        clearTimeout(timerRef.current);
        setProgress(0);
        timerRef.current = null;
      }
    }
  };

  return (
    <Button
      variant="contained"
      color="primary"
      onClick={handleClick}
      disabled={disabled}
      id="clear-button"
      sx={{
        position: 'relative',
        overflow: 'hidden',
        padding: '6px 16px',
        '&:disabled': {
          cursor: 'not-allowed',
        },
      }}
    >
      {showCancel ? (
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            height: '100%',
            width: `${progress * 100}%`,
            backgroundColor: theme.palette.warning.light,
            transition: 'width 0.1s',
            opacity: 0.5,
          }}
        />
      ) : null}
      {showCancel ? 'Atšaukti' : 'Trinti viską'}
    </Button>
  );
};

export default ClearButton;
