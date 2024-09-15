import { KaldiRTTranscriber } from '@/components/Audio/transcriber';
import React, { createContext, useContext, useEffect, useState } from 'react';

type EditableList = {
    id: number;
    content: string;
    selected: boolean;
};

type TranscriberContextType = {
    lists: EditableList[];
    setLists: React.Dispatch<React.SetStateAction<EditableList[]>>;
    nextId: number;
    setNextId: React.Dispatch<React.SetStateAction<number>>;

    // transcriber: KaldiRTTranscriber | null;
    isRecording: boolean;
    setRecording: React.Dispatch<React.SetStateAction<boolean>>;

    workers: number;
    setWorkers: React.Dispatch<React.SetStateAction<number>>;
};

const TranscriberContext = createContext<TranscriberContextType | undefined>(undefined);

export const TranscriberProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [lists, setLists] = useState<EditableList[]>([]);
    const [nextId, setNextId] = useState<number>(1);
    const [isRecording, setRecording] = useState<boolean>(false);
    const [workers, setWorkers] = useState<number>(0);


    // useEffect(() => {
    //     // Initialize RTTranscriber with configuration
    //     const transcriberInstance = new KaldiRTTranscriber({
    //         server: 'ws://localhost:8082/client/ws/speech',
    //         statusServer: 'ws://localhost:8082/client/ws/status',
    //         // Add other configuration options as needed
    //     });
    //     setTranscriber(transcriberInstance);

    //     // Cleanup on unmount
    //     return () => {
    //         transcriberInstance.stop();
    //     };
    // }, []);

    return (
        <TranscriberContext.Provider value={{ lists, setLists, nextId, setNextId, isRecording, setRecording, workers, setWorkers }}>
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
