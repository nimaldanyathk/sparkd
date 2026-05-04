export const CrowdReading = {
  list: async (order, limit) => [],
  create: async (data) => ({ id: Date.now(), ...data }),
  update: async (id, data) => ({ id, ...data })
};

const SETTINGS_KEY = 'crowd_app_settings';

export const AlertSettings = {
  list: async () => {
    try {
      const data = localStorage.getItem(SETTINGS_KEY);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      console.error("Failed to load settings", e);
      return [];
    }
  },
  create: async (data) => {
    try {
      const current = JSON.parse(localStorage.getItem(SETTINGS_KEY) || '[]');
      const newItem = { id: Date.now(), ...data };
      current.push(newItem);
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(current));
      return newItem;
    } catch (e) {
      console.error("Failed to save setting", e);
      throw e;
    }
  },
  delete: async (id) => {
    try {
      const current = JSON.parse(localStorage.getItem(SETTINGS_KEY) || '[]');
      const filtered = current.filter(item => item.id !== id);
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(filtered));
      return true;
    } catch (e) {
      console.error("Failed to delete setting", e);
      return false;
    }
  }
};