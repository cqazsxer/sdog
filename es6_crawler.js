const puppeteer = require('puppeteer');
const { timeout } = require('./tools/tools.js');
const R = require('ramda');
const fs = require('mz/fs');
puppeteer.launch().then(async browser => {
  let page = await browser.newPage();

  await page.goto('http://es6.ruanyifeng.com/#README');
  await page.waitForSelector('#sidebar ol li a');
  let aTags = await page.evaluate(() => {
    return [...document.querySelectorAll('#sidebar ol li a')].map(a => (
      {
        href: a.href.trim(),
        name: a.text
      }
    ));
  });
  await fs.writeFile('./data/es6-pdf/links.json', JSON.stringify(aTags));
  console.log(aTags.length);
  await page.pdf({ path: `./data/es6-pdf/${aTags[0].name}.pdf` });
  await page.close();

  // // 这里也可以使用promise all，但cpu可能吃紧，谨慎操作
  // for (var i = 1; i < aTags.length; i++) {
  //   page = await browser.newPage()

  //   var a = aTags[i];

  //   await page.goto(a.href);

  //   await timeout(2000);

  //   // await page.pdf({path: `./data/es6-pdf/${a.name}.pdf`});

  //   page.close();
  // }

  await browser.close();
});
