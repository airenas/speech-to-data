import { useAppContext } from '@/app-context/AppContext';
import { useEffect, useRef } from 'react';

export const useKeepAlivePing = () => {
    const lastCallTimeRef = useRef<number>(0);
    const { keepAlive } = useAppContext();

    useEffect(() => {
        let pingTimeout: any;
        const pingInterval = 60000;

        const sendKeepAlivePing = async () => {
            keepAlive();
        };

        const resetPingTimer = () => {
            // console.log("reset")
            const currentTime = Date.now();
            if (lastCallTimeRef.current === null || currentTime - lastCallTimeRef.current > pingInterval) {
                lastCallTimeRef.current = currentTime
                setTimeout(sendKeepAlivePing, 500);
            }
        };

        const setupActivityListeners = () => {
            window.addEventListener('mousemove', resetPingTimer);
            window.addEventListener('keydown', resetPingTimer);
            window.addEventListener('mousedown', resetPingTimer);
            window.addEventListener('input', resetPingTimer);
        };

        setupActivityListeners();
        resetPingTimer();

        return () => {
            // Clean up event listeners and timeout on unmount
            clearTimeout(pingTimeout);
            window.removeEventListener('mousemove', resetPingTimer);
            window.removeEventListener('keydown', resetPingTimer);
            window.removeEventListener('mousedown', resetPingTimer);
            window.removeEventListener('input', resetPingTimer);
        };
    }, []);
};
