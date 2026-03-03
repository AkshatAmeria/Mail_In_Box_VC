import { Redis } from "ioredis";
import { config } from "../config/env.js";

export const redis = new Redis("redis://127.0.0.1:6380");


redis.on("connect", () => {
  console.log("Redis connected");
});

redis.on("error", (err) => {
  console.error("Redis error:", err);
});