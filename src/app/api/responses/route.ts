import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const OWNER = process.env.GH_OWNER || 'lalocripto';
const REPO = process.env.GH_REPO || 'viaje-presupuesto-anonimo';
const FILE_PATH = 'data/responses.json';
const BRANCH = process.env.GH_BRANCH || 'main';
const TOKEN = process.env.GH_TOKEN;

type Entry = { id: string; amount: number; created_at: string };

async function getFile() {
  const res = await fetch(`https://api.github.com/repos/${OWNER}/${REPO}/contents/${FILE_PATH}?ref=${BRANCH}`, {
    headers: {
      Authorization: `Bearer ${TOKEN}`,
      Accept: 'application/vnd.github+json',
    },
    cache: 'no-store',
  });

  if (res.status === 404) {
    return { sha: undefined as string | undefined, entries: [] as Entry[] };
  }

  if (!res.ok) {
    throw new Error(`GitHub read failed: ${res.status}`);
  }

  const data = await res.json();
  const decoded = Buffer.from(data.content, 'base64').toString('utf8');
  return { sha: data.sha as string, entries: JSON.parse(decoded) as Entry[] };
}

async function putFile(entries: Entry[], sha?: string) {
  const content = Buffer.from(JSON.stringify(entries, null, 2)).toString('base64');
  const body: Record<string, unknown> = {
    message: `update anonymous trip budget responses (${new Date().toISOString()})`,
    content,
    branch: BRANCH,
  };
  if (sha) body.sha = sha;

  const res = await fetch(`https://api.github.com/repos/${OWNER}/${REPO}/contents/${FILE_PATH}`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${TOKEN}`,
      Accept: 'application/vnd.github+json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`GitHub write failed: ${res.status} ${text}`);
  }
}

export async function GET() {
  try {
    if (!TOKEN) throw new Error('Missing GH_TOKEN');
    const { entries } = await getFile();
    return NextResponse.json({ entries: entries.sort((a, b) => +new Date(b.created_at) - +new Date(a.created_at)) });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to load entries' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    if (!TOKEN) throw new Error('Missing GH_TOKEN');
    const { amount } = await request.json();
    const numeric = Number(amount);
    if (!numeric || numeric <= 0) {
      return NextResponse.json({ error: 'Invalid amount' }, { status: 400 });
    }

    const { sha, entries } = await getFile();
    const entry: Entry = {
      id: crypto.randomUUID(),
      amount: numeric,
      created_at: new Date().toISOString(),
    };
    const nextEntries = [entry, ...entries].slice(0, 500);
    await putFile(nextEntries, sha);
    return NextResponse.json({ entry });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to save entry' }, { status: 500 });
  }
}
