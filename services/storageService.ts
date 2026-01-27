// Update storageService.ts
type StorageService = {
  timeoutFetch: (url: string, options: RequestInit) => Promise<Response>;
  saveToLocal: <T>(key: string, value: T) => void;
  getFromLocal: <T>(key: string) => T | null;
  fetchData: () => Promise<any>;
};

const storageService: StorageService = {
  timeoutFetch: async (url, options) => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // Set timeout for 5 seconds

    try {
      const response = await fetch(url, {...options, signal: controller.signal});
      if (!response.ok) {
        throw new Error(`Error fetching data: ${response.statusText}`);
      }
      return response;
    } catch (error) {
      console.error('Fetch error:', error);
      throw error;
    } finally {
      clearTimeout(timeoutId);
    }
  },
  saveToLocal: (key, value) => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error('Error saving to localStorage:', error);
    }
  },
  getFromLocal: (key) => {
    try {
      const value = localStorage.getItem(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      console.error('Error reading from localStorage:', error);
      return null;
    }
  },
  fetchData: async () => {
    const url = import.meta.env.VITE_GOOGLE_SCRIPT_URL;
    try {
      const response = await storageService.timeoutFetch(url, { method: 'GET' });
      return await response.json();
    } catch (error) {
      console.error('Error fetching data:', error);
      throw error;
    }
  },
};

export default storageService;