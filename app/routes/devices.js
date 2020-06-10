const crypto = require('crypto');
const Device = require('../schemas/device');

module.exports = function(app) {
    app.get('/api/devices/create/:name', async (req, res) => {
        const name     = req.params.name;
        const hashStr  = crypto.createHash('md5').update(name + Math.floor(new Date() / 1000)).digest("hex");
        const id       = hashStr.substr(0, 6);

        try {
            const device = new Device({name, id});
            await device.save();
            console.log(`Device ${name} created`);
            Device.sendDevices(res);
        } catch (err) {
            Device.sendErr(res, err);
        }
    });
    
    app.get('/api/devices/get', async (req, res) => {

        await Device.sendDevices(res);

    });

};