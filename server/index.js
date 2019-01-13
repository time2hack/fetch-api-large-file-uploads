'use strict';

const fs = require('fs');
const Hapi = require('hapi');
const Boom = require('boom');
const Loki = require('lokijs');

const {
    imageFilter, loadCollection, cleanFolder,
    uploader
} = require('./utils');

// setup
const DB_NAME = 'db.json';
const COLLECTION_NAME = 'images';
const UPLOAD_PATH = 'uploads';
const fileOptions = { dest: `${UPLOAD_PATH}/`, fileFilter: imageFilter };
const db = new Loki(`${UPLOAD_PATH}/${DB_NAME}`, { persistenceMethod: 'fs' });

// optional: clean all data before start
// cleanFolder(UPLOAD_PATH);
if (!fs.existsSync(UPLOAD_PATH)) fs.mkdirSync(UPLOAD_PATH);

const server = Hapi.server({
    port: process.env.PORT || 3000,
    host: 'localhost',
    routes: {
        cors: true
    }
});


const init = async () => {

    await server.register(require('inert'));

    server.route({
        method: 'POST',
        path: '/upload',
        options: {
            payload: {
                output: 'stream',
                allow: 'multipart/form-data'
            }
        },
        handler: async function (request, h) {
            try {
                const data = request.payload;
                const file = data['heavyFile'];

                const fileDetails = await uploader(file, fileOptions);
                const col = await loadCollection(COLLECTION_NAME, db);
                const result = col.insert(fileDetails);

                db.saveDatabase();
                return { id: result.$loki, fileName: result.filename, originalName: result.originalname };
            } catch (err) {
                return Boom.badRequest(err.message, err);
            }
        }
    });
    server.route({
        method: 'GET',
        path: '/{param*}',
        handler: {
            directory: {
                path: './client'
            }
        }
    });

    await server.start();
    console.log(`Server running at: ${server.info.uri}`);
};

process.on('unhandledRejection', (err) => {

    console.log(err);
    process.exit(1);
});

init();
