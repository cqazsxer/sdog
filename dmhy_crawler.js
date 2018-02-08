const puppeteer = require('puppeteer');
const moment = require('moment');
const _ = require('lodash');
const {
  timeout,
  isAheadDays,
  error,
  info,
  warning
} = require('./tools/tools.js');
const R = require('ramda');
const fs = require('fs-extra');

puppeteer.launch({ headless: false }).then(async browser => {
  const startTime = moment();
  let page = await browser.newPage();
  await page.goto('https://share.dmhy.org/', { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('.jmd');
  // await timeout(10000);
  info(`打开https://share.dmhy.org/ 耗时 ${moment().diff(moment(startTime), 'seconds', true)} 秒`);
  page.on('console', msg => {
    warning('msg' + msg);
  });
  const comics = await page.evaluate(() => {
    return [...document.querySelectorAll('.jmd td a')].map(a => ({
      href: a.href,
      name: a.text
    }));
  });
  console.log(comics);
});