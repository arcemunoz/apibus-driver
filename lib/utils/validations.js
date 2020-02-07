module.exports = {
    validateMessage: (msg) =>{

        if ( !msg.origin.hasHownProperty('destination') ) {

            return { state: 500, msg: 'El mensaje no contiene el componente destino' };
        } else {

            return { state: 200, msg: 'Success' }
        }
    }
    
}