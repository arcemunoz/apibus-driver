const zmq           = require('zeromq');
global.sockPull      = zmq.socket('pull');
const requester     = zmq.socket('req');
let requesterCore   = zmq.socket('req');
const dns           = require('dns');
let IP_APIBUS       = '';
global.runningApiBus= 1;




module.exports = {
    requestToCoreConnect:(work)=> {
        console.log(work);
        return new Promise( ( resolve, reject ) => {
            dns.lookup(process.env.APIBUS_HOSTNAME, (error, address) => { 
                console.log(address,'-----',process.env.APIBUS_HOSTNAME);
                IP_APIBUS = address;
                requesterCore.connect('tcp://'+IP_APIBUS+':'+process.env.PORT_CONNECT_CORE); 
                //Respuesta de la solicitud de conexión del core a API BUS
                
                requesterCore.on('disconnect', async function(fd, ep) {
                    console.log("disconnect apibus");
                    global.runningApiBus= 0;
                });

                requesterCore.on('connect', async function(fd, ep) {
                    console.log("Apibus connected..");
                    global.runningApiBus= 1;
                });

                // Call monitor, check for events every 500ms and get all available events.
                console.log('Start monitoring...');
                requesterCore.monitor(500, 0);

                requesterCore.on('message', function(msg) {
                    if(msg.toString().includes('success')){
                         resolve({ connected: true, msg: msg.toString() });
                     } else{ 
                         reject( { connected: false, msg: msg.toString() } );
                     }   
                });

                requesterCore.send(JSON.stringify(work));
                //Se envia solicitud de alta de core al API BUS
            });
        });
    },
    listenerApiBusSock: (portPull) => {
        console.log('listening...');
        console.log(IP_APIBUS, portPull,'--');
        // Se hace pull de todos los mensajes que reciba del api buss
        sockPull.connect(`tcp://${IP_APIBUS}:${portPull.toString()}`);

        return sockPull;
    }
}