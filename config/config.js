module.exports = {
    port: 5000,
    options: {
        useUnifiedTopology: true,
        useNewUrlParser: true,
        useFindAndModify: true
    },
    db: "mongodb://127.0.0.1:27017/easyiot?replicaSet=rs0"
};