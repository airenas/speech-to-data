import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { ulid } from 'ulid';

import { makeLink } from '@/config';
import authService, { User } from '@/services/authService';
import configService from '@/services/configService';
import textService from '@/services/textService';
import useNotifications from '@/store/notifications';

export type TranscriptionView = {
  id: string;
  content: string;
  selected: boolean;
};

export enum TranscriberStatus {
  IDLE,
  LISTENING,
  TRANSCRIBING,
  STOPPING,
}

type TranscriberContextType = {
  lists: TranscriptionView[];
  setLists: React.Dispatch<React.SetStateAction<TranscriptionView[]>>;

  // transcriber: KaldiRTTranscriber | null;
  isRecording: boolean;
  setRecording: React.Dispatch<React.SetStateAction<boolean>>;
  isAuto: boolean;
  setAuto: React.Dispatch<React.SetStateAction<boolean>>;

  transcriberStatus: TranscriberStatus;
  setTranscriberStatus: React.Dispatch<React.SetStateAction<TranscriberStatus>>;

  workers: number;
  setWorkers: React.Dispatch<React.SetStateAction<number>>;

  user: User | null;

  showInfo: (str: string) => void;
  showError: (errStr: string) => void;
  logout: () => void;
  keepAlive: () => void;
  checkLogged: () => void;
  login: (user: string, pass: string) => void;
  clearList: () => void;
  selectLast: () => void;
};

const TranscriberContext = createContext<TranscriberContextType | undefined>(undefined);

export const TranscriberProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [lists, setLists] = useState<TranscriptionView[]>([
    { content: '', id: '', selected: true },
  ]);
  const [isRecording, setRecording] = useState<boolean>(false);
  const [isAuto, setAuto] = useState<boolean>(false);
  const [transcriberStatus, setTranscriberStatus] = useState<TranscriberStatus>(
    TranscriberStatus.IDLE,
  );
  const [workers, setWorkers] = useState<number>(0);
  const [user, setUser] = useState<User | null>(null);
  const [lastUser, setLastUser] = useState<string | null>(null);
  const prevListsRef = useRef<string>('[]');

  const navigate = useNavigate();
  const [, notificationsActions] = useNotifications();

  const login = async (username: string, password: string) => {
    const res = await authService.login(username, password);
    if (res.errorMsg) {
      showError(res.errorMsg);
    }
    if (res.sessionId) {
      sessionStorage.setItem('session_id', res.sessionId);
    } else {
      sessionStorage.removeItem('session_id');
    }
    setUser(res.user);
    if (res.user) {
      const user = res.user;
      if (res.sessionId) {
        try {
          const cfg = await configService.get();
          user.skipTour = cfg.skipTour || false;
          if (cfg.skipTour) {
            console.log('skip tour');
          }
        } catch (e) {
          console.error(e);
        }
      }

      setUser(user);

      showInfo('Prisijungta');
      navigate(makeLink('/'));
      if (user.name !== lastUser) {
        console.log(`user changed from ${lastUser} to ${user.name}`);
        clearList();
        setLastUser(res.user.name);
      }
    } else {
      setUser(res.user);
    }
  };

  const logout = async () => {
    const sessionId = sessionStorage.getItem('session_id');
    sessionStorage.removeItem('session_id');
    setUser(null);
    if (sessionId) {
      let res = await authService.logout(sessionId);
      if (res) {
        console.warn(res);
      }
    }
    clearList();
    showInfo('Atsijungta');
    navigate(makeLink('/login'));
  };

  const keepAlive = async () => {
    const sessionId = sessionStorage.getItem('session_id');
    if (sessionId) {
      console.log('call keep alive');
      let res = await authService.keepAlive(sessionId);
      if (res) {
        console.error(res);
      }
    }
  };

  const checkLogged = async () => {
    console.debug('check auth');
    const sessionId = sessionStorage.getItem('session_id');
    if (sessionId) {
      console.debug(`call check auth ${user}`);
      let res = await authService.sessionOK(sessionId);
      if (res) {
        console.error(res);
        sessionStorage.removeItem('session_id');
        setUser(null);
        showInfo('Atsijungta');
      }
    }
  };

  const selectLast = () => {
    console.debug('selectLast');
    setLists((prevLists) => {
      if (prevLists.length === 0) return prevLists; // No lists to update
      const updatedLists = [...prevLists];
      const lastItemIndex = updatedLists.length - 1;
      console.log('Updating list item:', lastItemIndex);
      updatedLists[lastItemIndex] = {
        ...updatedLists[lastItemIndex],
        selected: true,
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
    const id = ulid();
    let lists = [{ id: id, content: '', selected: false }];
    setLists(lists);
    saveLists(lists);
  };

  const saveLists = async (lists: TranscriptionView[]) => {
    console.log('SAVE LIST');
    let parts = lists
      .filter((l) => l.content && l.content.trim().length > 0)
      .map((l) => ({ id: l.id, text: l.content }));

    const current = JSON.stringify(parts);
    console.log(`Current: ${current}, Previous: ${prevListsRef.current}`);
    if (current !== prevListsRef.current) {
      try {
        await textService.save({ parts: parts });
        prevListsRef.current = current;
        console.log('Lists saved');
      } catch (err) {
        console.error('Failed to save lists:', err);
      }
    }
  };

  useEffect(() => {
    const initUser = async () => {
      console.log('INIT USER', user);
      if (!user) {
        return;
      }

      try {
        const res = await textService.get();
        if (!res.parts || res.parts.length === 0) {
          return;
        }
        let list = res.parts.map((p, index) => ({
          id: p.id || ulid(),
          content: p.text,
          selected: true,
        }));
        setLists(list);
      } catch (err) {
        console.error('Failed to load lists:', err);
      }
    };

    initUser();
  }, [user]);

  useEffect(() => {
    if (!user) return;

    const interval = setInterval(async () => {
      saveLists(lists);
    }, 5000);

    return () => clearInterval(interval);
  }, [lists, user]);

  return (
    <TranscriberContext.Provider
      value={{
        lists,
        setLists,
        isRecording,
        setRecording,
        workers,
        setWorkers,
        transcriberStatus,
        setTranscriberStatus,
        user,
        logout,
        showError,
        showInfo,
        login,
        keepAlive,
        clearList,
        checkLogged,
        isAuto,
        setAuto,
        selectLast,
      }}
    >
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
