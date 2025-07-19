import { createClient } from 'redis';
import dotenv from 'dotenv';

dotenv.config();

const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

// Create Redis client
export const redis = createClient({
  url: redisUrl,
  password: process.env.REDIS_PASSWORD || undefined,
});

// Handle Redis connection events
redis.on('error', (err) => {
  console.error('Redis Client Error:', err);
});

redis.on('connect', () => {
  console.log('Connected to Redis');
});

redis.on('ready', () => {
  console.log('Redis client ready');
});

redis.on('end', () => {
  console.log('Redis connection ended');
});

// Connect to Redis
export const connectRedis = async () => {
  try {
    await redis.connect();
    console.log('Redis connected successfully');
  } catch (error) {
    console.error('Failed to connect to Redis:', error);
    throw error;
  }
};

// Graceful shutdown
export const disconnectRedis = async () => {
  try {
    await redis.quit();
    console.log('Redis disconnected gracefully');
  } catch (error) {
    console.error('Error disconnecting Redis:', error);
  }
};

export default redis; 