import { textUrl } from '@/config';
import { SESSION_ID_KEY } from '@/utils/auth';

export type Part = {
  id: string;
  text: string;
};

export type Parts = {
  parts: Part[];
};

const timeout = 5000;

const textService = {
  async get(): Promise<Parts> {
    try {
      console.debug(`get texts ${textUrl}`);
      const sessionId = sessionStorage.getItem(SESSION_ID_KEY);
      if (!sessionId) {
        throw new Error('No session ID found in sessionStorage');
      }
      const response = await fetch(textUrl, {
        method: 'GET',
        headers: {
          Authorization: `bearer ${sessionId}`,
        },
        signal: AbortSignal.timeout(timeout),
      });
      if (!response.ok) {
        const responseText = await response.text();
        throw new Error(`Unable to get texts, code ${response.status}: ${responseText}`);
      }
      const data = await response.json();
      return data;
    } catch (error) {
      throw new Error(`Unable to get texts: ${error}`);
    }
  },

  async save(input: Parts): Promise<string> {
    try {
      const sessionId = sessionStorage.getItem(SESSION_ID_KEY);
      if (!sessionId) {
        return 'no session';
      }
      console.debug(`save texts ${textUrl}`);
      const response = await fetch(textUrl, {
        method: 'POST',
        headers: {
          Authorization: `bearer ${sessionId}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(input),
        signal: AbortSignal.timeout(timeout),
      });
      if (!response.ok) {
        const responseText = await response.text();
        throw new Error(`Unable to save texts, code ${response.status}: ${responseText}`);
      }
      return 'ok';
    } catch (error) {
      throw new Error(`Unable to save texts: ${error}`);
    }
  },
};

export default textService;
