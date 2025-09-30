import { configUrl } from '@/config';

export type Config = {
  skipTour?: boolean;
};

const timeout = 5000;

const configService = {
  async get(): Promise<Config> {
    try {
      console.debug(`get cfg ${configUrl}`);
      const sessionId = sessionStorage.getItem('session_id');
      if (!sessionId) {
        throw new Error('No session ID found in sessionStorage');
      }
      const response = await fetch(configUrl, {
        method: 'GET',
        headers: {
          Authorization: `bearer ${sessionId}`,
        },
        signal: AbortSignal.timeout(timeout),
      });
      if (!response.ok) {
        const responseText = await response.text();
        throw new Error(`Unable to get config, code ${response.status}: ${responseText}`);
      }
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error during get config:', error);
      throw error;
    }
  },

  async save(config: Config): Promise<string> {
    try {
      const sessionId = sessionStorage.getItem('session_id');
      if (!sessionId) {
        return 'no session';
      }
      console.debug(`save cfg ${configUrl}`);
      const response = await fetch(configUrl, {
        method: 'POST',
        headers: {
          Authorization: `bearer ${sessionId}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(config),
        signal: AbortSignal.timeout(timeout),
      });
      if (!response.ok) {
        const responseText = await response.text();
        throw new Error(`Unable to save config, code ${response.status}: ${responseText}`);
      }
      return 'ok';
    } catch (error) {
      console.error('Error during save config:', error);
      throw error;
    }
  },
};

export default configService;
