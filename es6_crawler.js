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
  // 检测上次抓取的api列表的时间 大于7天的话 就重新抓取
  const startTime = moment();
  let links = await fs
    .readFile('./data/es6-pdf/links.json')
    .catch(() =>
      console.log(warning('api列表json不存在！, 正在抓取api列表...'))
    );
  //
  if (links) {
    const { ctime } = await fs.statSync('./data/es6-pdf/links.json');
    if (isAheadDays(ctime, 0)) {
      info('超过7天未拉取api列表，正在重新拉取...');
      links = undefined;
    } else {
      links = JSON.parse(links);
      info(`从文件获取的api列表长度：${links.length}...`);
    }
  }

  if (!links) {
    let page = await browser.newPage();
    await page.goto('http://es6.ruanyifeng.com/#README');
    await page.waitForSelector('#sidebar ol li a');
    links = await page.evaluate(() => {
      // return [...document.querySelectorAll('#sidebar ol li a')].map(
      //   (a, index) => ({
      //     href: a.href.trim(),
      //     name: `${index}.${a.text}`
      //   })
      // );
      return [...document.querySelectorAll('#sidebar ol li a')].map(
        a => a
      );
    }); 
    console.log(links);
    info(`api列表抓取成功, 长度：${links.length}...`);
    // await fs.mkdirs('data/es6-pdf');
    // await fs.writeFile('./data/es6-pdf/links.json', JSON.stringify(links));
    // await page.close();
  }

  // await fs.remove('./data/es6-pdf/pdf');
  // await fs.mkdirs('./data/es6-pdf/pdf');

  // links = R.slice(0, Infinity)(links);

  // const perChuck = 12;
  // const chuckedLinks = R.splitEvery(perChuck)(links);

  // info(`总共分成${chuckedLinks.length}个chuck, 每个chuck有${perChuck}个记录。共${links.length}个记录。`);

  // // 打开n个页面
  // await new Promise(async resolve => {
  //   for (let i = 0; i < chuckedLinks.length; i++) {
  //     const chuckedLink = chuckedLinks[i];
  //     info(`chunk:${i}开始处理...`);
      
  //     const pages = await Promise.all(
  //       R.map(() => browser.newPage())(chuckedLink)
  //     );
  //     // 跳转n个链接
  //     await Promise.all(
  //       R.map(p => p[0].goto(p[1].href))(
  //         R.zip(pages, chuckedLink)
  //       )
  //     );
      
  //     await Promise.all(
  //       R.map(p =>
  //         p[0].pdf({ path: `./data/es6-pdf/pdf/${p[1].name}.pdf` })
  //       )(R.zip(pages, chuckedLink))
  //     );

  //     R.forEach(l => info(`${l.name}.pdf 保存成功`))(chuckedLink)
  //     if (i === chuckedLinks.length - 1) {
  //       resolve();
  //     }
  //   }
  // });
  info(`处理结束，总耗时: ${moment().diff(moment(startTime), 'seconds', true)} 秒`);
  await browser.close();
});
