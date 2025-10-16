import baseConfig from './eslint.config.js';

const credentialEnforcedConfig = baseConfig.map((item) => {
  if (!item || typeof item !== 'object') {
    return item;
  }

  const updated = { ...item };

  if (item.rules) {
    updated.rules = {
      ...item.rules,
      'local/no-credential-leak': 'error',
    };
  }

  return updated;
});

export default credentialEnforcedConfig;
