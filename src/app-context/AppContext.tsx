import { makeLink } from '@/config';
import authService, { User } from '@/services/authService';
import useNotifications from '@/store/notifications';
import React, { createContext, useContext, useState } from 'react';
import { useNavigate } from 'react-router-dom';

export type TranscriptionView = {
    id: number;
    content: string;
    selected: boolean;
    audioUrl: string | null;
};

type TranscriberContextType = {
    lists: TranscriptionView[];
    setLists: React.Dispatch<React.SetStateAction<TranscriptionView[]>>;
    nextId: number;
    setNextId: React.Dispatch<React.SetStateAction<number>>;

    // transcriber: KaldiRTTranscriber | null;
    isRecording: boolean;
    setRecording: React.Dispatch<React.SetStateAction<boolean>>;


    isWorking: boolean;
    setWorking: React.Dispatch<React.SetStateAction<boolean>>;

    workers: number;
    setWorkers: React.Dispatch<React.SetStateAction<number>>;

    setAudio: (audioUrl: string) => void;

    user: User | null;
    setUser: React.Dispatch<React.SetStateAction<User | null>>;

    showInfo: (str: string) => void;
    showError: (errStr: string) => void;
    logout: () => void;
    keepAlive: () => void;
    checkLogged: () => void;
    login: (user: string, pass: string) => void;
    clearList: () => void;

};

const TranscriberContext = createContext<TranscriberContextType | undefined>(undefined);

export const TranscriberProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [lists, setLists] = useState<TranscriptionView[]>([{ audioUrl: '', content: '', id: 0, selected: true }]);
    const [nextId, setNextId] = useState<number>(1);
    const [isRecording, setRecording] = useState<boolean>(false);
    const [isWorking, setWorking] = useState<boolean>(false);
    const [workers, setWorkers] = useState<number>(0);
    const [user, setUser] = useState<User | null>(null);

    const navigate = useNavigate();
    const [, notificationsActions] = useNotifications();

    const login = async (username: string, password: string) => {
        const res = await authService.login(username, password);
        if (res.errorMsg) {
            showError(res.errorMsg)
        }
        if (res.sessionId) {
            sessionStorage.setItem('session_id', res.sessionId);
        } else {
            sessionStorage.removeItem('session_id');
        }
        setUser(res.user)
        if (res.user) {
            showInfo("Prisijungta");
            navigate(makeLink('/'));
        }
    };

    const logout = async () => {
        const sessionId = sessionStorage.getItem('session_id');
        sessionStorage.removeItem('session_id');
        setUser(null);
        if (sessionId) {
            let res = await authService.logout(sessionId);
            if (res) {
                console.warn(res)
            }
        }
        clearList();
        showInfo("Atsijungta")
        navigate(makeLink('/login'));
    };

    const keepAlive = async () => {
        const sessionId = sessionStorage.getItem('session_id');
        if (sessionId) {
            console.log("call keep alive")
            let res = await authService.keepAlive(sessionId);
            if (res) {
                console.error(res)
            }
        }
    };

    const checkLogged = async () => {
        console.debug("check auth")
        const sessionId = sessionStorage.getItem('session_id');
        if (sessionId) {
            console.log("call check auth")
            let res = await authService.sessionOK(sessionId);
            if (res) {
                console.error(res)
                sessionStorage.removeItem('session_id');
                setUser(null);
                showInfo("Atsijungta")
            }
        }
    };

    const setAudio = (audioUrl: string) => {
        console.log('Setting audio URL:', audioUrl);
        setLists(prevLists => {
            if (prevLists.length === 0) return prevLists; // No lists to update
            const updatedLists = [...prevLists];
            const lastItemIndex = updatedLists.length - 1;
            console.log('Updating list item:', lastItemIndex);
            updatedLists[lastItemIndex] = {
                ...updatedLists[lastItemIndex],
                audioUrl, // Update the audio of the last list item
                selected: true, // Select the last list item
            };
            return updatedLists;
        });
    };

    function showInfo(msg: string) {
        notificationsActions.push({
            options: {
                variant: 'infoNotification',
            },
            message: msg,
        });
    }

    function showError(msg: string) {
        notificationsActions.push({
            options: {
                variant: 'errorNotification',
            },
            message: msg,
        });
    }

    const clearList = () => {
        console.debug('clearing list');
        setLists([{ id: nextId, content: '', selected: false, audioUrl: null }]);
        setNextId(nextId + 1);
    };

    return (
        <TranscriberContext.Provider value={{
            lists, setLists, nextId, setNextId, isRecording, setRecording, workers, setWorkers, setAudio, isWorking, setWorking, user, setUser,
            logout, showError, showInfo, login, keepAlive, clearList, checkLogged

        }}>
            {children}
        </TranscriberContext.Provider>
    );
};

export const useAppContext = () => {
    const context = useContext(TranscriberContext);
    if (context === undefined) {
        throw new Error('useTranscriber must be used within a TranscriberProvider');
    }
    return context;
};
