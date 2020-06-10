const express        = require('express');
const mongoose       = require('mongoose');
const config         = require('./config/config');

const mosca          = require('mosca');
const mosca_settings = require('./config/mosca');

const app            = express();

app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');
    res.setHeader('Access-Control-Allow-Credentials', true);
    next();
});

mongoose.connect(config.db, config.options, err => {
    if(err) {
        console.log(err);
        process.exit(0);
    }

    const mqtt = new mosca.Server(mosca_settings);

    require('./app/mqtt')(mqtt);
    require('./app/routes')(app, mqtt);

    app.listen(config.port, () => {
        console.log(`API server is listening on port ${config.port}`);
    });
});