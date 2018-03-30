const puppeteer = require('puppeteer');
const R = require('ramda');
const fs = require('fs-extra');
const axios = require('axios');
const moment = require('moment');
const {
  timeout,
  isAheadDays,
  error,
  info,
  warning,
  end,
  queue,
  isFileAheadDays
} = require('./tools/tools.js');
axios.defaults.baseURL = 'https://movie.douban.com/j/';

/**
 * 爬分类信息
 *
 * @param {any} browser
 * @returns
 */
const getCategories = async browser => {
  const path = './data/douban/categories.json';

  if (!await isFileAheadDays(path, 0.0008)) return;

  const startTime = moment();

  let page = await browser.newPage();
  await page.goto('https://movie.douban.com/tag/#/', {
    waitUntil: 'domcontentloaded'
  });
  await page.addScriptTag({
    url: 'https://cdn.bootcss.com/ramda/0.25.0/ramda.min.js'
  });
  const categories = await page.evaluate(() => {
    var cssQueryAll = R.invoker(1, 'querySelectorAll');
    var cssQuery = R.invoker(1, 'querySelector');
    return R.map($ui => {
      const $lis = cssQueryAll('li', $ui);
      const getSpanInnerHTML = R.compose(R.prop('innerHTML'), cssQuery('span'));
      const categoryType = R.compose(getSpanInnerHTML, R.head)($lis);
      const tags = R.compose(
        R.filter(R.compose(R.equals(-1), R.indexOf('自定义标签'))),
        R.into([], R.map(getSpanInnerHTML)),
        R.tail
      )($lis);
      return {
        categoryType,
        tags
      };
    })(cssQueryAll('.tags .category', document));
  });
  await fs.writeFile(path, JSON.stringify(categories));

  await page.close();

  info(
    `${path} 抓取结束，总耗时: ${moment().diff(
      moment(startTime),
      'seconds',
      true
    )} 秒`
  );
};
/**
 * 获取某页数据promise
 *
 * @param {any} startPage 第n页
 */
const getPromise = (tags, startPage) =>
  R.compose(
    axios.get,
    encodeURI,
    R.concat(
      `new_search_subjects?sort=T&range=0,10&tags=${tags.join(',')}&start=`
    ),
    R.toString,
    R.multiply(20),
    R.add(startPage)
  );
/**
 * 获取某页的数量
 *
 * @param {any} tags
 * @param {any} count
 * @returns
 */
const getSpecificCategoryMoiveSinglePageItemsQuantity = async (
  tags,
  startPage
) => {
  const localPageItemsLength = (await getPromise(tags, startPage)(0)).data.data
    .length;
  // info(`第${startPage}页有${localPageItemsLength}条数据`);
  return localPageItemsLength;
};

/**
 * 二分递归算总页数
 *
 * @param {any} tags
 */
const getSpecificCategoryMoivePageQuantity = async (
  tags,
  targetPage,
  lasPage1,
  lasPage2
) => {
  const pageitemcount = await getSpecificCategoryMoiveSinglePageItemsQuantity(
    tags,
    targetPage
  );
  const pageitemcount1 = await getSpecificCategoryMoiveSinglePageItemsQuantity(
    tags,
    lasPage1
  );
  const pageitemcount2 = await getSpecificCategoryMoiveSinglePageItemsQuantity(
    tags,
    lasPage2
  );
  console.log(
    '当前页面',
    targetPage,
    lasPage1,
    lasPage2,
    pageitemcount,
    pageitemcount1,
    pageitemcount2
  );

  if (pageitemcount < 20 && pageitemcount > 0) {
    // 当前是最后有数据!
    return targetPage;
  } else {
    if (pageitemcount === 0 && pageitemcount1 === 20 && pageitemcount2 === 20) {
      return await getSpecificCategoryMoivePageQuantity(
        tags,
        parseInt((targetPage - lasPage2) / 2),
        targetPage,
        lasPage1
      );
    }
    if (pageitemcount === 0 && pageitemcount1 === 0 && pageitemcount2 === 20) {
      return await getSpecificCategoryMoivePageQuantity(
        tags,
        parseInt((targetPage - lasPage2) / 2),
        targetPage,
        lasPage2
      );
    }
    // zzz
    if (pageitemcount === 0 && pageitemcount1 === 0 && pageitemcount2 === 0) {
      return await getSpecificCategoryMoivePageQuantity(
        tags,
        parseInt((targetPage - lasPage2) / 2),
        targetPage,
        lasPage1
      );
    }
    if (pageitemcount === 20 && pageitemcount1 === 0 && pageitemcount2 === 0) {
      return await getSpecificCategoryMoivePageQuantity(
        tags,
        parseInt((targetPage + lasPage1) / 2),
        targetPage,
        lasPage2
      );
    }
    if (pageitemcount === 0 && pageitemcount1 === 20 && pageitemcount2 === 0) {
      return await getSpecificCategoryMoivePageQuantity(
        tags,
        parseInt((targetPage + lasPage1) / 2),
        targetPage,
        lasPage1
      );
    }
    if (pageitemcount === 20 && pageitemcount1 === 20 && pageitemcount2 === 0) {
      return await getSpecificCategoryMoivePageQuantity(
        tags,
        parseInt((targetPage + lasPage2) / 2),
        targetPage,
        lasPage2
      );
    }
    if (pageitemcount === 0 && pageitemcount1 === 20 && pageitemcount2 === 0) {
      return await getSpecificCategoryMoivePageQuantity(
        tags,
        parseInt((targetPage + lasPage1) / 2),
        targetPage,
        lasPage1
      );
    }
    if (pageitemcount === 20 && pageitemcount1 === 0 && pageitemcount2 === 20) {
      return await getSpecificCategoryMoivePageQuantity(
        tags,
        parseInt((targetPage + lasPage1) / 2),
        targetPage,
        lasPage1
      );
    }
    // if (pageitemcount ===20 && pageitemcount1 === 20 && pageitemcount2 === 0) {
    //   return await getSpecificCategoryMoivePageQuantity(
    //     tags,
    //     parseInt((targetPage + lasPage1) / 2),
    //     targetPage,
    //     pageitemcount1
    //   );
    // }
    // if (targetPage < lastTargetPage) {

    // }
    // const newTargetPage = (targetPage + lastTargetPage) % 2 === 1 ? (targetPage + lastTargetPage + 1) / 2 :(targetPage + lastTargetPage) / 2;
  }
};

/**
 * 从特定标签取数据
 *
 * api限制每次从startPage取20条
 *
 * @param {Array} tags 标签数组
 * @param {Number} startPage 开始页面
 * @param {Number} pageCount 要取的总页数
 */
const getSpecificCategoryMoive = async (tags, startPage, pageCount) => {
  const startTime = moment();
  const path = `./data/douban/results_${tags.join(',')}.json`;

  const results = R.compose(R.chain(R.identity), R.map(res => res.data.data))(
    await Promise.all(R.times(getPromise(tags, startPage), pageCount))
  );
  await fs.writeFile(path, JSON.stringify(results));

  info(
    `${path} 抓取结束，总耗时: ${moment().diff(
      moment(startTime),
      'seconds',
      true
    )} 秒, ${startPage}到${startPage + pageCount}页， 总条数${results.length}条`
  );
};
puppeteer.launch({
  headless: true
}).then(async browser => {
  try {
    await fs.mkdirs('data/douban');
    // await getCategories(browser);
    await getSpecificCategoryMoive(['动画', '日本'], 0, 1);
    const all = await getSpecificCategoryMoivePageQuantity(
      ['动画'],
      4096,
      0,
      0
    );
    console.log(all);
  } catch (error) {
    await browser.close();
  }
});

const Koa = require('koa');
const app = new Koa();
app.use(async (ctx, next) => {
  ctx.response.type = 'application/json';
  const resultsString = await fs.readFile('./data/douban/results.json');
  const data = JSON.parse(resultsString);
  ctx.response.body = data;
});
app.listen(8803);