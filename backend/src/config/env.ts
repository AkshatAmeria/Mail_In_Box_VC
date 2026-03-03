import dotenv from "dotenv";
dotenv.config();

const redisUrl = process.env.REDIS_URL;
console.log("Loaded Redis URL from environment variable:", redisUrl);

export const config = {
  port: Number(process.env.PORT || 4000),
  redisUrl,
  workerConcurrency: Number(process.env.WORKER_CONCURRENCY || 5),
  minDelayMs: Number(process.env.MIN_DELAY_MS || 2000),
  maxEmailsPerHourPerSender: Number(
    process.env.MAX_EMAILS_PER_HOUR_PER_SENDER || 200
  ),
};

 console.log("Redis URL:", process.env.REDIS_URL);