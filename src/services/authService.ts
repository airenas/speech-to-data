import { authUrl } from '@/config';

export type User = {
  name: string;
  skipTour?: boolean;
};

export type LoginResult = {
  user: User | null;
  sessionId: string | null;
  errorMsg: string | null;
};

const timeout = 5000;

const authService = {
  async login(username: string, password: string): Promise<LoginResult> {
    try {
      const loginUrl = authUrl + '/login';
      console.debug(`loginUrl ${loginUrl}`);
      const response = await fetch(loginUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ user: username, pass: password }),
        signal: AbortSignal.timeout(timeout),
      });

      if (!response.ok) {
        const body = await response.text();
        const res: LoginResult = {
          user: null,
          sessionId: null,
          errorMsg: getError(body),
        };
        return res;
      }

      const data = await response.json();

      const newUser: User = {
        name: data.user.name,
      };
      const res: LoginResult = {
        user: newUser,
        sessionId: data.session_id,
        errorMsg: null,
      };
      return res;
    } catch (error: unknown) {
      console.error('Error during login:', error);
      const res: LoginResult = {
        user: null,
        sessionId: null,
        errorMsg: getError(error),
      };
      return res;
    }
  },

  async logout(sessionId: string): Promise<string> {
    const logoutUrl = authUrl + '/logout';
    console.debug(`logoutUrl ${logoutUrl}`);

    try {
      const response = await fetch(logoutUrl, {
        method: 'POST',
        headers: {
          Authorization: `bearer ${sessionId}`,
        },
        signal: AbortSignal.timeout(timeout),
      });

      if (!response.ok) {
        const body = await response.text();
        console.error(`can't call logout ${body}`);
        return 'Nepavyko iškviesti atsijungimo metodo';
      }
      console.debug('Logged out');
      return '';
    } catch (error: unknown) {
      console.error('Error during logout:', error);
      return 'Nepavyko iškviesti atsijunimo metodo';
    }
  },

  // You can add more methods here related to authentication, such as:
  async keepAlive(sessionId: string): Promise<string> {
    try {
      const keepAliveUrl = authUrl + '/keep-alive';
      console.debug(`keepAliveUrl ${keepAliveUrl}`);
      const response = await fetch(keepAliveUrl, {
        method: 'POST',
        headers: {
          Authorization: `bearer ${sessionId}`,
        },
        signal: AbortSignal.timeout(timeout),
      });
      if (!response.ok) {
        const responseText = await response.text();
        console.error(`can't call keep-alive ${responseText}`);
        if (response.status == 401) {
          return getError(responseText);
        }
      }
    } catch (error) {
      console.error('Error during keep-alive:', error);
    }
    return '';
  },

  async sessionOK(sessionId: string): Promise<string> {
    try {
      const validateUrl = authUrl + '/validate';
      console.debug(`validate ${validateUrl}`);
      const response = await fetch(validateUrl, {
        method: 'GET',
        headers: {
          Authorization: `bearer ${sessionId}`,
        },
        signal: AbortSignal.timeout(timeout),
      });
      if (!response.ok) {
        const responseText = await response.text();
        console.error(`can't call validate ${responseText}`);
        if (response.status == 401) {
          return getError(responseText);
        }
      }
    } catch (error) {
      console.error('Error during validate:', error);
    }
    return '';
  },
};

export default authService;

function getError(error: unknown): string {
  if (error instanceof Error) {
    return getErrorStr(error.message);
  } else if (typeof error === 'string') {
    return getErrorStr(error);
  } else {
    return getErrorStr('An unknown error occurred');
  }
}

function getErrorStr(error: string): string {
  if (error.includes('Wrong user or password')) {
    return 'Neteisingas vartotojas arba slaptažodis';
  }
  if (error.includes('Password expired')) {
    return 'Slaptažodis negalioja';
  }
  if (error.includes('Session expired')) {
    return 'Neprisijungta. Prisijunkite iš naujo';
  }
  if (error.includes('No session')) {
    return 'Neprisijungta. Prisijunkite';
  }
  if (error.includes('No access')) {
    return 'Nesuteiktas leidimas prisijungti';
  }
  return 'Nepavyko prisijungti';
}
