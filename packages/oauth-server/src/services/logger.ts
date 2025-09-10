import pino from 'pino';

const isDevelopment = process.env.NODE_ENV === 'development';

export const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  ...(isDevelopment && {
    transport: {
      target: 'pino-pretty',
      options: {
        colorize: true,
        translateTime: 'SYS:standard',
        ignore: 'pid,hostname',
      },
    },
  }),
  redact: {
    paths: [
      'req.headers.authorization',
      'req.headers.cookie',
      'res.headers["set-cookie"]',
      'access_token',
      'refresh_token',
      'code_verifier',
      'code_challenge',
      'client_secret',
      'password',
    ],
    censor: '[REDACTED]',
  },
});

export interface LogContext {
  requestId?: string;
  userId?: string;
  clientId?: string;
  grantId?: string;
  sessionId?: string;
  interactionId?: string;
  [key: string]: any;
}

export function createChildLogger(context: LogContext) {
  return logger.child(context);
}