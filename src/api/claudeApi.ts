import type { Message, TaskItem } from '../types';

const CLAUDE_API_URL = process.env.EXPO_PUBLIC_SERVER_URL
  ? `${process.env.EXPO_PUBLIC_SERVER_URL}/api/claude/extract-tasks`
  : 'http://localhost:3001/api/claude/extract-tasks';

export interface ClaudeExtractResponse {
  tasks: TaskItem[];
  summary: string;
}

export async function extractTasksWithClaude(
  messages: Message[],
  authToken: string,
): Promise<ClaudeExtractResponse> {
  const transcript = messages
    .map((m) => {
      const ts =
        m.timestamp instanceof Date ? m.timestamp : new Date(m.timestamp);
      return `[${ts.toLocaleTimeString()}] ${m.senderName}: ${m.text}`;
    })
    .join('\n');

  const response = await fetch(CLAUDE_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${authToken}`,
    },
    body: JSON.stringify({ transcript }),
  });

  if (!response.ok) {
    throw new Error(`Claude API error: ${response.status}`);
  }

  return response.json() as Promise<ClaudeExtractResponse>;
}
