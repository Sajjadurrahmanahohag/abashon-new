import { GoogleAuthProvider, signInWithPopup, onAuthStateChanged, User } from 'firebase/auth';
import { auth } from './firebase';

// Google Auth Provider with necessary scopes
const provider = new GoogleAuthProvider();
provider.addScope('https://www.googleapis.com/auth/chat.spaces.create');
provider.addScope('https://www.googleapis.com/auth/calendar');
provider.addScope('https://www.googleapis.com/auth/drive.file');

// In-memory token caching (do NOT store in localStorage for security)
let cachedAccessToken: string | null = null;
let isSigningIn = false;

// Initialize Workspace Auth State Listener
export const initWorkspaceAuth = (
  onAuthSuccess?: (user: User, token: string) => void,
  onAuthFailure?: () => void
) => {
  return onAuthStateChanged(auth, async (user: User | null) => {
    if (user) {
      if (cachedAccessToken) {
        if (onAuthSuccess) onAuthSuccess(user, cachedAccessToken);
      } else if (!isSigningIn) {
        // Logged in but no Google token cached (e.g. email/password login)
        if (onAuthFailure) onAuthFailure();
      }
    } else {
      cachedAccessToken = null;
      if (onAuthFailure) onAuthFailure();
    }
  });
};

// Sign in with Google to obtain both Firebase user and Google APIs access token
export const googleSignIn = async (): Promise<{ user: User; accessToken: string } | null> => {
  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error('Failed to obtain Google OAuth access token from authorization provider.');
    }
    cachedAccessToken = credential.accessToken;
    return { user: result.user, accessToken: cachedAccessToken };
  } catch (error: any) {
    console.error('Workspace Google sign-in failed:', error);
    throw error;
  } finally {
    isSigningIn = false;
  }
};

// Retrieve current access token
export const getAccessToken = (): string | null => {
  return cachedAccessToken;
};

// Set token manually (useful when restoring or if cached locally in component state)
export const setCachedToken = (token: string | null) => {
  cachedAccessToken = token;
};

// Sign out cleanly
export const workspaceSignOut = async () => {
  await auth.signOut();
  cachedAccessToken = null;
};

// ==========================================
// 1. GOOGLE CALENDAR API INTEGRATIONS
// ==========================================

export interface CalendarEventPayload {
  summary: string;
  description: string;
  location: string;
  startTime: string; // ISO String
  endTime: string;   // ISO String
}

export const createCalendarEvent = async (event: CalendarEventPayload, token: string) => {
  const url = 'https://www.googleapis.com/calendar/v3/calendars/primary/events';
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      summary: event.summary,
      description: event.description,
      location: event.location,
      start: {
        dateTime: event.startTime,
        timeZone: 'Asia/Dhaka', // Default timezone for rental properties in Bangladesh
      },
      end: {
        dateTime: event.endTime,
        timeZone: 'Asia/Dhaka',
      },
      reminders: {
        useDefault: true,
      },
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Google Calendar Event creation failed: ${errorBody}`);
  }

  return await response.json();
};

export const listCalendarEvents = async (token: string) => {
  const url = 'https://www.googleapis.com/calendar/v3/calendars/primary/events?maxResults=10&orderBy=startTime&singleEvents=true';
  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Google Calendar list failed: ${errorBody}`);
  }

  const data = await response.json();
  return data.items || [];
};

// ==========================================
// 2. GOOGLE CHAT API INTEGRATIONS
// ==========================================

export interface ChatSpaceInfo {
  name: string;
  displayName: string;
  spaceType: string;
}

export const createGoogleChatSpace = async (displayName: string, token: string): Promise<ChatSpaceInfo> => {
  const url = 'https://chat.googleapis.com/v1/spaces';
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      spaceType: 'SPACE',
      displayName: displayName,
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Google Chat Space creation failed: ${errorBody}`);
  }

  return await response.json();
};

// ==========================================
// 3. GOOGLE DRIVE API INTEGRATIONS
// ==========================================

export interface DriveFileInfo {
  id: string;
  name: string;
  mimeType: string;
  webViewLink?: string;
}

export const listDriveFiles = async (token: string): Promise<DriveFileInfo[]> => {
  const url = 'https://www.googleapis.com/drive/v3/files?fields=files(id,name,mimeType,webViewLink)&pageSize=20';
  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Google Drive list files failed: ${errorBody}`);
  }

  const data = await response.json();
  return data.files || [];
};

export const saveToGoogleDrive = async (fileName: string, content: string, token: string): Promise<DriveFileInfo> => {
  const metadata = {
    name: fileName,
    mimeType: 'text/plain',
  };

  const boundary = 'abashon_drive_boundary';
  const delimiter = `\r\n--${boundary}\r\n`;
  const closeDelimiter = `\r\n--${boundary}--`;

  const body =
    delimiter +
    'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
    JSON.stringify(metadata) +
    delimiter +
    'Content-Type: text/plain; charset=UTF-8\r\n\r\n' +
    content +
    closeDelimiter;

  const url = 'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,mimeType,webViewLink';
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': `multipart/related; boundary=${boundary}`,
    },
    body: body,
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Google Drive file upload failed: ${errorBody}`);
  }

  return await response.json();
};
