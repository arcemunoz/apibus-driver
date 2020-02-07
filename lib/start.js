//Usamos dotenv para leer variables de entorno
const dotenv            = require('dotenv');
dotenv.config();

const Node = require('uniqid');

const dns = require('dns');
//Conexión al apibus
const ConnectApiBus     = require('./connection');
//Función de envío y recepción de mensajes
const { sendRequest, sendResponse, initSocketPush, sendRequestSchedule } = require('./producers');
//Importamos la función para recibir mensajes
const { receiveMessage, EmiterReceive } = require('./receive');

global.timeLastRequest = new Date();
let core = {};

  
module.exports = {
    connect: async ( componentName )=> {
            process.env.COMPONENT_NAME = componentName;
            let name ='';

            if (process.worker === undefined) {
                name = Node()+'-'+componentName+'-master';
            } else {
                name = Node()+'-'+componentName+'-'+process.worker.id; 
            }

            process.env.name = name;

           await dns.lookup(process.env.APIBUS_HOSTNAME, function(err, result) {
              ip = result;
              console.log("ip del componente: "+componentName+" "+ip);

              let worker = {
                componentName   : componentName,
                ip,
                name            : name,
                process         : 0,
                pid             : process.pid
            }

            ConnectApiBus.requestToCoreConnect(worker).then( (data)=>{
                let msg         = JSON.parse(data.msg);
                //Este se utiliza para ejecutar el proceso de envío de solicitudes pendientes de envío
                //sendRequestSchedule();
                
                console.log(msg.result.core.name+': '+msg.result.message);

                core        = msg.result.core;

                let sockPull    = ConnectApiBus.listenerApiBusSock(core.portPull);

                sockPull.on( 'message', ( msg ) => {
                    receiveMessage( JSON.parse(msg.toString()) );
                });
                //Se escucha todos los mensajes recibidos desde el API BUS
                initSocketPush( core.portPush, core.ip );
            }).catch( e => console.log(e));  
            });

 

            
            let signals = ['SIGINT', 'SIGTERM', 'SIGQUIT', 'SIGKILL'];
            signals.forEach(signal => process.on(signal, async () => {

              console.log('Bye...');  

              coreModel = require('./models/core');
              
              let a = await coreModel.deleteMany(core).then( res => {
                return res;
              }).catch( e=>{
               return e;
              });

              process.exit();
             
            }));
            

    },
    receiveMessage      : receiveMessage,
    sendResponse        : sendResponse,
    receiveTransaction  : EmiterReceive,
    sendRequest         : sendRequest   
}
