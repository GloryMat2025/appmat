const fs = require('fs');
const path = require('path');

const logPath = path.resolve(__dirname, 'relay.log');

function append(level, msg) {
  try {
    const line = `${new Date().toISOString()} [${level}] ${msg}\n`;
    fs.appendFileSync(logPath, line);
  } catch (e) {
    /* best-effort */
  }
}

module.exports = {
  info: (msg) => append('INFO', typeof msg === 'string' ? msg : JSON.stringify(msg)),
  warn: (msg) => append('WARN', typeof msg === 'string' ? msg : JSON.stringify(msg)),
  error: (msg) => append('ERROR', typeof msg === 'string' ? msg : JSON.stringify(msg)),
};
