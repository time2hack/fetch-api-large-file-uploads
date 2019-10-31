const del = require('del');
const fs = require('fs');
const uuid = require('uuid');

const cleanDirectory = function (directoryPath) {
    // delete files inside directory but not the directory itself
    del.sync([`${directoryPath}/**`, `!${directoryPath}`]);
};

const uploader = function (file, options) {
    if (!file) throw new Error('no file');
    
    const orignalname = file.hapi.filename;
    const filename = uuid.v1();
    const path = `${options.dest}${filename}-${orignalname}`;
    const fileStream = fs.createWriteStream(path);

    return new Promise((resolve, reject) => {
        file.on('error', function (err) {
            reject(err);
        });

        file.pipe(fileStream);

        file.on('end', function (err) {
            const fileDetails = {
                fieldname: file.hapi.name,
                originalname: file.hapi.filename,
                filename,
                mimetype: file.hapi.headers['content-type'],
                destination: `${options.dest}`,
                path,
                size: fs.statSync(path).size,
            }

            resolve(fileDetails);
        })
    })
}

module.exports = { cleanDirectory, uploader }
