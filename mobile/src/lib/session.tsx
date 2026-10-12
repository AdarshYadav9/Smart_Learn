import {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
} from 'react';
import { request, normalizeOrigin, type User } from './api';
type Session = { origin: string; token: string; user: User };
type Auth = {
  session: Session | null;
  login: (origin: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
};
const Context = createContext<Auth | null>(null);
// A fresh login is required each launch. No passwords or user data are persisted.
export function SessionProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const login = useCallback(
    async (address: string, email: string, password: string) => {
      const origin = normalizeOrigin(address);
      const data = await request<{ access_token: string; user: User }>(
        origin,
        '/auth/login',
        undefined,
        { email: email.trim(), password },
      );
      if (data.user.role !== 'student')
        throw new Error(
          'This first mobile release supports student accounts. Use the web app for other roles.',
        );
      if (!data.access_token)
        throw new Error('The server did not return a session token.');
      setSession({ origin, token: data.access_token, user: data.user });
    },
    [],
  );
  const logout = useCallback(async () => {
    setSession(null);
  }, []);
  return (
    <Context.Provider value={{ session, login, logout }}>
      {children}
    </Context.Provider>
  );
}
export function useSession() {
  const value = useContext(Context);
  if (!value) throw new Error('SessionProvider missing');
  return value;
}
