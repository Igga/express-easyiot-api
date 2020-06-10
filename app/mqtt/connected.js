const Device    = require('../schemas/device');

module.exports = function(mqtt, db) {

    mqtt.on('clientConnected', async client => {
        const deviceId = client.id.substring(6, client.id.length);

        console.log(`New client ${client.id} connected with ID: ${deviceId}`);

        try {
            const device = await Device.findById(deviceId);
            if(!device)
                return console.log(`This device is not in DB`);
            
            device.connected = true;
            device.lastOnline = new Date();
            device.clientId = client.id;
            await device.save();
        } catch (err) {
            console.log(err);
        }
    });
    
}