const devices   = require('./devices');
const pins      = require('./pins');
const variables = require('./variables');
const functions = require('./functions');

module.exports = function(app, mqtt) {
    devices(app);
    functions(app, mqtt);
    pins(app, mqtt);
    variables(app, mqtt);
};