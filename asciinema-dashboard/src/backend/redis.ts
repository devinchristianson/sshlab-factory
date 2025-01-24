import { createClient } from 'redis';
import { ENV } from './env.config.js';
const client = await createClient({
    url: `redis://:${ENV.REDIS_PASS}@localhost:6379`
  })
  .on('error', err => console.log('Redis Client Error', err))
  .connect();
export class UserManager {
  key: string;
  constructor(key: string) {
    this.key = key
  }
  async addUser(group: string, username: string) {
    return await client.sAdd(`${this.key}:${group}`, username)
  }
  async deleteUser(group: string, username: string) {
    return await client.sRem(`${this.key}:${group}`, username)
  }
  async listUsers(group: string) {
    return await client.sMembers(`${this.key}:${group}`)
  }
}

const USERS_KEY = 'users'
const PENDING_USERS_KEY = 'pendingusers' 
export const acceptedUserManager = new UserManager(USERS_KEY)
export const pendingUserManager = new UserManager(PENDING_USERS_KEY)