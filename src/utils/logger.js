const { config } = require('../config');

const LOG_LEVELS = { ERROR: 0, WARN: 1, INFO: 2, DEBUG: 3 };
const currentLevel = config.server.nodeEnv === 'production' ? LOG_LEVELS.INFO : LOG_LEVELS.DEBUG;

function formatTimestamp() {
  return new Date().toISOString();
}

function log(level, levelName, message, data = null) {
  if (level > currentLevel) return;
  
  const prefix = `[${formatTimestamp()}] [${levelName}]`;
  
  if (data) {
    console.log(prefix, message, JSON.stringify(data, null, 2));
  } else {
    console.log(prefix, message);
  }
}

module.exports = {
  error: (message, data) => log(LOG_LEVELS.ERROR, 'ERROR', message, data),
  warn: (message, data) => log(LOG_LEVELS.WARN, 'WARN', message, data),
  info: (message, data) => log(LOG_LEVELS.INFO, 'INFO', message, data),
  debug: (message, data) => log(LOG_LEVELS.DEBUG, 'DEBUG', message, data),
};
