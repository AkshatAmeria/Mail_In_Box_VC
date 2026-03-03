import { redis } from "../../config/redis.js";
import { config } from "../../config/env.js";

const lua = `
local key = KEYS[1]
local limit = tonumber(ARGV[1])
local ttl = tonumber(ARGV[2])

local current = redis.call("INCR", key)

if current == 1 then
  redis.call("EXPIRE", key, ttl)
end

if current > limit then
  return 0
end

return 1
`;

export async function allowSend(senderId: string) {
  const now = new Date();
  const hourKey = now.toISOString().slice(0, 13).replace(/[-T:]/g, "");
  const key = `rate:${senderId}:${hourKey}`;

  const remainingSeconds =
    3600 - (now.getMinutes() * 60 + now.getSeconds());

  const result = await redis.eval(
    lua,
    1,
    key,
    config.maxEmailsPerHourPerSender,
    remainingSeconds
  );

  return result === 1;
}

export function msUntilNextHour() {
  const now = new Date();
  return (
    3600 * 1000 -
    (now.getMinutes() * 60 + now.getSeconds()) * 1000 -
    now.getMilliseconds()
  );
}