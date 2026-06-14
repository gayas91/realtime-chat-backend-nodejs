const { redisClient } = require('../config/redis');

const PRESENCE_TTL_SECONDS = 60 * 60;

const getPresenceKey = (userId) => `presence:user:${userId}`;
const getUserSocketsKey = (userId) => `user:sockets:${userId}`;

const markUserOnline = async (userId, socketId) => {
  const socketsKey = getUserSocketsKey(userId);

  await redisClient.sAdd(socketsKey, socketId);
  const socketCount = await redisClient.sCard(socketsKey);
  await redisClient.set(getPresenceKey(userId), 'online', {
    EX: PRESENCE_TTL_SECONDS,
  });

  return socketCount === 1;
};

const markUserOffline = async (userId, socketId) => {
  const socketsKey = getUserSocketsKey(userId);

  await redisClient.sRem(socketsKey, socketId);
  const socketCount = await redisClient.sCard(socketsKey);

  if (socketCount > 0) {
    return false;
  }

  await redisClient.del(socketsKey);
  await redisClient.del(getPresenceKey(userId));

  return true;
};

const getPresence = async (userIds) => {
  const keys = userIds.map((userId) => getPresenceKey(userId));
  const statuses = keys.length ? await redisClient.mGet(keys) : [];

  return userIds.reduce((presence, userId, index) => {
    presence[userId] = statuses[index] === 'online' ? 'online' : 'offline';
    return presence;
  }, {});
};

module.exports = {
  markUserOnline,
  markUserOffline,
  getPresence,
};
