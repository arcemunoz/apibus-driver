module.exports = {

    deleteMany: (core)=> {
        return new Promise((resolve, reject) => {
           const db              = require('../config/db');
           return db.connect(core.model.HOST_DATABASE, core.model.DATABASE, core.model.PORT_DATABASE, function(){
                const coreCollection  = db.collection( 'cores' );
                return coreCollection.deleteMany({name: core.name}, (err, result) => {
                    if (err) {
                        console.log(err);
                        reject({status:501, result:err});
                    } else {
                        resolve({status:200, result: result});
                    }
                })
            });

        });
    }
}