const Device    = require('../schemas/device');

module.exports = function(mqtt, db) {

    mqtt.on('published', async (packet, client) => {
        
        const incomingMessage = (packet.payload.toString('utf8')).trim();
        console.log(`Incoming message ${incomingMessage}`);

        if(!client)
            return;

        const deviceId = client.id.substring(6, client.id.length);

        if(isJSON(incomingMessage)) {
            try {
                const device = await Device.findById(deviceId);

                if(!device)
                    return;

                const resp = JSON.parse(incomingMessage);
                device.lastOnline = new Date();
                
                if(resp.event_name != undefined) {
                    //event pooling
                    const event = {
                        name: resp.event_name,
                        data: resp.data,
                        time: new Date()
                    };
                    if(device.events.length > 9)
                        device.events.pop();
                    device.events.unshift(event);
                    await device.save();
                    return;
                }
                
                device.flag = true;
                
                if(resp.return_value != undefined) {
                    //function,pin
                    device.message = `Returned value ${resp.return_value}`;
                    await device.save();
                    return;
                }
                //variable
                const variable = Object.keys(resp)[0];
                console.log(`Variable ${variable} : ${resp[variable]}`);
                const index = device.variables.toObject().findIndex(v => v.name == variable);
                if(index != -1) {
                    device.message = `Returned value ${resp[variable]}`;
                    device.variables[index].lastResponse = resp[variable];
                    device.variables[index].responseTime = new Date();
                }
                else
                    device.message = "Not found";
                await device.save();
            }catch(err) {
                console.log(err);
            }

        } else {
            try {
                const device = await Device.findById(deviceId);
                if(!device)
                    return;

                device.lastOnline = new Date();
                if(incomingMessage.substring(0, 1) == "{") {
                    //msg start
                    device.splitMessage = incomingMessage;
                    await device.save();                    
                    return;
                }
                if(incomingMessage.slice(-1) == "}") {
                    //msg end
                    const msg = device.splitMessage + incomingMessage
                    if(isJSON(msg)) {
                        const message = JSON.parse(msg);
                        if(message.message)
                            device.message = message.message;
                        else
                            device.message = "Not found";
                        console.log("Flag setted to true");
                        device.flag = true;
                        await device.save();
                    }
                }
            } catch (err){
                console.log(err);
            }
        }
    });

}


function isJSON(something) {
    if (typeof something != 'string')
        something = JSON.stringify(something);

    try {
        JSON.parse(something);
        return true;
    } catch (e) {
        return false;
    }
}
