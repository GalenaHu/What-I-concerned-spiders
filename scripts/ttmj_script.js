const DramaIdService = require('../ttmj/services/dramas_id_service');
const ttmjSpider = require('../ttmj/services/spider_service');

async function getDramas() {

  const remainingCount = await DramaIdService.getRemainingIDCount();
  const numbersPerTime = 1;
  while (remainingCount > 0) {
    await ttmjSpider.sprideringDrama(numbersPerTime)
      .then((r) => {
        console.log(r);
      })
      .catch((e) => {
        console.log(e);
      });
  }
}

// eslint-disable-next-line default-case
switch (process.argv[2]) {
  case 'generate_ids':
    DramaIdService.generateDramaId(Number(process.argv[3]), Number(process.argv[4]))
      .then((r) => {
        console.log('done');
        process.exit(0);
      }).catch((e) => {
        console.log(e);
        process.exit(1);
      });
    break;
  case 'start_getting_dramas':
    getDramas()
      .then((r) => {
        console.log(r);
        process.exit(0);
      }).catch((e) => {
        console.log(e);
        process.exit(1);
      });
    break;
}
