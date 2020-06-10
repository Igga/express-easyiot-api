const Device    = require('../schemas/device');

module.exports = function(app, mqtt) {
    app.get('/api/pins/create/:deviceId/:pinId/:type/:mode/:desc', async (req, res) =>{
        const deviceId  = req.params.deviceId;
        const pinId     = parseInt(req.params.pinId);
        const type      = req.params.type;
        const mode      = req.params.mode;
        const desc      = req.params.desc;

        if(isNaN(pinId) || pinId < 0)
            return res.json({ success: false, message: "Pin ID is incorrect" });
        if(type != "analog" && type != "digital")
            return res.json({ success: false, message: "Type is incorrect" });
        if(mode != "i" && mode != "o")
            return res.json({ success: false, message: "Mode is incorrect" });

        try {
            const device = await Device.findById(deviceId);
            if(!device)
                return res.json({ success: false, message: "Device not found" });
            if(!device.connected)
                return res.json({ success: false, message: "Requested device is not online" });
            if(!device.flag)
                return res.json({ success: false, message: "Device is busy" });
            if(device.pins.toObject().some(pin => pin.id === pinId))
                return res.json({ success: false, message: "Pin already exists" });

            device.flag = false;
            await device.save();

            device.sendPayload(mqtt, `mode/${pinId}/${mode}`);

            const changeStream = device.flagWatcher();
            changeStream.on('change', async () => {
                changeStream.close();
                
                const pin = {
                    id: pinId,
                    mode: mode,
                    state: 0,
                    type: type,
                    desc: desc
                }

                device.pins.push(pin);
                await device.save();
    
                await Device.sendDevices(res);
            });

        } catch (err) {
            Device.sendErr(res, err);
        }
    });

    app.get('/api/pins/get/:deviceId/:pinId', async (req, res) => {
        const deviceId  = req.params.deviceId;
        const pinId     = parseInt(req.params.pinId);

        if(isNaN(pinId))
            return res.json({ success: false, message: "Pin ID is incorrect" });

        try {
            const device = await Device.findById(deviceId);
            if(!device)
                return res.json({ success: false, message: "Device not found" });
            if(!device.connected)
                return res.json({ success: false, message: "Requested device is not online" });
            if(!device.flag)
                return res.json({ success: false, message: "Device is busy" });
            
            const pin = device.pins.toObject().find(p => p.id === pinId);
            if(!pin)
                return res.json({ success: false, message: "Pin does not exists" });

            device.flag = false;
            await device.save();

            device.sendPayload(mqtt, `${pin.type}/${pinId}/r`);

            const changeStream = device.flagWatcher();
            changeStream.on('change', async () => {
                changeStream.close();
                await Device.sendDevices(res);
            });

        } catch (err) {
            Device.sendErr(res, err);
        }
    });

    app.get('/api/pins/delete/:deviceId/:pinId', async (req, res) => {
        const deviceId  = req.params.deviceId;
        const pinId     = parseInt(req.params.pinId);

        if(isNaN(pinId))
            return res.json({ success: false, message: "Pin ID is incorrect" });

        try {
            const device = await Device.findById(deviceId);
            if(!device)
                return res.json({ success: false, message: "Device not found" });
            const pin = device.pins.toObject().find(p => p.id === pinId);
            if(!pin)
                return res.json({ success: false, message: "Pin does not exists" });

            device.pins.pull(pin);
            await device.save();
            await Device.sendDevices(res);

        } catch (err) {
            Device.sendErr(res, err);
        }
    });

    app.get('/api/pins/set/:deviceId/:pinId/:state', async (req, res) => {
        const deviceId  = req.params.deviceId;
        const pinId     = parseInt(req.params.pinId);
        const state     = parseInt(req.params.state);

        if(isNaN(pinId))
            return res.json({ success: false, message: "Pin ID is incorrect" });
        if(state < 0 || state > 255 || isNaN(state))
            return res.json({ success: false, message: "State is incorrect" });

        try {
            const device = await Device.findById(deviceId);
            if(!device)
                return res.json({ success: false, message: "Device not found" });
            if(!device.connected)
                return res.json({ success: false, message: "Requested device is not online" });
            if(!device.flag)
                return res.json({ success: false, message: "Device is busy" });
            
            const pin = device.pins.toObject().find(p => p.id === pinId);
            if(!pin)
                return res.json({ success: false, message: "Pin does not exists" });

            device.flag = false;
            await device.save();

            device.sendPayload(mqtt, `${pin.type}/${pinId}/${state}`);

            const changeStream = device.flagWatcher();
            changeStream.on('change', async () => {
                changeStream.close();
                const index = device.pins.toObject().findIndex(p => p.id == pinId);
                device.pins[index].state = state;
                await device.save();
                await Device.sendDevices(res);
            });

        } catch (err) {
            Device.sendErr(res, err);
        }
    });

    app.get('/api/pins/mode/:deviceId/:pinId/:mode', async (req, res) => {
        const deviceId  = req.params.deviceId;
        const pinId     = parseInt(req.params.pinId);
        const mode      = req.params.mode;

        if(isNaN(pinId))
            return res.json({ success: false, message: "Pin ID is incorrect" });

        if(mode != "i" && mode != "o")
            return res.json({ success: false, message: "Mode is incorrect" });

            try {
                const device = await Device.findById(deviceId);
                if(!device)
                    return res.json({ success: false, message: "Device not found" });
                if(!device.connected)
                    return res.json({ success: false, message: "Requested device is not online" });
                if(!device.flag)
                    return res.json({ success: false, message: "Device is busy" });
                if(!device.pins.toObject().some(pin => pin.id === pinId))
                    return res.json({ success: false, message: "Pin does not exists" });
    
                device.flag = false;
                await device.save();

                device.sendPayload(mqtt, `mode/${pinId}/${mode}`);
    
                const changeStream = device.flagWatcher();
                changeStream.on('change', async () => {
                    changeStream.close();
                    const index = device.pins.toObject().findIndex(p => p.id == pinId);
                    device.pins[index].mode = mode;
                    await device.save();
                    await Device.sendDevices(res);
                });
    
            } catch (err) {
                Device.sendErr(res, err);
        }
    });

}