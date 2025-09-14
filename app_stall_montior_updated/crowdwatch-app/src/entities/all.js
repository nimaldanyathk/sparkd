export const CrowdReading = {
  list: async (order, limit) => [],
  create: async (data) => ({ id: Date.now(), ...data }),
  update: async (id, data) => ({ id, ...data })
};

export const AlertSettings = {
  list: async () => [],
  create: async (data) => ({ id: Date.now(), ...data }),
  delete: async (id) => true
};