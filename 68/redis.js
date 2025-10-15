import Redis from 'ioredis';

let _redis = null;
export function getRedis(){
  if (_redis) return _redis;
  const url = process.env.REDIS_URL || 'redis://127.0.0.1:6379/0';
  _redis = new Redis(url, {
    enableAutoPipelining: true,
    maxRetriesPerRequest: null,
    lazyConnect: false
  });
  _redis.on('error', e => console.error('[redis]', e.message));
  return _redis;
}
