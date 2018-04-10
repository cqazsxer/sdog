const puppeteer = require('puppeteer');
const fs = require('fs-extra');
const axios = require('axios');
const R = require('ramda');
(async () => {
  const { data } = await axios.get('http://lackar.com/aa/open_link.js');
  eval(data);
  // 包含 name_en home search 三个字段
  const websites1 = R.compose(
    R.map(item =>
      R.compose(
        R.compose(R.assoc('name_en'), R.nth(0))(item),
        R.compose(R.assoc('url'), R.prop('home'), R.nth(1))(item),
        R.compose(R.assoc('search'), R.prop('search'), R.nth(1))(item)
      )({})
    ),
    R.toPairs
  )(searchURL);
  const websites2 = await puppeteer
    .launch({ headless: false })
    .then(async browser => {
      let page = await browser.newPage();

      try {
        await page.goto('http://lackar.com/aa/', {
          waitUntil: 'domcontentloaded'
        });
        await page.addScriptTag({
          url: 'https://cdn.bootcss.com/ramda/0.25.0/ramda.min.js'
        });

        const websites2 = await page.evaluate(() => {
          const cssQueryAll = R.invoker(1, 'querySelectorAll');
          const cssQuery = R.invoker(1, 'querySelector');
          const getAttribute = R.invoker(1, 'getAttribute');
          return R.transduce(
            R.map($catalog => {
              const getImgSrc = R.compose(
                getAttribute('data-original'),
                cssQuery('img')
              );
              const getTopImgSrc = R.compose(
                getAttribute('src'),
                cssQuery('img')
              );
              const getImgId = R.compose(getAttribute('id'), cssQuery('img'));
              const getPInnerHTML = R.compose(
                R.prop('innerHTML'),
                cssQuery('p')
              );

              const $top = cssQuery('.top', $catalog);
              const type = R.compose(
                R.prop('innerHTML'),
                cssQuery('.catalogname')
              )($catalog);
              // 最热
              const topWebsite = $top
                ? [
                    {
                      favicon: getTopImgSrc($top),
                      name_en: getImgId($top),
                      name: getPInnerHTML($top),
                      isTop: true,
                      type
                    }
                  ]
                : [];

              console.log('$top', $top);
              const $subs = cssQueryAll('.sub', $catalog);

              // 其他
              const subsWebsites = R.map($sub => ({
                favicon: getImgSrc($sub),
                name_en: getImgId($sub),
                name: getPInnerHTML($sub),
                isTop: false,
                type
              }))($subs);

              return R.concat(topWebsite, subsWebsites);
              return subsWebsites;
            }),
            R.concat,
            [],
            cssQueryAll('.catalog', document)
          );

          return websites;
        });

        await page.close();
        await browser.close();

        return websites2;
      } catch (error) {
        console.error(error);
        await page.close();
        await browser.close();
      }
    });

  const zipName_en1 = R.zipObj(R.pluck('name_en', websites1), websites1);
  const zipName_en2 = R.zipObj(R.pluck('name_en', websites2), websites2);

  const websites = R.compose(R.values, R.mergeDeepLeft)(
    zipName_en1,
    zipName_en2
  );

  // await fs.writeFile('./data/aa/websites1.json', JSON.stringify(zipName_en1));
  // await fs.writeFile('./data/aa/websites2.json', JSON.stringify(zipName_en2));
  await fs.writeFile('./data/aa/websites.json', JSON.stringify(websites));
})();
