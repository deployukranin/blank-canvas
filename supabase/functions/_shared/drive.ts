/**
 * Google Drive helpers (via Lovable connector gateway).
 * No SDKs — Fetch API only.
 */

export const DRIVE_GATEWAY = 'https://connector-gateway.lovable.dev/google_drive';

/** Root folder created in the owner's Drive to hold all platform content. */
export const DRIVE_ROOT_FOLDER_ID = '15rFk2RKpUpIBfzjgMrn8YaNJCwTdTVXq';

export const MAX_UPLOAD_BYTES = 100 * 1024 * 1024; // 100MB per file

function driveHeaders(): HeadersInit {
  const lovableKey = Deno.env.get('LOVABLE_API_KEY');
  const driveKey = Deno.env.get('GOOGLE_DRIVE_API_KEY');
  if (!lovableKey || !driveKey) throw new Error('Google Drive connector not configured');
  return {
    Authorization: `Bearer ${lovableKey}`,
    'X-Connection-Api-Key': driveKey,
  };
}

export async function driveFetch(path: string, init: RequestInit = {}): Promise<Response> {
  return await fetch(`${DRIVE_GATEWAY}${path}`, {
    ...init,
    headers: { ...driveHeaders(), ...(init.headers || {}) },
  });
}

async function readError(res: Response): Promise<string> {
  const body = await res.text();
  return `[${res.status}] ${body}`;
}

/** Find (or create) a sub-folder by name under a parent folder. */
export async function ensureFolder(name: string, parentId: string): Promise<string> {
  const q = encodeURIComponent(
    `name='${name.replace(/'/g, "\\'")}' and mimeType='application/vnd.google-apps.folder' and '${parentId}' in parents and trashed=false`,
  );
  const listRes = await driveFetch(`/drive/v3/files?q=${q}&fields=files(id,name)&pageSize=1`);
  if (listRes.ok) {
    const data = await listRes.json();
    if (data?.files?.length) return data.files[0].id as string;
  } else {
    console.error('drive list folder failed:', await readError(listRes));
  }

  const createRes = await driveFetch('/drive/v3/files?fields=id', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name,
      mimeType: 'application/vnd.google-apps.folder',
      parents: [parentId],
    }),
  });
  if (!createRes.ok) throw new Error(`Drive folder create failed ${await readError(createRes)}`);
  const created = await createRes.json();
  return created.id as string;
}

/** Sanitizes a tenant label so it is safe as a Drive folder name. */
export function safeFolderName(label: string): string {
  return label.replace(/[\\/\r\n']/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 120);
}

/**
 * Folder for a tenant, named after the store (slug/name/email) instead of its UUID.
 * Migrates any legacy folder still named with the raw store id.
 */
export async function ensureStoreFolder(
  storeId: string,
  label: string,
  parentId: string,
): Promise<string> {
  const name = safeFolderName(label) || storeId;

  const find = async (folderName: string): Promise<string | null> => {
    const q = encodeURIComponent(
      `name='${folderName.replace(/'/g, "\\'")}' and mimeType='application/vnd.google-apps.folder' and '${parentId}' in parents and trashed=false`,
    );
    const res = await driveFetch(`/drive/v3/files?q=${q}&fields=files(id,name)&pageSize=1`);
    if (!res.ok) {
      console.error('drive list folder failed:', await readError(res));
      return null;
    }
    const data = await res.json();
    return data?.files?.length ? (data.files[0].id as string) : null;
  };

  const existing = await find(name);
  if (existing) return existing;

  // Legacy folder named with the store UUID → rename it, keeping the files
  const legacy = await find(storeId);
  if (legacy) {
    const renameRes = await driveFetch(`/drive/v3/files/${encodeURIComponent(legacy)}?fields=id`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name }),
    });
    if (!renameRes.ok) console.error('drive folder rename failed:', await readError(renameRes));
    return legacy;
  }

  return await ensureFolder(name, parentId);
}


/** Fixed sub-folders every tenant folder must have. */
export const STORE_SUBFOLDERS = ['config', 'vip', 'customs'] as const;

/**
 * Ensures `TingleBox/<tenant>` exists with all three standard sub-folders,
 * returning the tenant folder id plus a name → id map of the sub-folders.
 */
export async function ensureStoreTree(
  storeId: string,
  label: string,
  parentId: string,
): Promise<{ storeFolderId: string; folders: Record<string, string> }> {
  const storeFolderId = await ensureStoreFolder(storeId, label, parentId);
  const folders: Record<string, string> = {};
  for (const name of STORE_SUBFOLDERS) {
    folders[name] = await ensureFolder(name, storeFolderId);
  }
  return { storeFolderId, folders };
}

/** Multipart upload of a small/medium file. Returns the Drive file id. */
export async function uploadFile(
  bytes: Uint8Array,
  fileName: string,
  mimeType: string,
  parentId: string,
): Promise<string> {
  const boundary = `lovable${crypto.randomUUID().replace(/-/g, '')}`;
  const encoder = new TextEncoder();
  const metadata = JSON.stringify({ name: fileName, parents: [parentId] });

  const head = encoder.encode(
    `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${metadata}\r\n` +
      `--${boundary}\r\nContent-Type: ${mimeType || 'application/octet-stream'}\r\n\r\n`,
  );
  const tail = encoder.encode(`\r\n--${boundary}--\r\n`);

  const body = new Uint8Array(head.length + bytes.length + tail.length);
  body.set(head, 0);
  body.set(bytes, head.length);
  body.set(tail, head.length + bytes.length);

  const res = await driveFetch('/upload/drive/v3/files?uploadType=multipart&fields=id,name,size', {
    method: 'POST',
    headers: { 'Content-Type': `multipart/related; boundary=${boundary}` },
    body,
  });
  if (!res.ok) throw new Error(`Drive upload failed ${await readError(res)}`);
  const json = await res.json();
  return json.id as string;
}

export async function deleteFile(fileId: string): Promise<void> {
  const res = await driveFetch(`/drive/v3/files/${encodeURIComponent(fileId)}`, { method: 'DELETE' });
  if (!res.ok && res.status !== 404) {
    console.error('drive delete failed:', await readError(res));
  }
}

/* ---------------- Signed media links ---------------- */

function b64url(bytes: ArrayBuffer): string {
  return btoa(String.fromCharCode(...new Uint8Array(bytes)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

async function hmac(payload: string): Promise<string> {
  const secret = Deno.env.get('DRIVE_MEDIA_SIGNING_SECRET');
  if (!secret) throw new Error('DRIVE_MEDIA_SIGNING_SECRET missing');
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  return b64url(await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(payload)));
}

export async function signMediaToken(fileId: string, expiresAtSec: number): Promise<string> {
  return await hmac(`${fileId}.${expiresAtSec}`);
}

export async function verifyMediaToken(fileId: string, expiresAtSec: number, sig: string): Promise<boolean> {
  if (!Number.isFinite(expiresAtSec) || expiresAtSec * 1000 < Date.now()) return false;
  const expected = await signMediaToken(fileId, expiresAtSec);
  if (expected.length !== sig.length) return false;
  let diff = 0;
  for (let i = 0; i < expected.length; i++) diff |= expected.charCodeAt(i) ^ sig.charCodeAt(i);
  return diff === 0;
}
