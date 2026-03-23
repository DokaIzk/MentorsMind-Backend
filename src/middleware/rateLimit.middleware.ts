import rateLimit from 'express-rate-limit';
import config from '../config';

const { windowMs, maxRequests } = config.rateLimit;

export const generalLimiter = rateLimit({
  windowMs,
  max: maxRequests,
  message: {
    status: 'error',
    message: 'Too many requests from this IP, please try again later.',
    timestamp: new Date().toISOString(),
  },
  standardHeaders: true,
  legacyHeaders: false,
});

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 requests per window
  message: {
    status: 'error',
    message: 'Too many authentication attempts, please try again later.',
    timestamp: new Date().toISOString(),
  },
  skipSuccessfulRequests: true,
});

export const apiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 60, // 60 requests per minute
  message: {
    status: 'error',
    message: 'API rate limit exceeded, please slow down.',
    timestamp: new Date().toISOString(),
  },
});
