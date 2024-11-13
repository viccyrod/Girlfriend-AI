type LogLevel = 'info' | 'warn' | 'error';

interface LogData {
  message: string;
  error?: Error;
  userId?: string;
  chatRoomId?: string;
  [key: string]: string | number | boolean | Error | undefined;
}

export const logger = {
  info: (data: LogData) => logMessage('info', data),
  warn: (data: LogData) => logMessage('warn', data),
  error: (data: LogData) => logMessage('error', data),
};

function logMessage(level: LogLevel, data: LogData) {
  const timestamp = new Date().toISOString();
  const logData = {
    timestamp,
    level,
    ...data,
    environment: process.env.NODE_ENV,
  };

  // In development, log to console
  if (process.env.NODE_ENV === 'development') {
    console[level](JSON.stringify(logData, null, 2));
    return;
  }

  // In production, you could send to your logging service
  // This will be picked up by Vercel's logging system
  console[level](JSON.stringify(logData));
} 