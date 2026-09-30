/**
 * Minimal server as a Vite plugin (runs in Node for `vite` and `vite preview`):
 *   POST /api/interpret   break summary -> Gemini (or pre-recorded fallback) -> guardrails
 *   GET/POST /api/feedback  "Not relevant" feedback, kept in memory + a JSON file
 * The Gemini key only lives here; it is never exposed to the browser.
 */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { dirname, resolve } from 'node:path';
import type { Connect, Plugin } from 'vite';
import fixtures from '../src/detection/fixtures.json' with { type: 'json' };
import {
  applyGuardrails,
  sanitizeCandidates,
  type DismissedMoment,
  type InterpretRequest,
  type InterpretResponse,
} from '../src/detection/guardrails.ts';
import { buildUserPrompt, SYSTEM_PROMPT } from '../src/detection/prompt.ts';
import type { FeedbackEntry } from '../src/types.ts';
import { callGemini, DEFAULT_GEMINI_MODEL } from './gemini.ts';

interface Options {
  apiKey?: string;
  model?: string;
  feedbackFile?: string;
}

class HttpError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

function readBody(req: IncomingMessage): Promise<unknown> {
  return new Promise((ok, fail) => {
    let raw = '';
    req.on('data', (c) => (raw += c));
    req.on('end', () => {
      try {
        ok(raw ? JSON.parse(raw) : {});
      } catch (e) {
        fail(e);
      }
    });
  });
}

function send(res: ServerResponse, status: number, body: unknown) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(body));
}

export function kbcApi({ apiKey, model = DEFAULT_GEMINI_MODEL, feedbackFile = '.data/feedback.json' }: Options): Plugin {
  const file = resolve(feedbackFile);
  let feedback: FeedbackEntry[] = [];
  try {
    feedback = JSON.parse(readFileSync(file, 'utf8'));
  } catch {
    feedback = [];
  }
  const saveFeedback = () => {
    mkdirSync(dirname(file), { recursive: true });
    writeFileSync(file, JSON.stringify(feedback, null, 2));
  };
  const dismissedFor = (customerId: string): DismissedMoment[] =>
    feedback
      .filter((f) => f.customerId === customerId && f.response === 'dismissed')
      .map(({ category, moment }) => ({ category, moment }));

  async function interpret(body: InterpretRequest): Promise<InterpretResponse> {
    const customerId = body.demoKey.split('/')[0];
    const dismissed = dismissedFor(customerId);

    if (!body.summary.hasBreak) {
      return { source: 'no-break', candidates: [], decision: applyGuardrails([], body.consent, dismissed) };
    }

    let source: InterpretResponse['source'] = 'fallback';
    let fallbackReason: string | undefined;
    let candidates = [] as ReturnType<typeof sanitizeCandidates>;
    if (apiKey) {
      try {
        candidates = sanitizeCandidates(await callGemini(apiKey, model, SYSTEM_PROMPT, buildUserPrompt(body.summary, dismissed)));
        if (candidates.length) source = 'live-gemini';
        else fallbackReason = 'Gemini returned no valid candidate';
      } catch (e) {
        fallbackReason = (e as Error).name === 'TimeoutError' ? 'Gemini timeout' : `Gemini error · ${(e as Error).message}`;
        console.warn(`[kbc-api] ${fallbackReason}`);
      }
    } else {
      fallbackReason = 'No GEMINI_API_KEY on the server';
    }
    if (source === 'fallback') {
      const fixtureKey = body.fixtureKey ?? body.demoKey;
      if (body.mode === 'live') {
        if (!body.allowFallback) throw new HttpError(apiKey ? 502 : 503, fallbackReason ?? 'Gemini unavailable');
        fallbackReason = `${fallbackReason} · PRE-RECORDED answer of closest demo profile (${fixtureKey}), not a live analysis`;
      }
      candidates = sanitizeCandidates((fixtures as Record<string, unknown>)[fixtureKey]);
    }
    return {
      source,
      fallbackReason,
      model: source === 'live-gemini' ? model : undefined,
      candidates,
      decision: applyGuardrails(candidates, body.consent, dismissed),
    };
  }

  const handler: Connect.NextHandleFunction = async (req, res, next) => {
    try {
      if (req.url === '/interpret' && req.method === 'POST') {
        return send(res, 200, await interpret((await readBody(req)) as InterpretRequest));
      }
      if (req.url === '/feedback' && req.method === 'GET') return send(res, 200, feedback);
      if (req.url === '/feedback' && req.method === 'POST') {
        const entry = (await readBody(req)) as Omit<FeedbackEntry, 'at' | 'customerId'>;
        const saved: FeedbackEntry = { ...entry, customerId: entry.demoKey.split('/')[0], at: new Date().toISOString() };
        feedback = [saved, ...feedback];
        saveFeedback();
        return send(res, 200, saved);
      }
      if (req.url === '/feedback' && req.method === 'DELETE') {
        feedback = [];
        saveFeedback();
        return send(res, 200, feedback);
      }
      next();
    } catch (e) {
      send(res, e instanceof HttpError ? e.status : 400, { error: (e as Error).message });
    }
  };

  return {
    name: 'kbc-moments-api',
    configureServer(server) {
      server.middlewares.use('/api', handler);
    },
    configurePreviewServer(server) {
      server.middlewares.use('/api', handler);
    },
  };
}
