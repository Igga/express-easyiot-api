const mongoose = require("mongoose");

const DeviceSchema = new mongoose.Schema({
    id: { type: String, require: true },
    clientId: { type: String, default: "" },
    name: { type: String, require: true },
    connected: { type: Boolean, default: false },
    message: { type: String, default: "" },
    lastOnline: { type: Date, default: null },
    pins: [{
        id: { type: Number, require: true },
        mode: { type: String, enum: ["o", "i"], require: true},
        state: { type: Number, min: 0, max: 255, default: 0 },
        type: {type: String, enum: ["digital", "analog"], require: true},
        desc: { type: String, require: true },
    }],
    variables: [{
        name: { type: String, require: true },
        lastResponse: { type: String, default: "" },
        responseTime: { type: Date, defualt: null }
    }],
    functions: [String],
    flag: { type: Boolean, default: false },
    splitMessage: { type: String, default: "" },
    events: [{
        name: { type: String, require: true },
        data: { type: String, require: true },
        time: { type: Date, require: true }
    }]
});

DeviceSchema.methods.flagWatcher = function() {
    return Device.watch([{
        $match: {
            "fullDocument.id": this.id,
            "fullDocument.flag": true
        }
    }], { 
        fullDocument: "updateLookup"
    });
}

DeviceSchema.methods.sendPayload = function(mqtt, payload) {
    const message = {
        topic: `${this.clientId}_in`,
        payload: payload,
        qos: 0,
        retain: false
    };
    mqtt.publish(message);
}

DeviceSchema.statics.findById = function(id) {
    return this.findOne({ id: id });
}

DeviceSchema.statics.sendErr = function(res, err) {
    console.log(err);
    res.json({
        success: false,
        message: "Critical error"
    });
};

DeviceSchema.statics.sendDevices = async function(res) {
    try {
        const result = await this.find();
        const devices = result.map(device => {
            return {
                id: device.id,
                name: device.name,
                connected: device.connected,
                message: device.message,
                lastOnline: device.lastOnline,
                pins: device.pins,
                variables: device.variables,
                functions: device.functions,
                events: device.events
            }
        });
        res.json({
            success: true,
            devices: devices
        });
    }catch (err) {
        this.sendErr(res, err);
    }
}

const Device = mongoose.model('Device', DeviceSchema);
module.exports = Device;