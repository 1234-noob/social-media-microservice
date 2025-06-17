const invalidatePostCache = async (req, input) => {
  const cachedKeys = `post:${input}`;
  await req.redisClient.del(cachedKeys);

  const keys = await req.redisClient.keys("posts:*");

  if (keys.length > 0) {
    await req.redisClient.del(keys);
  }
};

module.exports = invalidatePostCache;
