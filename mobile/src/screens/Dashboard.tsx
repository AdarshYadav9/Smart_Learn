import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ApiError,
  request,
  enrolledAssignments,
  type Classroom,
  type Assignment,
  type Announcement,
} from '../lib/api';
import { useSession } from '../lib/session';
import {
  Button,
  Card,
  ErrorNotice,
  colors,
  styles,
  ListSeparator,
} from '../components/ui';
type Tab = 'Classes' | 'Assignments' | 'Updates';
type Row = {
  key: string;
  title: string;
  subtitle: string;
  body: string;
  badge: string;
  questions?: Assignment['questions'];
};
export default function Dashboard() {
  const { session, logout } = useSession();
  const [tab, setTab] = useState<Tab>('Classes');
  const [classes, setClasses] = useState<Classroom[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [updates, setUpdates] = useState<Announcement[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [expanded, setExpanded] = useState<string | null>(null);
  const generation = useRef(0);
  const load = useCallback(async () => {
    if (!session) return;
    const version = ++generation.current;
    setBusy(true);
    setError('');
    try {
      const [c, a, u] = await Promise.all([
        request<Classroom[]>(
          session.origin,
          '/api/classrooms/me',
          session.token,
        ),
        request<Assignment[]>(
          session.origin,
          '/api/student/assignments',
          session.token,
        ),
        request<{ announcements: Announcement[] }>(
          session.origin,
          '/api/announcements/',
          session.token,
        ),
      ]);
      if (version !== generation.current) return;
      setClasses(c.filter(item => !item.archived));
      setAssignments(enrolledAssignments(a, c));
      setUpdates(u.announcements);
    } catch (e) {
      if (version !== generation.current) return;
      if (e instanceof ApiError && e.status === 401) {
        await logout();
        return;
      }
      setError(
        e instanceof Error ? e.message : 'Could not load your dashboard.',
      );
    } finally {
      if (version === generation.current) setBusy(false);
    }
  }, [session, logout]);
  const invalidateRequests = useCallback(() => {
    generation.current++;
  }, []);
  useEffect(() => {
    // Starting a remote request sets loading; the request callback supplies data.
    void load();
    return invalidateRequests;
  }, [load, invalidateRequests]);
  if (!session) return null;
  const rows: Row[] =
    tab === 'Classes'
      ? classes.map(c => ({
          key: c.id,
          title: c.name,
          subtitle: [c.subject, c.section].filter(Boolean).join(' · '),
          body: `Teacher: ${c.teacherName}`,
          badge: 'Enrolled class',
        }))
      : tab === 'Assignments'
      ? assignments.map(a => ({
          key: a.id,
          title: a.title,
          subtitle: a.due_date
            ? `Due ${new Date(a.due_date).toLocaleDateString()}`
            : 'No due date',
          body: a.description,
          badge:
            a.score !== null
              ? `${a.submission_status} · ${a.score}/${a.total_marks}`
              : a.submission_status,
          questions: a.questions,
        }))
      : updates.map(u => ({
          key: u.id,
          title: u.title,
          subtitle: `${u.teacher_name} · ${new Date(
            u.created_at,
          ).toLocaleDateString()}`,
          body: u.message,
          badge: u.pinned ? 'Pinned update' : u.subject_name || 'Campus update',
        }));
  return (
    <SafeAreaView style={styles.page}>
      <FlatList
        data={rows}
        keyExtractor={item => item.key}
        contentContainerStyle={styles.content}
        refreshing={busy}
        onRefresh={() => void load()}
        ListHeaderComponent={
          <View style={styles.header}>
            <Text style={styles.badge}>SMART LEARN</Text>
            <Text style={styles.title}>
              Hi, {session.user.name.split(' ')[0]}.
            </Text>
            <Text style={styles.muted}>Your learning day, at a glance.</Text>
            <Card style={{ backgroundColor: colors.primary }}>
              <Text style={[styles.heading, styles.whiteText]}>
                {classes.length} active classes
              </Text>
              <Text style={[styles.text, styles.whiteText]}>
                {
                  assignments.filter(a => a.submission_status === 'pending')
                    .length
                }{' '}
                assignments awaiting submission
              </Text>
            </Card>
            <View accessibilityRole="tablist" style={styles.tabs}>
              {(['Classes', 'Assignments', 'Updates'] as const).map(value => (
                <Pressable
                  key={value}
                  accessibilityRole="tab"
                  accessibilityState={{ selected: tab === value }}
                  onPress={() => {
                    setTab(value);
                    setExpanded(null);
                  }}
                  style={[
                    styles.tab,
                    tab === value ? styles.selectedTab : styles.unselectedTab,
                  ]}
                >
                  <Text
                    style={[
                      styles.tabText,
                      tab === value
                        ? styles.selectedTabText
                        : styles.unselectedTabText,
                    ]}
                  >
                    {value}
                  </Text>
                </Pressable>
              ))}
            </View>
            {tab === 'Updates' ? (
              <Text style={styles.muted}>
                Campus-wide feed · latest 50 announcements
              </Text>
            ) : null}
            {error ? (
              <Card>
                <ErrorNotice message={error} />
                <Button
                  title="Retry"
                  onPress={() => void load()}
                  disabled={busy}
                />
              </Card>
            ) : null}
          </View>
        }
        ListEmptyComponent={
          busy ? (
            <ActivityIndicator
              size="large"
              color={colors.primary}
              accessibilityLabel="Loading dashboard"
            />
          ) : (
            <Card>
              <Text style={styles.heading}>
                {error ? 'Data unavailable' : `No ${tab.toLowerCase()} yet`}
              </Text>
              <Text style={styles.muted}>
                {error
                  ? 'Retry when your backend is reachable.'
                  : tab === 'Classes'
                  ? 'Join a class in the web app to see it here.'
                  : tab === 'Assignments'
                  ? 'Published work for your enrolled classes will appear here.'
                  : 'New announcements will appear here.'}
              </Text>
            </Card>
          )
        }
        ItemSeparatorComponent={ListSeparator}
        renderItem={({ item }) => (
          <Card>
            <Text style={styles.badge}>{item.badge}</Text>
            <Text style={styles.heading}>{item.title}</Text>
            <Text style={styles.muted}>{item.subtitle}</Text>
            {item.body ? <Text style={styles.text}>{item.body}</Text> : null}
            {item.questions?.length ? (
              <>
                <Button
                  title={
                    expanded === item.key ? 'Hide questions' : 'View questions'
                  }
                  onPress={() =>
                    setExpanded(expanded === item.key ? null : item.key)
                  }
                />
                {expanded === item.key
                  ? item.questions.map((q, i) => (
                      <Text key={q.id || i} style={styles.text}>
                        {i + 1}. {q.question_text} ({q.marks} marks)
                      </Text>
                    ))
                  : null}
              </>
            ) : null}
          </Card>
        )}
        ListFooterComponent={
          <View style={styles.footer}>
            <Button
              title="Sign out"
              onPress={() => {
                void logout();
              }}
            />
          </View>
        }
      />
    </SafeAreaView>
  );
}
