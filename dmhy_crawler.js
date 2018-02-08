const puppeteer = require('puppeteer');
const moment = require('moment');
const {
  timeout,
  isAheadDays,
  error,
  info,
  warning
} = require('./tools/tools.js');
const R = require('ramda');
const _ = require('lodash/fp');
const fs = require('fs-extra');

puppeteer.launch().then(async browser => {
  const startTime = moment();
  let page = await browser.newPage();
  await page.goto('https://share.dmhy.org/');
  await page.waitForSelector('#topic_list');
  info(`打开https://share.dmhy.org/ 耗时 ${moment().diff(moment(startTime), 'seconds', true)} 秒`);

  const comics = await page.evaluate(() => {
    return document.querySelectorAll('#topic_list td');
  });
  console.log(comics);
  // const trs = await page.$$('.weekly_list tr');
  // const a = await page.$eval(".weekly_list tr", tr => tr);
  // console.log('a.getProperties', a);
  await browser.close();
});