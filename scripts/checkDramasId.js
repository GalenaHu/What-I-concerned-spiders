const DramaIdService = require('../ttmj/services/dramas_id_service');
const Drama = require('../ttmj/models/drama');
require('../ttmj/services/mongoose_service');

async function checkId(id) {
    const result = await Drama.getOneById( id )
    return result
}
// checkId(148).then((r) => {
//     console.log(r)
// })
async function checking() {
    const remainingCount = await DramaIdService.getRemainingIDCount();
    console.log(remainingCount)
    for (let id = 2500; id >= 0; --id) {
        checkId(id).then((r) => {
            if (!r) {
                DramaIdService.idBackInPool(id);
                console.log(id + ' is not in the db')
            }
        })
    }
}
checking()

// async function checkId(id) {
//     const result = await Drama.getOneById( id )
//     console.log(result)
//     return result
// }

// checkId(120)

// switch (process.argv[2]) {
//     case 'check_id':
//         checkId()
//     break;
// }






