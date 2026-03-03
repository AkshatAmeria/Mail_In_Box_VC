import { Queue } from "bullmq";
import { redis } from "../../config/redis.js";
import { config } from "../../config/env.js";

export const emailQueue = new Queue("emailQueue", {
  //@ts-expect-error
  connection: {
    url: config.redisUrl,
  }
});

console.log("BullMQ connecting to Redis:", config.redisUrl);
