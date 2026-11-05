export const config = {
  port: parseInt(process.env.PORT || '3000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',

  whatsapp: {
    phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID || '',
    accessToken: process.env.WHATSAPP_ACCESS_TOKEN || '',
    appSecret: process.env.WHATSAPP_APP_SECRET || '',
    verifyToken: process.env.WHATSAPP_VERIFY_TOKEN || '',
    apiVersion: 'v21.0',
  },

  database: {
    url: process.env.DATABASE_URL || '',
  },

  redis: {
    url: process.env.REDIS_URL || 'redis://localhost:6379',
  },

  llm: {
    apiKey: process.env.OPENAI_API_KEY || '',
    evalModel: process.env.LLM_EVAL_MODEL || 'gpt-4o',
    evalTemperature: parseFloat(process.env.LLM_EVAL_TEMPERATURE || '0.1'),
    digestTemperature: parseFloat(process.env.LLM_DIGEST_TEMPERATURE || '0.6'),
  },

  scheduler: {
    defaultTimeoutSeconds: parseInt(
      process.env.SCHEDULER_DEFAULT_TIMEOUT_SECONDS || '7200',
      10
    ),
    maxRetries: parseInt(process.env.SCHEDULER_MAX_RETRIES || '3', 10),
    backoffBaseSeconds: parseInt(
      process.env.SCHEDULER_BACKOFF_BASE_SECONDS || '300',
      10
    ),
  },

  auth: {
    jwtSecret: process.env.JWT_SECRET || '',
    jwtExpiry: process.env.JWT_EXPIRY || '24h',
    systemSecret: process.env.SYSTEM_SECRET || '',
  },
} as const;
