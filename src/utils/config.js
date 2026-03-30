import Conf from 'conf';

const config = new Conf({ projectName: 'mycli' });

export default {
  get: (key, def) => config.get(key, def),
  set: (key, value) => config.set(key, value),
  has: (key) => config.has(key),
  delete: (key) => config.delete(key),
  store: config.store,
};
