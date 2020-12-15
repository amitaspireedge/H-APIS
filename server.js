'use strict';

const Hapi = require('hapi');
const ENV = process.env.NODE_ENV || 'develop';
const configFile = './config/environments/' + ENV + '.json';
const AuthBearer = require('hapi-auth-bearer-token');
global.CONFIG = require(configFile);
global.ROOT_PATH = __dirname;
global.EXCEPTIONS = require('./config/exceptions');
global.APIS = require('./config/apis');

const server = Hapi.server({
    port: global.CONFIG['server'].port,
    host: '0.0.0.0',
    "routes": {
        "cors": {
            origin: ["*"],
            headers: ["Accept", "Content-Type"],
            additionalHeaders: ["X-Requested-With"]
        }
    }
});

const Mongo = require('./config/mongodb').Mongo;
const AccessLog = require('./lib/access_log');
const Logger = require('./lib/logger');
const Routes = require('./api/routes');
new Routes(server);
server.events.on('response', function (request) {
    // Logger.logAPI(request);

});
const init = async () => {
    await server.register(AuthBearer);
    if(ENV!=='develop'){
        server.auth.strategy('simple', 'bearer-access-token', {
            allowQueryToken: true,              // optional, false by default
            validate: async (request, token, h) => {

                // here is where you validate your token
                // comparing with token from your database for example
                const isValid = token === '1234';

                const credentials = { token };
                const artifacts = { test: 'info' };

                return { isValid, credentials, artifacts };
            }
        });
        server.auth.default('simple');
    }
    server.route({
        method: 'GET',
        path: '/',
        handler: async function (request, h) {
            return { info: 'success!' };
        }
    });

    await server.start();

    return server;

    //await server.start();
    //console.log(`Server running at: ${server.info.uri}`);
};

process.on('unhandledRejection', (err) => {

    console.log(err);
    process.exit(1);
});

init().then((server) => console.log(`Server listening on ${server.info.uri}`))
    .catch(err => {

        console.error(err);
        process.exit(1);
    })
