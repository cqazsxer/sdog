const puppeteer = require('puppeteer');
const moment = require('moment');
const { timeout, isAheadDays } = require('./tools/tools.js');
const R = require('ramda');
const fs = require('fs-extra');
puppeteer.launch().then(async browser => {
  // 检测上次抓取的api列表的时间 大于7天的话 就重新抓取
  let links = await fs
    .readFile('./data/es6-pdf/links.json')
    .catch(() => console.error('api列表json不存在！, 正在抓取api列表...'));
  if (links) {
    const { ctime } = await fs.statSync('./data/es6-pdf/links.json');
    if (isAheadDays(ctime, 0)) {
      console.log('超过7天未拉取api列表，正在重新拉取...');
      links = undefined;
    }
  }

  if (!links) {
    let page = await browser.newPage();
    await page.goto('http://es6.ruanyifeng.com/#README');
    await page.waitForSelector('#sidebar ol li a');
    links = await page.evaluate(() => {
      return [...document.querySelectorAll('#sidebar ol li a')].map(a => ({
        href: a.href.trim(),
        name: a.text
      }));
    });
    console.log(`api列表抓取成功, 长度：${links.length}`);
    await fs.mkdirs('data/es6-pdf');
    // await page.pdf({path: `./data/es6-pdf/${links[0].name}.pdf`});
    await fs.writeFile('./data/es6-pdf/links.json', JSON.stringify(links));
    await page.close();
  } else {
    links = JSON.parse(links);
    console.log(`api列表长度：${links.length}`);
  }
  // console.log(links.length);
  // links = R.slice(23, Infinity)(links)

  // 打开n个页面
  const pages = await Promise.all(R.map(() => browser.newPage())(links));

  // 跳转n个链接
  const gotoPages = await Promise.all(
    R.map(p => p[0].goto(p[1].href, { timeout: 0 }))(R.zip(pages, links))
  );

  // 在每个页面搞一些事情
  await fs.remove('./data/es6-pdf/pdf');
  await timeout(1000);
  await fs.mkdirs('./data/es6-pdf/pdf');
  console.log('开始打印pdf...');
  await Promise.all(
    R.map(p => p[0].pdf({ path: `./data/es6-pdf/pdf/${p[2]}.${p[1].name}.pdf` }))(
      R.zip(pages, links, R.range(0, R.length(links)))
    )
  );
  console.log('pdf 下载成功');

  await browser.close();
});
