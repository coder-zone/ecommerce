const aws = require('aws-sdk');
const fs = require('fs');
require('dotenv').config();

aws.config.update({
    secretAccessKey: process.env.secretAccessKey,
    accessKeyId: process.env.accessKeyId
    //   region: 'Asia Pacific(Mumbai)'
});

// created s3 instance
const s3 = new aws.S3();


module.exports = function () {
    this.uploadImage = async (base64, customerId) => {
        return new Promise((resolve, reject) => {
            var imgData = base64
            // condition starts here
            var base64data = imgData.split(",");
            // let type = extname(imgData);
            const type = imgData.split(";")[0].split("/")[1];

            buf = Buffer.from(
                base64.replace(/^data:image\/\w+;base64,/, ""),
                "base64"
            );
            var params = {
                Bucket: "udhyogini-media",
                Key:
                    "assets/profile/Image/" + customerId +
                    Date.now() +
                    "." +
                    type,
                Body: buf,
                ContentEncoding: "base64",
                ContentType: `image/${type}`,
            };
            s3.upload(params, function (err, data) {
                if (err) {
                    // throw err;
                    resolve({
                        success: false
                    });
                } else {
                    resolve({
                        success: true,
                        url: data.Location
                    });
                }

                console.log(`File uploaded successfully. ${data}`);
            });
        })
    };

    this.uploadblog = async (base64) => {
        return new Promise((resolve, reject) => {
            var imgData = base64
            // condition starts here
            var base64data = imgData.split(",");
            // let type = extname(imgData);
            const type = imgData.split(";")[0].split("/")[1];

            buf = Buffer.from(
                base64.replace(/^data:image\/\w+;base64,/, ""),
                "base64"
            );
            var params = {
                Bucket: "udhyogini-media",
                Key:
                    "assets/blog-banner/" +
                    Date.now() +
                    "." +
                    type,
                Body: buf,
                ContentEncoding: "base64",
                ContentType: `image/${type}`,
            };
            s3.upload(params, function (err, data) {
                if (err) {
                    // throw err;
                    resolve({
                        success: false
                    });
                } else {
                    resolve({
                        success: true,
                        url: data.Location
                    });
                }

                console.log(`File uploaded successfully. ${data}`);
            });
        })
    };

    this.urlReWrite = async function (url, obj) {

        var returnUrl = url;
        try {
            const parts = url.split('/');
            const fileName = parts[parts.length - 1];

            const destfile = 'upload/images/' + fileName;
            const options = {
                url: url,
                dest: destfile // will be saved to /path/to/dest/photo.jpg
            }
            const response = await download.image(options);
            console.log(response);

            let awsRes = await this.uploadFileToAWS(destfile, fileName, obj);
            console.log(awsRes);
            if (awsRes.success) {
                returnUrl = awsRes.url;
            }

            try {
                var physicalPath = process.cwd() + "/" + destfile;
                fs.unlink(physicalPath, function (err2) {
                    if (err2) {
                        console.error(err2);
                    }
                    console.log('File has been Deleted');
                });
            } catch (err1) {
                console.log(err1);
            }

        } catch (err) {
            console.log(err);
        }
        return returnUrl;
    }
    this.uploadPDFFileToAWS = async function (fileName, actualFileName, loan_id) {
        return new Promise((resolve, reject) => {

            // actualFileName =  "Credin/" + obj.disbdate + "/" + obj.loan_id + "/" + obj.type + "/" + actualFileName;
            // Read content from the file
            actualFileName = "loans/" + loan_id + "/" + actualFileName;
            const fileContent = fs.readFileSync(fileName);

            // Setting up S3 upload parameters
            const params = {
                Bucket: 'credinfiles',
                Key: actualFileName, // File name you want to  save as in S3
                Body: fileContent
            };

            const s3 = new AWS.S3({
                accessKeyId: "AKIAJM4AHSZUWEAI5IDA",
                secretAccessKey: "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"
            });

            // Uploading files to the bucket
            s3.upload(params, function (err, data) {
                if (err) {
                    // throw err;
                    resolve({
                        success: false
                    });
                } else {
                    resolve({
                        success: true,
                        url: data.Location
                    });
                }

                // console.log(`File uploaded successfully. ${data.Location}`);
            });
        })
    };

}