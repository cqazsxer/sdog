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
    return log(chalk.keyword('orange')('[Warning]: ' + str));
  }
  static end(str) {
    return log(chalk`
      ${chalk.red(
        '--------------------------------------------------------------------------'
      )}

      ${chalk.blue(str)}

      ${chalk.red(
        '--------------------------------------------------------------------------'
      )}`);
  }
  /**
   * 串行 请求
   *
   * @static
   * @param {any} cb
   * @param {any} arr
   * @memberof Tools
   */
  static queue(cb, arr) {
    return new Promise(async resolve => {
      for (let i = 0; i < arr.length; i++) {
        await cb(i);
        if (i === arr.length - 1) {
          resolve();
        }
      }
    });
  }
}

module.exports = Tools;
