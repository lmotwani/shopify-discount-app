import fs from 'fs';
import { join } from 'path';

// Ensure logs directory exists
const logsDir = join(process.cwd(), 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

const errorLogStream = fs.createWriteStream(join(logsDir, 'error.log'), { flags: 'a' });
const accessLogStream = fs.createWriteStream(join(logsDir, 'access.log'), { flags: 'a' });

function logError(error, req = null) {
  const timestamp = new Date().toISOString();
  const logEntry = {
    timestamp,
    error: {
      message: error.message,
      stack: error.stack,
      name: error.name
    },
    request: req ? {
      method: req.method,
      url: req.url,
      headers: req.headers,
      query: req.query,
      body: req.body
    } : null
  };

  errorLogStream.write(`${JSON.stringify(logEntry, null, 2)}\n`);
  console.error('Error:', error);
}

function logAccess(req, res, next) {
  const timestamp = new Date().toISOString();
  const logEntry = {
    timestamp,
    method: req.method,
    url: req.url,
    headers: req.headers,
    query: req.query,
    body: req.body
  };

  accessLogStream.write(`${JSON.stringify(logEntry, null, 2)}\n`);
  next();
}

export { logError, logAccess };
