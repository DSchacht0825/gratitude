// Mock authentication for static deployment
interface MockUser {
  id: string;
  email: string;
  name?: string;
}

interface MockJournalEntry {
  id: string;
  date: string;
  morningGratitude1?: string;
  morningGratitude2?: string;
  morningGratitude3?: string;
  morningIntention?: string;
  morningPrayer?: string;
  eveningReflection1?: string;
  eveningReflection2?: string;
  eveningReflection3?: string;
  eveningLearning?: string;
  eveningGratitude?: string;
}

const STORAGE_KEYS = {
  USER: 'daily_pause_user',
  ENTRIES: 'daily_pause_entries'
};

export const mockAuth = {
  login: async (email: string, password: string): Promise<MockUser> => {
    // Simple mock validation
    if (email && password.length >= 6) {
      const user = { id: '1', email, name: email.split('@')[0] };
      localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
      return user;
    }
    throw new Error('Invalid credentials');
  },

  register: async (email: string, password: string, name?: string): Promise<MockUser> => {
    if (email && password.length >= 6) {
      const user = { id: '1', email, name: name || email.split('@')[0] };
      localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
      return user;
    }
    throw new Error('Registration failed');
  },

  getCurrentUser: (): MockUser | null => {
    const userStr = localStorage.getItem(STORAGE_KEYS.USER);
    return userStr ? JSON.parse(userStr) : null;
  },

  logout: (): void => {
    localStorage.removeItem(STORAGE_KEYS.USER);
  }
};

export const mockJournal = {
  saveEntry: async (entry: Omit<MockJournalEntry, 'id' | 'date'>): Promise<void> => {
    const today = new Date().toISOString().split('T')[0];
    const entries = JSON.parse(localStorage.getItem(STORAGE_KEYS.ENTRIES) || '{}');
    entries[today] = { id: today, date: today, ...entry };
    localStorage.setItem(STORAGE_KEYS.ENTRIES, JSON.stringify(entries));
  },

  getEntry: async (date?: string): Promise<MockJournalEntry | null> => {
    const targetDate = date || new Date().toISOString().split('T')[0];
    const entries = JSON.parse(localStorage.getItem(STORAGE_KEYS.ENTRIES) || '{}');
    return entries[targetDate] || null;
  }
};