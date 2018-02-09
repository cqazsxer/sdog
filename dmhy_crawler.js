const puppeteer = require('puppeteer');
const moment = require('moment');
const _ = require('lodash');
const {
  timeout,
  isAheadDays,
  error,
  info,
  warning,
  end,
  queue
} = require('./tools/tools.js');
const R = require('ramda');
const fs = require('fs-extra');

const head = 'https://share.dmhy.org';



puppeteer.launch({ headless: true }).then(async browser => {
  /**
   * 递归获得某个动漫的所有page
   * 
   * @param {any} pages 初始化数组 []
   * @param {any} indexPage 首页
   * @returns 
   */
  async function handleMutiPages(pages, indexPage) {
    const nextPage = await indexPage.$$eval('.nav_title .fl a', as => {
      if (as.length === 2) {
        return as[1].getAttribute('href');
      }
      if (as.length === 1) {
        if (as[0].innerHTML === '下一頁') {
          return as[0].getAttribute('href');
        }
      }
      return undefined;
    });
    if (nextPage) {
      // 这里处理多页的
      const page = await browser.newPage();
      await page.goto(`${head}${nextPage}`, { waitUntil: 'domcontentloaded' });
      pages.push(page);
      return handleMutiPages(pages, page);
    } else {
      return pages;
    }
  }


  const startTime = moment();
  let page = await browser.newPage();
  await page.goto('https://share.dmhy.org/cms/page/name/programme.html', {
    waitUntil: 'domcontentloaded'
  });
  await page.waitForSelector('.weekly_list');
  info(
    `打开https://share.dmhy.org/cms/page/name/programme.html 耗时 ${moment().diff(
      moment(startTime),
      'seconds',
      true
    )} 秒`
  );
  // 番剧表总链接数据
  let comicsByDays = await page.evaluate(head => {
    return [...document.querySelectorAll('.weekly_list tr')]
      .slice(0, 7)
      .map(tr => {
        const $tit = tr.querySelector('td[scope=row]');
        const $content = tr.querySelectorAll('.weekly_list_b');
        const con = [...$content].map($item => {
          const $weekly_list_title_a = $item.querySelector(
            '.weekly_list_title a'
          );
          return {
            bgi: $item.style.backgroundImage.split('"')[1],
            name: $weekly_list_title_a.innerText,
            homeUrl: $weekly_list_title_a.getAttribute('href'),
            url: `${head}${$item.getAttribute('onclick').split("'")[1]}`
          };
        });
        return {
          bgc: $tit.getAttribute('style'),
          week: {
            name: $tit.getAttribute('id'),
            img: {
              url: $tit.childNodes[0] && $tit.childNodes[0].getAttribute('src'),
              width: '85',
              height: '109'
            }
          },
          con
        };
      });
  }, head);
  await fs.mkdirs('data/dmhy');
  await fs.writeFile(
    './data/dmhy/comicsByDays.json',
    JSON.stringify(comicsByDays)
  );
  await page.close();
  // comicsByDays = comicsByDays.slice(0, 2); // 只取一天的
  const result = [];
  await queue(async i => {
    // 分组
    const comicsByDay = comicsByDays[i];

    let links = R.prop('con')(comicsByDay); // 动漫数
    links = links.slice(0, 1); // 只取两个
    const name = '动漫';
    const perChuck = 2;
    const chuckedLinksArr = R.splitEvery(perChuck)(links);
    info(
      `day: ${comicsByDay.week.name} 总共分成${
        chuckedLinksArr.length
      }个chuck, 每个chuck有${perChuck}个记录。共${links.length}个${name}。`
    );
    info(`day: ${comicsByDay.week.name} 开始抓取...`);

    // // 处理数据
    result[i] = {
      day: comicsByDay.week.name,
      comics: []
    };

    await queue(async j => {
      info(`day: ${comicsByDay.week.name}, chuck:${j} 开始处理...`);
      const chuckedLinks = chuckedLinksArr[j];
      // 若干动漫主页
      let indexPages = await Promise.all(
        R.map(() => browser.newPage())(chuckedLinks)
      );
      const zipedIndexPages = R.zip(indexPages, chuckedLinks);

      await Promise.all(
        R.map(p =>
          p[0].goto(p[1].url.toString(), { waitUntil: 'domcontentloaded' })
        )(zipedIndexPages)
      );

      // info(`day: ${comicsByDay.week.name}, chuck:${j} 请求开始...`);
      const time0 = moment();
      const comicsPages = await Promise.all(
        R.map(z => handleMutiPages([z[0]], z[0]))(zipedIndexPages)
      )
      info(`day: ${comicsByDay.week.name}, chuck:${j} 请求结束...耗时${moment().diff(moment(time0), 'seconds', true)} 秒`);
      comicsPages.forEach((comicPages, i) => {
        zipedIndexPages[i][0] = comicPages;
      });

      // 当前数据结构
      // [
      //   [
      //     [], // pages
      //     {}, // links
      //   ],
      //   [
      //     [], // pages
      //     {}, // links
      //   ],
      // ]
      const zipedComicsPages = zipedIndexPages;

      const mapedZipedComicsPages = zipedIndexPages.map((zipedComicPages, i) => {
          return zipedComicPages[0].map(p => [p, zipedComicPages[1]])
      })
      const flatenZipedComicsPages = R.unnest(mapedZipedComicsPages);

      // 处理页面抓取逻辑
      // info(`day: ${comicsByDay.week.name}, chuck:${j} 抓取开始...`);
      const time1 = moment();
      const comicsByPages = await Promise.all(
        R.map(p =>
          p[0].evaluate(comicName => {
            // 抓取每个搜索关键词首页 逻辑
            return [...document.querySelectorAll('#topic_list tr')]
              .slice(1)
              .map($tr => {
                const tds = [...$tr.querySelectorAll('td')];
                let teamname = '';
                let teamurl = '';
                let name = '';
                const $tag = tds[2].querySelector('.tag a');
                if ($tag) {
                  // 带tag的
                  teamname = $tag.innerHTML;
                  teamurl = $tag.getAttribute('href');
                  name = [...tds[2].querySelectorAll('a')][1].innerText.trim();
                } else {
                  teamname = tds[2]
                    .querySelector('a')
                    .innerHTML.split('<span class="keyword">')[0]
                    .trim();
                  if (teamname.split('【').length > 1) {
                    teamname = teamname.split('【')[1].split('】')[0];
                  } else if (teamname.split('[').length > 1) {
                    teamname = teamname.split('[')[1].split(']')[0];
                  }
                  name = tds[2].innerText;
                }
                // 标题

                return {
                  name,
                  comicName,
                  // page: document
                  //   .querySelector('.nav_title .fl')
                  //   .innerText.trim(),
                  // teamname: teamname.trim(),
                  // time: tds[0].querySelector('span').innerHTML,
                  // type: tds[1].querySelector('font').innerHTML,
                  // teamurl,
                  // magnet: tds[3].querySelector('a').getAttribute('href'),
                  // size:tds[4].innerText,
                  // seeds:tds[5].innerText,
                  // downloading:tds[6].innerText,
                  // saved:tds[7].innerText,
                  // publisher: tds[8].innerText
                };
              });
          }, p[1].name)
        )(flatenZipedComicsPages)
      );
      info(`day: ${comicsByDay.week.name}, chuck:${j} 抓取结束... 耗时${moment().diff(moment(time1), 'seconds', true)} 秒`);
      // console.log('comicsByPages', comicsByPages);
      // console.log('comicsByPages.length', comicsByPages.length);


      result[i].comics = R.compose(R.groupBy(R.prop('comicName')),R.flatten)(comicsByPages);


      await Promise.all(R.map(p => p[0].close())(flatenZipedComicsPages));
      info(`day: ${comicsByDay.week.name}, chuck:${j} 处理结束...`);
    }, chuckedLinksArr);

    info(`day: ${comicsByDay.week.name} 处理结束......`);
  }, comicsByDays);

  await fs.writeFile('./data/dmhy/comics.json', JSON.stringify(result));

  end(`总耗时 ${moment().diff(moment(startTime), 'seconds', true)} 秒`);
  // browser.close();
});
