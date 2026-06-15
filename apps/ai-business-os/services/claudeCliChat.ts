/**
 * Claude Code CLI chat service.
 *
 * Invokes `claude --print --output-format json` as user `claudecli` (uid 1500)
 * via runuser in production, ou direto fora do container.
 * Auth via env CLAUDE_CODE_OAUTH_TOKEN (long-lived token gerado por `claude setup-token`).
 */

import { spawn } from 'node:child_process';

export interface ClaudeCliMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface ClaudeCliRequest {
  system?: string;
  messages: ClaudeCliMessage[];
  model?: string;
}

export interface ClaudeCliResult {
  content: string;
  raw?: Record<string, unknown>;
}

const isProd = () => process.env.NODE_ENV === 'production';

export const claudeCliChat = async (req: ClaudeCliRequest): Promise<ClaudeCliResult> => {
  const transcript = req.messages
    .filter((m) => m.role !== 'system')
    .map((m) => `[${m.role.toUpperCase()}]\n${m.content}`)
    .join('\n\n');
  const systemMsg = req.system ?? req.messages.find((m) => m.role === 'system')?.content;
  const prompt = systemMsg ? `${systemMsg}\n\n---\n\n${transcript}` : transcript;

  const args = ['--print', '--output-format', 'json'];
  if (req.model && req.model.trim()) args.push('--model', req.model);

  const useRunuser = isProd();
  const cmd = useRunuser ? 'runuser' : 'claude';
  const cmdArgs = useRunuser ? ['-u', 'claudecli', '--', 'claude', ...args] : args;

  const env: NodeJS.ProcessEnv = { ...process.env };
  // Pass token explicitly — runuser strips most env by default.
  if (process.env.CLAUDE_CODE_OAUTH_TOKEN) {
    env.CLAUDE_CODE_OAUTH_TOKEN = process.env.CLAUDE_CODE_OAUTH_TOKEN;
  }

  return new Promise<ClaudeCliResult>((resolve, reject) => {
    const child = spawn(cmd, cmdArgs, { stdio: ['pipe', 'pipe', 'pipe'], env });
    let stdout = '';
    let stderr = '';
    child.stdout.on('data', (d: Buffer) => { stdout += d.toString(); });
    child.stderr.on('data', (d: Buffer) => { stderr += d.toString(); });
    child.on('error', reject);
    child.on('close', (code) => {
      if (code !== 0) {
        return reject(new Error(`claude exited ${code}: ${stderr.slice(0, 400)}`));
      }
      try {
        const parsed = JSON.parse(stdout) as Record<string, unknown>;
        const content =
          typeof parsed.result === 'string'
            ? parsed.result
            : typeof parsed.content === 'string'
              ? parsed.content
              : stdout;
        if (parsed.is_error) {
          return reject(new Error(typeof parsed.result === 'string' ? parsed.result : 'CLI returned error'));
        }
        return resolve({ content, raw: parsed });
      } catch {
        return resolve({ content: stdout.trim() });
      }
    });
    child.stdin.write(prompt);
    child.stdin.end();
  });
};
