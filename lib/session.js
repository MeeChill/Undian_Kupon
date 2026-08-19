import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';

const secretKey = process.env.SESSION_SECRET || 'rahasia-dapur-jangan-disebar';
const key = new TextEncoder().encode(secretKey);

export async function encrypt(payload) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('1d') // Sesi berlaku 1 hari
    .sign(key);
}

export async function decrypt(session) {
  try {
    const { payload } = await jwtVerify(session, key, {
      algorithms: ['HS256'],
    });
    return payload;
  } catch (error) {
    return null;
  }
}

export function getScannerRtFromUsername(username) {
  if (!username) return null;

  const match = username.match(/rt(\d{1,2})/i);
  if (match) return parseInt(match[1], 10);

  const legacyMatch = username.match(/scanner(\d+)/i);
  if (legacyMatch) return parseInt(legacyMatch[1], 10);

  return null;
}

export async function createSession(userOrUsername, role) {
  const expires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 1 hari
  const payload = typeof userOrUsername === 'object'
    ? {
        userId: userOrUsername.id ?? userOrUsername.userId ?? null,
        username: userOrUsername.username,
        role: userOrUsername.role,
        rt: userOrUsername.rt ?? getScannerRtFromUsername(userOrUsername.username),
      }
    : {
        userId: null,
        username: userOrUsername,
        role,
        rt: getScannerRtFromUsername(userOrUsername),
      };

  const session = await encrypt({ ...payload, expires });

  // Simpan cookie
  cookies().set('session', session, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    expires,
    sameSite: 'lax',
    path: '/',
  });
}

export async function deleteSession() {
  cookies().delete('session');
}

export async function getSession() {
  const session = cookies().get('session')?.value;
  if (!session) return null;
  return await decrypt(session);
}
