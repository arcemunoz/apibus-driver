// cliente de mongodb
const MongoClient   = require('mongodb').MongoClient;
const dotenv    =   require('dotenv');
dotenv.config();

let db, components, cores, ports;

exports.connect = (host, database, port, cb) => {
    const URL           = `mongodb://${host}:${port}/${database}`;
    console.log(URL);
    if( ! db ) {
        MongoClient.connect(URL, { useNewUrlParser : true, useUnifiedTopology: true  }, (err, client) => {
            if(err) {
                console.log(err);
                console.error("ERROR de conexión a "+database);
                cb(err);
            } else {
                db = client.db(database);
                db.collections()
                .then(cols => {
                    if(cols.length === 0) {
                        // se crea la coleccion components
                        return db.createCollection('components')
                        .then(col => {
                            
                            const collection    = db.collection('components');
                            components          = collection;

                            return collection.createIndex({name:1}).then( (data)=>{
                                cb({message: 'Se crea colección components'});
                            });
                        });
                    }
                    else {
                        components    = db.collection('components');
                        cores         = db.collection('cores');
                        ports         = db.collection('ports');
                        cb({message: 'Base de datos levantada con éxito'});
                    }
                })
                .catch(err => console.error("ERROR al obtener colecciones",err));
            }
        });
    }
}

exports.get = () => { return db }

exports.collection = x => {
    if (x === 'components') return components;
    if (x === 'cores') return cores;
    if (x === 'ports') return ports;
    else return null;
}

