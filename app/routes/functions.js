const Device    = require('../schemas/device');

module.exports = function(app, mqtt) {

    app.get('/api/functions/create/:deviceId/:name', async (req, res) => {
        const deviceId = req.params.deviceId;
        const funcName = req.params.name;

        try {
            const device = await Device.findById(deviceId);
            if(!device)
                return res.json({ success: false, message: "Device not found" });
            if(device.functions.includes(funcName))
                return res.json({ success: false, message: "Function already exists" });
                
            device.functions.push(funcName);
            await device.save();
            await Device.sendDevices(res);
        } catch (err) {
            Device.sendErr(res, err);
        }
        
    });

    app.get('/api/functions/delete/:deviceId/:name', async (req, res) => {
        const deviceId = req.params.deviceId;
        const funcName = req.params.name;

        try {
            const device = await Device.findById(deviceId);
            if(!device)
                return res.json({ success: false, message: "Device not found" });
            if(!device.functions.includes(funcName))
                return res.json({ success: false, message: "Function not found" });
       
            device.functions.pull(funcName);
            await device.save();
            await Device.sendDevices(res);
        } catch (err) {
            Device.sendErr(res, err);
        }

    });

    app.get('/api/functions/call/:deviceId/:name/:param', async (req, res) => {
        const deviceId  = req.params.deviceId;
        const funcName  = req.params.name;
        const funcParam = req.params.param;

        try {
            const device = await Device.findById(deviceId);
            if(!device)
                return res.json({ success: false, message: "Device not found" });
            if(!device.functions.includes(funcName))
                return res.json({ success: false, message: "Function not found" });
            if(!device.connected)
                return res.json({ success: false, message: "Requested device is not online" });
            if(!device.flag)
                return res.json({ success: false, message: "Device is busy" });
        
            device.flag = false;
            await device.save();

            device.sendPayload(mqtt, `/${funcName}?params=${funcParam}`);

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
