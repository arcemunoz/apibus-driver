// Función que recibe un mensajes del apibus

const EventEmitter      = require('events');
class Emitter extends EventEmitter {};
const EmiterReceive     = new Emitter();

module.exports = {
    //Recibimos un mensaje 
    receiveMessage  : function ( data ) {
        switch ( true ) {
            //En caso de ser una solicitud se emite a ready
            case ( data.type ==='req' ):

                data.hrstart = process.hrtime();
                EmiterReceive.emit( 'ready' , data);
                break;

            //En caso de ser una respuesta se emite al la solicitud enviada previammente (numEvent)
            case ( data.type === 'res' ):

                //Validamos que tengamos hrstartr para medir el tiempo completo de ejecución
                if ( !data.hasOwnProperty( 'hrstartr' ) ) {
                     console.log( "¡Warning!. No estas recibiendo data.hrstartr en tu mensaje de respuesta para calcular el tiempo de procesamiento componente + APIBUS + DESTINO .." ); 
                }
                //Emitimos
                global.emitter.emit( data.numEvent.toString(), data );
                break;

            default:
                console.log( 'tipo de objeto no identificado: ¿res o req?.' );
                break;
        }
    },
    EmiterReceive
}
