const { createLogger, format, transports } = require('winston');
const DailyRotateFile = require('winston-daily-rotate-file');

const { Console } = transports;
const { combine, timestamp, json } = format;

const logger = createLogger({
  format: combine(
    timestamp(),
    json(),
  ),
  transports: [
    new Console(),
    new DailyRotateFile({
      filename: `../logs/info.%DATE%.log`, level: 'info', datePattern: 'YYYY-MM-DD', label: 'base_logger',
    }),
    new DailyRotateFile({
      filename: `../logs/error.%DATE%.log`, level: 'error', datePattern: 'YYYY-MM-DD', label: 'base_logger',
    }),
  ],
});

module.exports = logger;
