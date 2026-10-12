export type User = { id: string; name: string; email: string; role: string };
export type Classroom = {
  id: string;
  name: string;
  subject: string;
  section: string;
  teacherName: string;
  code: string;
  archived: boolean;
};
export type Assignment = {
  id: string;
  title: string;
  description: string;
  classroom_id: string | null;
  due_date: string | null;
  total_marks: number;
  score: number | null;
  submission_status: string;
  questions: { id: string; question_text: string; marks: number }[];
};
export type Announcement = {
  id: string;
  title: string;
  message: string;
  teacher_name: string;
  subject_name: string | null;
  pinned: boolean;
  created_at: string;
};
export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}
export function normalizeOrigin(value: string): string {
  const url = new URL(value.trim());
  if (
    !['http:', 'https:'].includes(url.protocol) ||
    url.username ||
    url.password ||
    url.search ||
    url.hash ||
    url.pathname !== '/'
  ) {
    throw new Error(
      'Enter a server origin, for example https://learn.example.com (without /api).',
    );
  }
  if (!__DEV__ && url.protocol !== 'https:')
    throw new Error('Release builds require HTTPS.');
  return url.origin;
}
export async function request<T>(
  origin: string,
  path: string,
  token?: string,
  body?: unknown,
): Promise<T> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 20000);
  try {
    const response = await fetch(`${origin}${path}`, {
      method: body === undefined ? 'GET' : 'POST',
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    });
    const data = await response.json().catch(() => null);
    if (!response.ok)
      throw new ApiError(
        typeof data?.detail === 'string'
          ? data.detail
          : `Request failed (${response.status}).`,
        response.status,
      );
    if (data === null)
      throw new Error('The server returned an invalid response.');
    return data as T;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new Error(
      error instanceof Error && error.name === 'AbortError'
        ? 'The server took too long. Try again.'
        : 'Cannot reach the server. Check the backend address and your connection.',
    );
  } finally {
    clearTimeout(timeout);
  }
}
export function enrolledAssignments(
  assignments: Assignment[],
  classes: Classroom[],
): Assignment[] {
  const ids = new Set(classes.filter(c => !c.archived).map(c => c.id));
  return assignments.filter(
    a => a.classroom_id !== null && ids.has(a.classroom_id),
  );
}
