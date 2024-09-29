import { useAppContext } from '@/app-context/AppContext';
import { useEffect } from 'react';

export const checkLogged = () => {
    const { checkLogged } = useAppContext();

    useEffect(() => {
        let pingTimeout: any;
        const pingInterval = 60000;

        const ping = async () => {
            clearTimeout(pingTimeout);
            try {
                await checkLogged();
            } finally {
                setPingTimer();
            }
        };

        const setPingTimer = () => {
            pingTimeout = setTimeout(ping, pingInterval);
        };

        setPingTimer();

        return () => {
            clearTimeout(pingTimeout);
        };
    }, []);
};
