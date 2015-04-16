'use strict';

var uuidGen = require('node-uuid'),
    async = require('async'),
    crypto = require('crypto'),
    csv = require('fast-csv'),
    fs = require('fs'),
    sampleSize = 10000000, // 10 million
    buckets = 1000,
    results = {};

var csvStream = csv.createWriteStream({headers: true}),
    writableStream = fs.createWriteStream('test.csv');

writableStream.on('finish', function() {
    console.log('done writing csv');
})

function parse(uuid) {
    var id = uuid.split('-').pop();
    return parseInt(id, 16)
}

function findModulo(uuidParse) {
    return uuidParse % 1000;
}

function placeInBucket(modulo) {
    if (!results[modulo]) {
        results[modulo] = 0;
    }
    results[modulo] += 1;
}

function progressReport(count, sampleSize, iterationSlice) {
    if (count % (sampleSize / iterationSlice) === 0) {
        console.log((count / sampleSize * 100).toFixed(2) + '%');
    }
}

function statisticsReport() {
    var keys = Object.keys(results);
    csvStream.pipe(writableStream);
    keys.forEach(function (key) {
        csvStream.write({bucket: key, count: results[key]})
    });
    csvStream.end();
    console.log(results);
}

function main() {
    var count = 0,
        uuid,
        uuidParse,
        modulo;

    async.whilst(function() {
        return count < sampleSize;
    }, function(callback) {
        setImmediate(function() {
            count++;
            uuid = uuidGen.v4();
            uuidParse = parse(uuid);
            modulo = findModulo(uuidParse);
            placeInBucket(modulo);
            progressReport(count, sampleSize, 10);
            callback();
        });
    }, function(err) {
        if (err) {
            console.error(err);
        } else {
            statisticsReport();
        }

    });
}

main();