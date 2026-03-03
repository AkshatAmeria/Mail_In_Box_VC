import { Queue } from "bullmq";
import { redis } from "../../config/redis.js";
import { config } from "../../config/env.js";

export const emailQueue = new Queue("emailQueue", {
  connection: {
    url: "redis://127.0.0.1:6380",
  }
});

console.log("BullMQ connecting to Redis:", config.redisUrl);