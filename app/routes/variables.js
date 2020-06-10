const Device    = require('../schemas/device');

module.exports = function(app, mqtt) {

    app.get('/api/variables/create/:deviceId/:name', async (req, res) => {
        const deviceId  = req.params.deviceId;
        const varName   = req.params.name;

        try {
            const device = await Device.findById(deviceId);
            if(!device)
                return res.json({ success: false, message: "Device not found" });
            if(device.variables.toObject().some(v => v.name === varName))
                return res.json({ success: false, message: "Varible already exists" });
            
            const variable = {
                name: varName,
                lastResponce: null,
                responseTime: null
            }
            
            device.variables.push(variable);
            await device.save();
            await Device.sendDevices(res);
        } catch (err) {
            Device.sendErr(res, err);
        }
    });

    app.get('/api/variables/delete/:deviceId/:name', async (req, res) => {
        const deviceId  = req.params.deviceId;
        const varName   = req.params.name;

        try {
            const device = await Device.findById(deviceId);
            if(!device)
                return res.json({ success: false, message: "Device not found" });
            const variable = device.variables.toObject().find(v => v.name == varName);
            if(!variable)
                return res.json({ success: false, message: "Varible does not exists" });
            
            device.variables.pull(variable);
            await device.save();
            await Device.sendDevices(res);
        } catch (err) {
            Device.sendErr(res, err);
        }
    });

    app.get('/api/variables/get/:deviceId/:name', async (req, res) => {
        const deviceId  = req.params.deviceId;
        const varName   = req.params.name;

        try {
            const device = await Device.findById(deviceId);
            if(!device)
                return res.json({ success: false, message: "Device not found" });
            if(!device.variables.toObject().some(v => v.name === varName))
                return res.json({ success: false, message: "Varible does not exists" });
            if(!device.flag)
                return res.json({ success: false, message: "Device is busy" });
            
            device.flag = false;
            await device.save();

            device.sendPayload(mqtt, `/${varName}`);

            const changeStream = device.flagWatcher();
            changeStream.on('change', async () => {
                changeStream.close();
                await Device.sendDevices(res);
            });

        } catch (err) {
            Device.sendErr(res, err);
        }
    });

}