import rateLimit from "express-rate-limit";

/**
 * General API rate limiter to protect against DDoS and brute-force attacks.
 * Recommended by Express.js Production Best Practices: Security.
 */
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 300, // Limit each IP to 300 requests per 15 minutes
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: {
    message: "Too many requests from this IP, please try again after 15 minutes.",
  },
  skip: (req) => {
    // Skip health check and Clerk webhooks so service operations are never blocked
    return req.path === "/health" || req.originalUrl?.includes("/webhooks");
  },
});

/**
 * Message send rate limiter to protect against spamming and media upload abuse.
 */
export const messageSendLimiter = rateLimit({
  windowMs: 1 * 1000 * 60, // 1 minute
  limit: 60, // Max 60 messages per minute per IP
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: {
    message: "You are sending messages too fast. Please slow down.",
  },
});
