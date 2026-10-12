import {
  Pressable,
  StyleSheet,
  Text,
  View,
  type ViewProps,
} from 'react-native';
export const colors = {
  ink: '#172743',
  muted: '#62718A',
  primary: '#365CE6',
  background: '#F4F6FC',
  border: '#E0E5F0',
};
export const styles = StyleSheet.create({
  separator: { height: 12 },
  footer: { marginTop: 24 },
  full: { flex: 1 },
  centered: { flexGrow: 1, justifyContent: 'center' },
  whiteText: { color: 'white' },
  header: { gap: 16 },
  tabs: { flexDirection: 'row', gap: 8 },
  tab: { flex: 1, paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
  selectedTab: { backgroundColor: colors.primary },
  unselectedTab: { backgroundColor: '#FFFFFF' },
  selectedTabText: { color: '#FFFFFF' },
  unselectedTabText: { color: colors.ink },
  tabText: { fontWeight: '600' },
  page: { flex: 1, backgroundColor: colors.background },
  content: { padding: 22, gap: 16, paddingBottom: 36 },
  title: { fontSize: 28, fontWeight: '700', color: colors.ink },
  heading: { fontSize: 19, fontWeight: '700', color: colors.ink },
  text: { color: colors.ink, fontSize: 16, lineHeight: 24 },
  muted: { color: colors.muted, fontSize: 14, lineHeight: 22 },
  card: {
    padding: 20,
    gap: 9,
    backgroundColor: 'white',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
  },
  input: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 15,
    fontSize: 16,
    color: colors.ink,
  },
  button: {
    minHeight: 48,
    padding: 14,
    borderRadius: 12,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: { color: 'white', fontWeight: '600', fontSize: 16 },
  error: { color: '#AE283D', fontSize: 15, lineHeight: 22 },
  badge: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
});
export function Card({ children, style, ...props }: ViewProps) {
  return (
    <View style={[styles.card, style]} {...props}>
      {children}
    </View>
  );
}
export function Button({
  title,
  onPress,
  disabled = false,
}: {
  title: string;
  onPress: () => void;
  disabled?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        { opacity: disabled ? 0.45 : pressed ? 0.75 : 1 },
      ]}
    >
      <Text style={styles.buttonText}>{title}</Text>
    </Pressable>
  );
}
export function ErrorNotice({ message }: { message: string }) {
  return (
    <Text
      accessibilityRole="alert"
      accessibilityLiveRegion="polite"
      style={styles.error}
    >
      {message}
    </Text>
  );
}

export function ListSeparator() {
  return <View style={styles.separator} />;
}
