const moment = require('moment');
const chalk = require('chalk');
const log = console.log;
class Tools {
  static timeout(delay) {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        try {
          resolve(1);
        } catch (e) {
          reject(0);
        }
      }, delay);
    });
  }
  static isAheadDays(m, long) {
    return moment().diff(moment(m), 'days', true) > long;
  }
  static error(str) {
    return log(chalk.green('[Error]: ' + str));
  }
  static info(str) {
    return log(chalk.green('[Info]: ' + str));
  }
  static warning(str) {
    return log(chalk.green('[Warning]: ' + str));
  }
}

module.exports = Tools;
