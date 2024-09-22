import React, { createContext, useContext, useState } from 'react';

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
};

const TranscriberContext = createContext<TranscriberContextType | undefined>(undefined);

export const TranscriberProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [lists, setLists] = useState<TranscriptionView[]>([{ audioUrl: '', content: '', id: 0, selected: true }]);
    const [nextId, setNextId] = useState<number>(1);
    const [isRecording, setRecording] = useState<boolean>(false);
    const [isWorking, setWorking] = useState<boolean>(false);
    const [workers, setWorkers] = useState<number>(0);

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

    return (
        <TranscriberContext.Provider value={{ lists, setLists, nextId, setNextId, isRecording, setRecording, workers, setWorkers, setAudio, isWorking, setWorking }}>
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
