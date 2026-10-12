import { useState } from 'react';
import {
  Platform,
  Text,
  TextInput,
  KeyboardAvoidingView,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSession } from '../lib/session';
import { Button, Card, ErrorNotice, styles } from '../components/ui';
export default function SignIn() {
  const { login } = useSession();
  const [origin, setOrigin] = useState(
    Platform.OS === 'android'
      ? 'http://10.0.2.2:8000'
      : 'http://localhost:8000',
  );
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  async function submit() {
    setBusy(true);
    setError('');
    try {
      await login(origin, email, password);
      setPassword('');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Sign-in failed.');
    } finally {
      setBusy(false);
    }
  }
  return (
    <SafeAreaView style={styles.page}>
      <KeyboardAvoidingView
        style={styles.full}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={[styles.content, styles.centered]}
        >
          <Text style={styles.badge}>SMART LEARN · STUDENT</Text>
          <Text style={styles.title}>Your classroom, in your pocket.</Text>
          <Text style={styles.muted}>
            Stay close to your classes, deadlines, and campus updates.
          </Text>
          <Card>
            <Text style={styles.heading}>Welcome back</Text>
            <Text style={styles.muted}>Backend address</Text>
            <TextInput
              accessibilityLabel="Backend server address"
              style={styles.input}
              value={origin}
              onChangeText={setOrigin}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="url"
              editable={!busy}
            />
            <Text style={styles.muted}>Email</Text>
            <TextInput
              accessibilityLabel="Email"
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="email-address"
              autoComplete="email"
              editable={!busy}
            />
            <Text style={styles.muted}>Password</Text>
            <TextInput
              accessibilityLabel="Password"
              style={styles.input}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoComplete="current-password"
              editable={!busy}
              onSubmitEditing={() => {
                if (!busy && email.trim() && password) void submit();
              }}
            />
            {error ? <ErrorNotice message={error} /> : null}
            <Button
              title={busy ? 'Signing in…' : 'Sign in'}
              onPress={() => void submit()}
              disabled={busy || !email.trim() || !password}
            />
          </Card>
          <Text style={styles.muted}>
            Use your existing Smart Learn student account. On a physical phone,
            enter your backend computer’s LAN address.
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
