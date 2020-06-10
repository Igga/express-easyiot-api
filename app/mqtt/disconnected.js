const Device    = require('../schemas/device');

module.exports = function(mqtt, db) {

    mqtt.on('clientDisconnected', async client => {
        const deviceId = client.id.substring(6, client.id.length);
        
        console.log(`Device ${client.id} disconnected!`);
        
        try {
            const device = await Device.findById(deviceId);
            if(!device)
                return;
            
            device.lastOnline = new Date();
            device.connected = false;
            await device.save();

        } catch (err){
            console.log(err);
        }

    });

}