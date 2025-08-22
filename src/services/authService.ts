import { User } from '../types';
import { setCookie, getCookie, deleteCookie } from '../utils/cookies';

// In a real app, this would be an API call to a server.
// For this demo, we'll use localStorage to simulate a user database and session storage.

const USERS_KEY = 'learnsphere_users';
const SESSION_COOKIE_NAME = 'learnsphere_session_id';

const getUsers = (): User[] => {
    try {
        const users = localStorage.getItem(USERS_KEY);
        return users ? JSON.parse(users) : [];
    } catch (e) {
        return [];
    }
};

const saveUsers = (users: User[]) => {
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
};

// Very simple mock password "hashing" for demonstration purposes.
// DO NOT USE THIS IN A REAL APPLICATION.
const mockHash = (password: string): string => `hashed_${password}_salt`;

export const authService = {
    signup: async (username: string, email: string, password: string): Promise<User> => {
        return new Promise((resolve, reject) => {
            setTimeout(() => { // Simulate network latency
                const users = getUsers();
                if (users.some(user => user.email === email)) {
                    return reject(new Error('An account with this email already exists.'));
                }
                const newUser: User = {
                    id: `user_${Date.now()}`,
                    username,
                    email,
                    passwordHash: mockHash(password),
                };
                saveUsers([...users, newUser]);
                const { passwordHash, ...userToReturn } = newUser;
                resolve(userToReturn as User);
            }, 500);
        });
    },

    login: async (email: string, password: string): Promise<User> => {
         return new Promise((resolve, reject) => {
            setTimeout(() => { // Simulate network latency
                const users = getUsers();
                const user = users.find(u => u.email === email);
                if (!user || user.passwordHash !== mockHash(password)) {
                    return reject(new Error('Invalid email or password.'));
                }
                
                const { passwordHash, ...userToReturn } = user;
                
                // --- Cookie Logic ---
                // 1. Create a session ID
                const sessionId = `session_${Date.now()}_${Math.random()}`;
                
                // 2. Store user data against session ID (simulating server-side session store)
                localStorage.setItem(`session_${sessionId}`, JSON.stringify(userToReturn));
                
                // 3. Set the session ID in a cookie
                setCookie(SESSION_COOKIE_NAME, sessionId, 7); // Cookie expires in 7 days
                
                resolve(userToReturn as User);
            }, 500);
        });
    },

    logout: (): void => {
        const sessionId = getCookie(SESSION_COOKIE_NAME);
        if (sessionId) {
            localStorage.removeItem(`session_${sessionId}`);
            deleteCookie(SESSION_COOKIE_NAME);
        }
    },

    getCurrentUserSession: (): User | null => {
        try {
            const sessionId = getCookie(SESSION_COOKIE_NAME);
            if (!sessionId) return null;
            
            const userJson = localStorage.getItem(`session_${sessionId}`);
            return userJson ? JSON.parse(userJson) : null;
        } catch (e) {
            return null;
        }
    },
};
