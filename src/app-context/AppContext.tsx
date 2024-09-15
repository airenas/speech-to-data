import React, { createContext, useContext, useState } from 'react';

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
};

const TranscriberContext = createContext<TranscriberContextType | undefined>(undefined);

export const TranscriberProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [lists, setLists] = useState<EditableList[]>([]);
  const [nextId, setNextId] = useState<number>(1);

  return (
    <TranscriberContext.Provider value={{ lists, setLists, nextId, setNextId }}>
      {children}
    </TranscriberContext.Provider>
  );
};

export const useTranscriber = () => {
  const context = useContext(TranscriberContext);
  if (context === undefined) {
    throw new Error('useTranscriber must be used within a TranscriberProvider');
  }
  return context;
};
