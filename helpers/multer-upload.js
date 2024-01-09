const aws = require('aws-sdk');
const multer = require('multer');
const multerS3 = require('multer-s3');
const fs = require('fs');
require("../models/product");
const mongoose = require("mongoose");



var PRODUCT = mongoose.model("product");


aws.config.update({
    secretAccessKey: process.env.secretAccessKey,
    accessKeyId: process.env.accessKeyId
    //   region: 'Asia Pacific(Mumbai)'
});

// created s3 instance
const s3 = new aws.S3();




const uploadBulkImg = multer({
    storage: multerS3({
        s3: s3,
        bucket: 'udhyogini-media',
        key: function (req, file, cb) {
            req.file = Date.now() + file.originalname;
            var full_path =
                'assets/product/Image/' +
                Date.now() +
                '.' +
                file.originalname.split('.').pop();
            // img.push(full_path)
            cb(null, full_path);
            console.log(full_path)
        }
    })
});

const uploadS3 = multer({
    storage: multerS3({
        s3: s3,
        acl: 'public-read',
        bucket: 'udhyogini-media',
        metadata: (req, file, callBack) => {
            callBack(null, { fieldName: file.fieldname })
        },
        key: (req, file, callBack) => {
            req.file = Date.now() + file.originalname;
            var full_path =
                'assets/product/Image/' + req.body.productId + '/' +
                Date.now() +
                '.' +
                file.originalname.split('.').pop();
            callBack(null, full_path)
        }
    }),
    // limits: { fileSize: 2000000 }, // In bytes: 2000000 bytes = 2 MB
    // fileFilter: function (req, file, cb) {
    //     checkFileType(file, cb);
    // }
}).array('productImg', 10);

const banner = multer({
    storage: multerS3({
        s3: s3,
        acl: 'public-read',
        bucket: 'udhyogini-media',
        metadata: (req, file, callBack) => {
            callBack(null, { fieldName: file.fieldname })
        },
        key: (req, file, callBack) => {
            req.file = Date.now() + file.originalname;
            var full_path =
                'assets/banner/' + '/' +
                Date.now() +
                '.' +
                file.originalname.split('.').pop();
            callBack(null, full_path)
        }
    }),
    // limits: { fileSize: 2000000 }, // In bytes: 2000000 bytes = 2 MB
    // fileFilter: function (req, file, cb) {
    //     checkFileType(file, cb);
    // }
}).array('banner', 5);

module.exports = { uploadBulkImg, uploadS3,banner };