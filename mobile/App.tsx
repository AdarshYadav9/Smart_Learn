import React from 'react';
import { StatusBar } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { SessionProvider, useSession } from './src/lib/session';
import SignIn from './src/screens/SignIn';
import Dashboard from './src/screens/Dashboard';
function Screens() {
  const { session } = useSession();
  return session ? <Dashboard /> : <SignIn />;
}
export default function App() {
  return (
    <SafeAreaProvider>
      <StatusBar barStyle="dark-content" />
      <SessionProvider>
        <Screens />
      </SessionProvider>
    </SafeAreaProvider>
  );
}
