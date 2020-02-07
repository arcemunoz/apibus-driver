//importamos librerías
const zmq               = require('zeromq');
const EventEmitter      = require('events');
const _                 = require('underscore');
const clone             = require('clone');
//Instanciamos socket push zeromq
global.sock             = zmq.socket('push');
//Numero de evento emitido
global.numEnv           = 0;
class Emitter extends EventEmitter {};
global.emitter          = new Emitter();
//let Requests            = [];
//let runningSchedule     = 0;




module.exports =  {
    //Se conecta mi core (ip) y puerto push para publicar mensajes.
    initSocketPush: async function(portPush, ip) {
        console.log(ip);
        return sock.bind(`tcp://${ip}:${portPush}`, (err) =>{
            if (err) {
                console.log(err);
                return { status: 500, msg: 'Error al conectar tu ip y puerto push. El puerto ya está utilizado'}
            } else {
                return { status: 200, msg: 'Ya puedo hacer push ...'};
            }
        });
    },
    //Función para envío de respuestas al apibus
    sendResponse: function ( msg ){

        //Obtenemos el componente destino
        msg.destination = msg.origin.componentName;
        msg.etapa       = 3;
        msg.type        = 'res';

        //Validamos que contenga una secuencia el mensaje y si no, mantenerlo en 1.
        if ( !msg.hasOwnProperty( 'seq' ) ) {
            msg.seq = 1;
        } else {
            msg.seq ++;
        }

        //Obtenemos el momento en que se envia la respuesta
        msg.hrend   = process.hrtime();

        //Validamos que el objeto de respuesta contenga la hora que se recibe la solicitud
        if ( msg.hasOwnProperty( 'hrstart' ) ) {

            msg.hrtime = process.hrtime( msg.hrstart )[ 1 ] / 1000000;  

        } else { 
            console.log("¡Warning!. No estas enviando {data.hrstart} en tu mensaje de respuesta para calcular el tiempo de procesamiento ..");
            msg.hrtime = -1;
        }

        console.log('Ya enviamos la respuesta al componente: '+msg.destination+' worker '+msg.origin.name);
        sock.send( JSON.stringify(msg) );
    },
    sendRequestSchedule : function() {
        setInterval( () => {
            let reqs = _.filter(Requests, (d) =>{
                return new Date() - new Date(d.time.toUTCString()) > 10000;
            })

            if (global.runningApiBus === 1  ){

                let newArray =  reqs.slice(0,29);

                let cont = 0;
                newArray.forEach( element => {
                     let message = element;
                     cont++;
                    let msg1 = message;
                    delete msg1.reject;
                    delete msg1.resolve;

                    sock.send( JSON.stringify(msg1) );

                    global.emitter.on( message.numEvent, res => {
                        let indexEvent = _.findIndex( Requests,{ numEvent: message.numEvent } );
                        if ( indexEvent != -1 ) {
                            Requests.splice(indexEvent, 1 );
                        }
                        //Si se resuelve satisfactoriamente se obtiene el resultado obtenido por el componente el que se le solicitó la petición. 
                        if ( res.datos.status === "ok" ){
                            console.log("resuelve programado 200 .............");
                            message.resolve = new Function(message.resolve);
                            message.resolve( res );
                        } else {
                            console.log("resuelve programado 500 .............");
                            console.log(res.datos.msg, message.numEvent);
                            message.reject = new Function(message.reject);
                            message.reject( res );
                        }
                    } );
                });
            }
        },1000);
    },

    // Enviamos una solicitud 
    sendRequest: function( d, destination ){
        let msg = {};
        msg = d;
        numRequests = 1;
        //Incrementamos el numero del evento en uno
        numEnv++;
        //La etapa la iniciamos en uno, ya que es el paso de partida de una solicitud.
        msg.etapa       =1;
        //Tipo request
        msg.type        ='req';
        //numEvent (Numero de instancia + nombre del worker + numero de evento)
        msg.numEvent    = process.env.name+'-'+global.numEnv;
        //Componente destino
        msg.destination = destination;
        //Nmbre del worker origen
        let namew       = process.env.name;
        //Obtenemos el momento de envío de la solicitud
        msg.hrstartr    = process.hrtime();
        //Guardamos el origen en el mensaje 
        msg.origin      = {
            componentName   : process.env.COMPONENT_NAME,
            name            : namew
        }
        //Validamos que la secuencia exista de lo contrario la inicializamos en 1
        if (!msg.hasOwnProperty('seq')) {   
            msg.seq = 1;
        } else {
            msg.seq++;
        }
        
        if (!msg.hasOwnProperty('md') || !msg.hasOwnProperty('datos')) {
            //Creamos la promesa resolverá el mensaje retorne con el mensaje con el numero de evento enviado.
            return new Promise( ( resolve, reject ) => {
                reject({message: "solicitud no lleva atributos necesarios (md y/o datos)"});
            });
        } 
        
        //Creamos la promesa resolverá el mensaje retorne con el mensaje con el numero de evento enviado.
        return new Promise( ( resolve, reject ) => {
            //Enviando el mensaje
            msg.resolved    = false;
            /*
            msg.reject      =  reject.toString();
            msg.resolve = resolve.toString();
            */
            let msg2 = clone(msg);
            //Requests.push(msg2);
            
            if (global.runningApiBus === 1 ){
                console.log('Enviando solicitud a: ' +  msg2.destination );
                delete msg2.resolve;
                delete msg2.reject;
                sock.send( JSON.stringify(msg2) );
                runningSchedule = 0;
                //Escuchando cuando se emte un mensaje con el numEvent correspondiente para resolver
                global.emitter.on( msg2.numEvent, res => {
                    /*
                    let indexEvent = _.findIndex( Requests,{ numEvent: msg2.numEvent } );
    
                    if ( indexEvent != -1 ) {
                        Requests.splice(     indexEvent, 1 );
                       }
                    */
                    //Si se resuelve satisfactoriamente se obtiene el resultado obtenido por el componente el que se le solicitó la petición. 
                    if ( res.datos.status === "ok" ){
                        resolve( res );
                    } else {
                        reject( res );
                    }
                } );
            } else {
                msg2.datos.status = 500;
                msg2.datos.msg = 'APIBUS no disponible';

                reject( msg2 );  
            }
        });

    }



}

