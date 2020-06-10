const deviceConnected = require('./connected');
const deviceDisconnected = require('./disconnected');
const devicePublish = require('./publish');

module.exports = function(mqtt, db) {
  deviceConnected(mqtt, db);
  deviceDisconnected(mqtt, db);
  devicePublish(mqtt, db);

  mqtt.on('ready', () => {
      console.log('Mosca mqtt server in up and ready');
  })
};