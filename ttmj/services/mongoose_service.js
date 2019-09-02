const mongoose = require('mongoose');
const logger = require('../../utils/logger');

mongoose.Promise = Promise;
mongoose.set('useCreateIndex', true);
mongoose.set('useFindAndModify', false);

const uri = 'mongodb://localhost:27017/data';
mongoose.connect(uri, { useNewUrlParser: true });
const db = mongoose.connection;

db.on('open', () => {
  logger.info('ttmj db connected');
});

db.on('error', (e) => {
  logger.error(e);
});

module.exports = db;
