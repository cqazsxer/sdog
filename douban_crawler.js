const puppeteer = require('puppeteer');
const R = require('ramda');
const fs = require('fs-extra');
const axios  = require('axios');
axios.defaults.baseURL = 'https://movie.douban.com/j/';
puppeteer.launch({ headless: true }).then(async browser => {
  let page = await browser.newPage();

  // 爬分类信息
  // await page.goto('https://movie.douban.com/tag/#/', {
  //   waitUntil: 'domcontentloaded'
  // });
  // await page.addScriptTag({
  //   url: 'https://cdn.bootcss.com/ramda/0.25.0/ramda.min.js'
  // });
  // const categories = await page.evaluate(() => {
  //   var cssQueryAll = R.invoker(1, 'querySelectorAll');
  //   var cssQuery = R.invoker(1, 'querySelector');
  //   return R.map($ui => {
  //     const $lis = cssQueryAll('li', $ui);
  //     const getSpanInnerHTML = R.compose(R.prop('innerHTML'), cssQuery('span'));
  //     const categoryType = R.compose(getSpanInnerHTML, R.head)($lis);
  //     const tags = R.compose(
  //       R.filter(R.compose(R.equals(-1), R.indexOf('自定义标签'))),
  //       R.into([], R.map(getSpanInnerHTML)),
  //       R.tail
  //     )($lis);
  //     return {
  //       categoryType,
  //       tags
  //     };
  //   })(cssQueryAll('.tags .category', document));
  // });
  // await fs.mkdirs('data/douban');
  // await fs.writeFile(
  //   `./data/douban/categories.json`,
  //   JSON.stringify(categories)
  // );
  // await page.close();
  
  // 爬特定页面试试
  const MAX = 10; // 爬的总页数
  const promises = R.times(R.compose( R.map(),R.multiply(10)),MAX);
  // const getUrlByStart = R.concat('new_search_subjects?sort=T&range=0,10&tags=%E6%97%A5%E6%9C%AC,%E5%8A%A8%E7%94%BB&start=');
  // axios.get(getUrlByStart(10))
  //   .then(res => {
  //     console.log(res.data.data.length);
  //   })


});
