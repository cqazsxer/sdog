const puppeteer = require('puppeteer');
const R = require('ramda');
const fs = require('fs-extra');

puppeteer.launch({ headless: false }).then(async browser => {
  let page = await browser.newPage();

  // 爬分类信息
  await page.goto('https://movie.douban.com/tag/#/', {
    waitUntil: 'domcontentloaded'
  });
  await page.addScriptTag({
    url: 'https://cdn.bootcss.com/ramda/0.25.0/ramda.min.js'
  });

  const categorys = await page.evaluate(() => {
    var cssQueryAll = R.invoker(1, 'querySelectorAll');
    var cssQuery = R.invoker(1, 'querySelector');

    return R.map($ui => {
      const $lis = cssQueryAll('li', $ui);
      const getSpanInnerHTML = R.compose(R.prop('innerHTML'), cssQuery('span'));
      const categoryType = R.compose(getSpanInnerHTML, R.head)($lis);
      const tags = R.compose(
        R.reduce((acc, $li) => {
          return R.append(getSpanInnerHTML($li), acc);
        }, []),
        R.tail
      )($lis);
      // const tags =
      return {
        categoryType,
        tags
      };
    })(cssQueryAll('.tags .category', document));
  });
  console.log('categorys', categorys);
});
