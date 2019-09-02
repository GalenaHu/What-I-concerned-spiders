const redis = require('../services/redis_service');

const DRAMA_ID_SET_REDIS_KEY = 'drama_id_set_redis_key';
const DRAMA_GOT_ID_SET = 'drama_got_id_set';
async function generateDramaId(min, max) {
  // eslint-disable-next-line no-plusplus
  for (let i = min; i < max; i++) {
    // eslint-disable-next-line no-await-in-loop
    await redis.sadd(DRAMA_ID_SET_REDIS_KEY, i);
  }
}

async function getRandomDramaId(count) {
  const ids = await redis.spop(DRAMA_ID_SET_REDIS_KEY, count);
  return ids;
}

async function markDramaIdSucceed(id) {
  await redis.sadd(DRAMA_GOT_ID_SET, id);
}

async function idBackInPool(id) {
  await redis.sadd(DRAMA_ID_SET_REDIS_KEY, id);
}

async function getRemainingIDCount() {
  return await redis.scard(DRAMA_ID_SET_REDIS_KEY)
    .then(r => Number(r));
}

module.exports = {
  generateDramaId,
  getRandomDramaId,
  markDramaIdSucceed,
  idBackInPool,
  getRemainingIDCount,
};
