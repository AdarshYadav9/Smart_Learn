import assert from 'node:assert/strict';
import {
  ApiError,
  normalizeOrigin,
  request,
  enrolledAssignments,
  type Classroom,
  type Assignment,
} from '../src/lib/api';
Object.assign(globalThis, { __DEV__: true });
test('server configuration rejects paths, credentials and non-HTTP URLs', () => {
  assert.equal(
    normalizeOrigin(' http://10.0.2.2:8000/ '),
    'http://10.0.2.2:8000',
  );
  for (const value of [
    'file:///tmp',
    'https://user:pass@host',
    'https://host/api',
    'https://host/?key=abc',
  ])
    assert.throws(() => normalizeOrigin(value));
  Object.assign(globalThis, { __DEV__: false });
  assert.throws(() => normalizeOrigin('http://host'));
  assert.equal(normalizeOrigin('https://host'), 'https://host');
  Object.assign(globalThis, { __DEV__: true });
});
test('assignment display excludes unenrolled, archived and unscoped classrooms', () => {
  const classes = [
    { id: 'joined', archived: false },
    { id: 'archived', archived: true },
  ] as Classroom[];
  const assignments = ['joined', 'other', 'archived', null].map(
    (classroom_id, i) => ({ id: String(i), classroom_id }),
  ) as Assignment[];
  assert.deepEqual(
    enrolledAssignments(assignments, classes).map(a => a.id),
    ['0'],
  );
  assert.deepEqual(enrolledAssignments(assignments, []), []);
});
test('API sends bearer tokens and JSON login payloads, preserves unauthorized status', async () => {
  const original = globalThis.fetch;
  try {
    globalThis.fetch = async (input, init) => {
      assert.equal(input, 'https://host/auth/login');
      assert.equal(init?.method, 'POST');
      assert.equal(
        (init?.headers as Record<string, string>).Authorization,
        'Bearer token',
      );
      assert.deepEqual(JSON.parse(init?.body as string), {
        email: 'student@test.com',
      });
      return new Response(
        JSON.stringify({ detail: 'Invalid email or password' }),
        { status: 401 },
      );
    };
    await assert.rejects(
      request('https://host', '/auth/login', 'token', {
        email: 'student@test.com',
      }),
      (e: unknown) =>
        e instanceof ApiError &&
        e.status === 401 &&
        e.message === 'Invalid email or password',
    );
    globalThis.fetch = async () => {
      throw new TypeError('fetch failed');
    };
    await assert.rejects(
      request('https://host', '/api/classrooms/me'),
      /Cannot reach the server/,
    );
    globalThis.fetch = async () => new Response(JSON.stringify([]));
    expect(await request('https://host', '/api/classrooms/me')).toEqual([]);
  } finally {
    globalThis.fetch = original;
  }
});
