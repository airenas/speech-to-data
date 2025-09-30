import { useContext } from 'react';

import { TranscriberContext } from './AppContext';

export const useAppContext = () => {
  const context = useContext(TranscriberContext);
  if (context === undefined) {
    throw new Error('useTranscriber must be used within a TranscriberProvider');
  }
  return context;
};
