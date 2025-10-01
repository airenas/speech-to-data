import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { ulid } from 'ulid';

import { makeLink } from '@/config';
import authService, { User } from '@/services/authService';
import configService from '@/services/configService';
import textService from '@/services/textService';
import useNotifications from '@/store/notifications';
import { SESSION_ID_KEY } from '@/utils/auth';

import { TranscriberStatus, TranscriptionView } from './types';

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

export const TranscriberContext = createContext<TranscriberContextType | undefined>(undefined);

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
      sessionStorage.setItem(SESSION_ID_KEY, res.sessionId);
    } else {
      sessionStorage.removeItem(SESSION_ID_KEY);
    }
    setUser(res.user);
    if (res.user) {
      const user = res.user;
      if (res.sessionId) {
        try {
          const cfg = await configService.get();
          user.skipTour = cfg.skipTour || false;
          if (cfg.skipTour) {
            console.debug('skip tour');
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
    const sessionId = sessionStorage.getItem(SESSION_ID_KEY);
    sessionStorage.removeItem(SESSION_ID_KEY);
    setUser(null);
    if (sessionId) {
      const res = await authService.logout(sessionId);
      if (res) {
        console.warn(res);
      }
    }
    clearList();
    showInfo('Atsijungta');
    navigate(makeLink('/login'));
  };

  const keepAlive = async () => {
    const sessionId = sessionStorage.getItem(SESSION_ID_KEY);
    if (sessionId) {
      console.debug('call keep alive');
      const res = await authService.keepAlive(sessionId);
      if (res) {
        console.error(res);
      }
    }
  };

  const checkLogged = async () => {
    console.debug('check auth');
    const sessionId = sessionStorage.getItem(SESSION_ID_KEY);
    if (sessionId) {
      console.debug(`call check auth ${user}`);
      const res = await authService.sessionOK(sessionId);
      if (res) {
        console.error(res);
        sessionStorage.removeItem(SESSION_ID_KEY);
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
      console.debug('Updating list item:', lastItemIndex);
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
    const lists = [{ id: id, content: '', selected: false }];
    setLists(lists);
    saveLists(lists);
  };

  const saveLists = async (lists: TranscriptionView[]) => {
    const parts = lists
      .filter((l) => l.content && l.content.trim().length > 0)
      .map((l) => ({ id: l.id, text: l.content }));

    const current = JSON.stringify(parts);
    if (current !== prevListsRef.current) {
      try {
        await textService.save({ parts: parts });
        prevListsRef.current = current;
        console.debug('Lists saved: length', current.length);
      } catch (err) {
        console.error('Failed to save lists:', err);
      }
    }
  };

  useEffect(() => {
    const initUser = async () => {
      if (!user) {
        return;
      }

      try {
        const res = await textService.get();
        if (!res.parts || res.parts.length === 0) {
          return;
        }
        const list = res.parts.map((p, _index) => ({
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
