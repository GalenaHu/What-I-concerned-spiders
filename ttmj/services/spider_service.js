const axios = require('axios');
const cheerio = require('cheerio');
const moment = require('moment');
const qs = require('qs');
const Drama = require('../models/drama');
const DramaIdService = require('./dramas_id_service');
require('../services/mongoose_service');

const lastInfo = {}; // 保存上次条目的中英文剧名

// 整理下载信息
function fliterDownload(download, $) {
  const downloadList = [];
  download.each((index, element) => {
    // eslint-disable-next-line no-script-url
    if ($(element).attr('href') === 'javascript:void(0);') { return; }
    downloadList.push({
      source: $(element).attr('title'),
      url: $(element).attr('href'),
    });
  });
  return downloadList;
}

// 整理条目信息
function fliterVersion(el, seasonId, dramaId, $) {
  // 当seasonId<=0时为美剧合集，不保存中英文剧名
  if (seasonId <= 0) {
    const version = {
      dramaId,
      title: el.find('td:nth-child(2)>a').text(),
      size: el.find('td:nth-child(6)').text(),
      createAt: moment(el.find('td:nth-child(9)').text(), 'YYYY-MM-DD').format('YYYY-MM-DD'),
      accessCode: el.find('td:nth-child(5)').text(),
      url: fliterDownload($(el.find('td:nth-child(3)>a')), $),
    };
    return version;
  }

  // 获取seasonId > 0时获取中英文剧名，若获取失败则选用上次保存信息
  let engTitle = /(?<=[\u4e00-\u9fa5]+\s)[a-zA-Z\s]+(?=\sS[0-9])/.exec(el.find('td:nth-child(2)>a').text());
  let chsTitle = /[\u4e00-\u9fa5]+(?=\s)/.exec(el.find('td:nth-child(2)>a').text());
  if (engTitle) {
    [engTitle] = engTitle;
    lastInfo.engTitle = engTitle;
  } else {
    // eslint-disable-next-line prefer-destructuring
    engTitle = lastInfo.engTitle;
  }
  if (chsTitle) {
    [chsTitle] = chsTitle;
    lastInfo.chsTitle = chsTitle;
  } else {
    // eslint-disable-next-line prefer-destructuring
    chsTitle = lastInfo.chsTitle;
  }

  // 返回version对象
  const version = {
    dramaId,
    engTitle,
    chsTitle,
    title: el.find('td:nth-child(2)>a').text(),
    size: el.find('td:nth-child(6)').text(),
    createAt: moment(el.find('td:nth-child(9)').text(), 'YYYY-MM-DD').format('YYYY-MM-DD'),
    accessCode: el.find('td:nth-child(5)').text(),
    url: fliterDownload($(el.find('td:nth-child(3)>a')), $),
  };
  return version;
}

async function getList(seasonId, dramaId) {
  // 获取返回结果
  const url = 'http://www.ttzmz.vip/index.php/meiju/get_episodies.html';
  const res = await axios.post(url, qs.stringify({
    sid: seasonId,
    mid: dramaId,
  }));

  console.log(`seasonId ${seasonId}`);
  let html = res.data.Html_Seedlist;
  // console.log(html)
  // console.log(res.data);
  if(html === '') { return {} }
  if (!html) {
    const temp = JSON.parse(String(res.data).replace(/\\'/gm, '\'').replace(/(?<!\\|Season|Seedlist|>)"(?!\}|Html|<)|'/gm, '\\"').replace(/\\'/gm, '\''))
    html = temp.Html_Seedlist;
  }

  const htmlstringify = `<table>${html.replace(/\s+/g, ' ')}</table>`; // 去除空格换行
  const $ = cheerio.load(htmlstringify);
  const doms = $('table').find('tr');

  // 将各个version存入list
  const versionList = [];
  let list;

  doms.each((index, el) => {
    versionList.push(fliterVersion($(el), seasonId, dramaId, $));
  });

  // 如果season为合集则不保存中英文剧名
  if (seasonId <= 0) {
    list = {
      dramaId,
      seasonId,
      version: versionList,
    };
  } else {
    list = {
      dramaId,
      engTitle: versionList[0].engTitle,
      chsTitle: versionList[0].chsTitle,
      seasonId,
      version: versionList,
    };
  }
  return list;
}

async function getSeason(dramaId) {
  // 获取分季信息
  const url = 'http://www.ttzmz.vip/index.php/meiju/get_episodies.html';
  const res = await axios.post(url, qs.stringify({
    sid: 0,
    mid: dramaId,
  })).catch((e) => {
    console.log(e);
  });
  const seasonInfo = res.data.Html_Season;
  const seasonHtml = cheerio.load(seasonInfo)('h3');

  // 若无此剧，返回
  if (seasonHtml.length === 0) {
    const result = await Drama.insert({
      dramaId,
      info: 'no such drama',
    });
    console.log(`Drama Id ${dramaId}: no such drama`);
    return result;
  }

  console.log(`dramaId ${dramaId}`);

  const seasonList = [];
  // 每季分别请求，并将结果插入数组
  // eslint-disable-next-line no-restricted-syntax,guard-for-in
  for (const item in seasonHtml) {
    // eslint-disable-next-line max-len
    if (seasonHtml[item].attribs && seasonHtml[item].attribs.id) {
      const seasonId = seasonHtml[item].attribs.id.valueOf();
      // eslint-disable-next-line no-await-in-loop
      const singleSeason = await getList(seasonId, dramaId);
      seasonList.push(singleSeason);
      // eslint-disable-next-line no-await-in-loop
      await new Promise((rsv) => {
        setTimeout(rsv, Math.floor(Math.random() * 3000 + 2000));
      });
    }
  }

  let picSrc;
  if (seasonList[0].engTitle) {
    const titleUrl = seasonList[0].engTitle.replace(/\s/gm, '\.');
    const pictureHtml = await axios.get(`http://www.ttzmz.vip/meiju/${titleUrl}.html`);
    console.log(pictureHtml.data)
    const picture = cheerio.load(pictureHtml.data)('.seedpic>img');
    picSrc = picture[0].attribs.src;
  } else {
    picSrc = "no pic";
  }


  const result = await Drama.findOneAndUpdate(
    dramaId,
    {
      dramaId,
      engTitle: seasonList[0].engTitle,
      chsTitle: seasonList[0].chsTitle,
      pic: picSrc,
      season: seasonList,
    },
  );
  return result;
}
//
async function sprideringDrama(count) {
  const ids = await DramaIdService.getRandomDramaId(count);
  let succeedCount = 0;
  let errCount = 0;
  // eslint-disable-next-line guard-for-in,no-restricted-syntax
  for (const id in ids) {
    // eslint-disable-next-line no-await-in-loop
    await getSeason(Number(ids[id])).then((r) => {
      DramaIdService.markDramaIdSucceed(ids[id]);
      succeedCount += 1;
    }).catch((e) => {
      DramaIdService.idBackInPool(ids[id]);
      console.log(`error dramaId: ${ids[id]}`);
      errCount += 1;
    });
    // eslint-disable-next-line no-await-in-loop
    await new Promise((rsv) => {
      setTimeout(rsv, Math.floor(Math.random() * 3000 + 2000));
    });
  }
  return {
    succeedCount,
    errCount,
  };
}

module.exports = {
  sprideringDrama,
  getList,
  getSeason,
};

getSeason(231).then((r) => {
  console.dir(r, { depth: null });
  DramaIdService.markDramaIdSucceed(120);
  process.exit(0);
}).catch((e) => {
  DramaIdService.idBackInPool(120);
  console.log(e);
  process.exit(0);
});


// getList(-1, 82).then((r) => {
//   console.dir(r, { depth: null });
// }).catch((e) => {
//   console.log(e);
// });
