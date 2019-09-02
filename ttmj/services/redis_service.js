const Redis = require('ioredis');

const client = new Redis({
  port: 6379,
  host: '127.0.0.1',
  password: 'T3rz9nIklhxSvlntbABnpXzrEZBsTQ5TvIzqUYf7A5ExNK1YRxA5p1tYLhhkY4G6BC/32D4IGLu6lKkh',
});

module.exports = client;
