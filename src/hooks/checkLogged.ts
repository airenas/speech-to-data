import { useEffect } from 'react';

import { useAppContext } from '@/app-context/AppContext';

export const useCheckLogged = () => {
  const { checkLogged } = useAppContext();

  useEffect(() => {
    let pingTimeout: NodeJS.Timeout | undefined;
    const getPingInterval = () => {
      const basePingInterval = 60000;
      const randomizationRange = 10000;
      const randomAdjustment =
        Math.floor(Math.random() * randomizationRange * 2) - randomizationRange;
      return basePingInterval + randomAdjustment;
    };

    const ping = async () => {
      clearTimeout(pingTimeout);
      try {
        await checkLogged();
      } finally {
        setPingTimer();
      }
    };

    const setPingTimer = () => {
      pingTimeout = setTimeout(ping, getPingInterval());
    };

    setPingTimer();

    return () => {
      clearTimeout(pingTimeout);
    };
  }, [checkLogged]);
};
