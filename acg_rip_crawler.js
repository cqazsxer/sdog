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
  // 获取番组+链接
  const startTime = moment();
  let page = await browser.newPage();
  await page.goto('https://acg.rip/', { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('.tab-content.well');
  info(`打开https://acg.rip/ 耗时 ${moment().diff(moment(startTime), 'seconds', true)} 秒`);
  const comics = await page.evaluate(() => {
    return [...document.querySelectorAll('.tab-content.well .tab-pane')].slice(0, 8).map(
      ($tab_pane, index) => {
        return [...$tab_pane.querySelectorAll('a')].map(
            $a => ({
            url: $a.href,
            name: $a.innerHTML
          })
        )
      }
    );
  });
  info(`抓dom 耗时 ${moment().diff(moment(startTime), 'seconds', true)} 秒`);

  for(let i = 0; i < comics.length; i++) {
    
  }
  await page.close();
  await browser.close();
});