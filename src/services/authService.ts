import { authUrl } from "@/config";

export type User = {
    name: string;
};

export type LoginResult = {
    user: User | null;
    sessionId: string | null;
    errorMsg: string | null;
};

const authService = {
    async login(username: string, password: string): Promise<LoginResult> {
        try {
            const loginUrl = authUrl + '/login'
            console.debug(`loginUrl ${loginUrl}`)


            const response = await fetchWithTimeout(loginUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ user: username, pass: password }),
            });

            if (!response.ok) {
                const body = await response.text();
                const res: LoginResult = {
                    user: null,
                    sessionId: null,
                    errorMsg: getError(body)
                };
                return res;
            }

            const data = await response.json();

            const newUser: User = {
                name: data.user.name
            };
            const res: LoginResult = {
                user: newUser,
                sessionId: data.session_id,
                errorMsg: null
            };
            return res;
        } catch (error: any) {
            console.error('Error during login:', error);
            const res: LoginResult = {
                user: null,
                sessionId: null,
                errorMsg: getError(error)
            };
            return res;
        }
    },

    async logout(sessionId: string): Promise<string> {
        const logoutUrl = authUrl + '/logout'
        console.debug(`logoutUrl ${logoutUrl}`)

        try {
            const response = await fetchWithTimeout(logoutUrl, {
                method: 'POST',
                headers: {
                    'Authorization': `bearer ${sessionId}`,
                }
            });

            if (!response.ok) {
                const body = await response.text();
                return "Nepavyko iškviesti atsijunimo metodo"
            }
            console.debug('Logged out');
            return ""
        }
        catch (error: any) {
            console.error('Error during logout:', error);
            return "Nepavyko iškviesti atsijunimo metodo";
        }
    },

    // You can add more methods here related to authentication, such as:
    async keepAlive(sessionId: string): Promise<string> {
        try {
            const keepAliveUrl = authUrl + '/keep-alive'
            console.debug(`keepAliveUrl ${keepAliveUrl}`)
            const response = await fetchWithTimeout(keepAliveUrl, {
                method: 'POST',
                headers: {
                    'Authorization': `bearer ${sessionId}`,
                }
            });
            if (!response.ok) {
                const responseText = await response.text();
                console.error(`can't call keep-alive ${responseText}`);
                if (response.status == 401) {
                    return getError(responseText);
                }
            }
            console.log('called');
        } catch (error) {
            console.error('Error during keep-alive:', error);
        }
        return ""
    }
}

const fetchWithTimeout = (url: string, options: RequestInit, timeout = 5000): Promise<Response> => {
    return Promise.race([
        fetch(url, options),
        new Promise<Response>((_, reject) =>
            setTimeout(() => reject(new Error('Request timed out')), timeout)
        ),
    ]);
};

export default authService;

function getError(body: string): string {
    if (body.includes("Wrong password")) {
        return "Neteisingas vartotojas arba slaptažodis"
    }
    if (body.includes("Password expired")) {
        return "Slaptažodis negalioja"
    }
    return "Nepavyko prisijungti";
}

