var fs = require('fs');
var AWS = require('aws-sdk');

class S3Upload {
    constructor(credentials) {
        this.credentials = credentials || null;

        if (this.credentials == null)
            throw new Error("Invalid configuration provided to S3Upload class");


        // AWS.config.loadFromPath('./aws-config.json');


        var s3creds = this.credentials.s3;
        var endpoint = new AWS.Endpoint(s3creds.endpoint);

        this.s3 = new AWS.S3({
            endpoint,
            accessKeyId: s3creds.accessKeyId,
            secretAccessKey: s3creds.secretAccessKey,
            signatureVersion: 'v4',
        });

        this.startTime = 0;
        this.partNum = 0;
        this.partSize = 0;
        this.numPartsLeft = 0;
        this.maxUploadTries = 0;

        this.multipartMap = {
            Parts: []
        };
    }


    /*
    var multiPartParams = {
        Bucket: bucket,
        Key: fileKey,
        ACL: 'public-read',
        ContentType: 'application/javascript',
        ContentEncoding: 'gzip'
    };
    */

    upload = (multiPartParams, buffer) => {

        this.startTime = new Date();
        this.partNum = 0;
        this.partSize = 1024 * 1024 * 5; // Minimum 5MB per chunk (except the last part) http://docs.aws.amazon.com/AmazonS3/latest/API/mpUploadComplete.html
        this.numPartsLeft = Math.ceil(buffer.length / this.partSize);
        this.maxUploadTries = 3;
        this.multipartMap = {
            Parts: []
        };

        const $this = this;

        // Multipart
        console.log("Creating multipart upload for:", multiPartParams.Key);
        this.s3.createMultipartUpload(multiPartParams, function (mpErr, multipart) {
            if (mpErr) { console.log('Error!', mpErr); return; }
            console.log("Got upload ID", multipart.UploadId);

            // Grab each partSize chunk and upload it as a part
            for (var rangeStart = 0; rangeStart < buffer.length; rangeStart += $this.partSize) {
                $this.partNum++;
                var end = Math.min(rangeStart + $this.partSize, buffer.length),
                    partParams = {
                        Body: buffer.slice(rangeStart, end),
                        Bucket: multiPartParams.Bucket,
                        Key: multiPartParams.Key,
                        PartNumber: String($this.partNum),
                        UploadId: multipart.UploadId
                    };

                // Send a single part
                console.log('Uploading part: #', partParams.PartNumber, ', Range start:', rangeStart);
                $this.uploadPart(multipart, partParams);
            }
        });
    }

    completeMultipartUpload = (doneParams) => {
        const $this = this;
        this.s3.completeMultipartUpload(doneParams, function (err, data) {
            if (err) {
                console.log("An error occurred while completing the multipart upload");
                console.log(err);
            } else {
                var delta = (new Date() - $this.startTime) / 1000;
                console.log('Completed upload in', delta, 'seconds');
                console.log('Final upload data:', data);
            }
        });
    }



    uploadPart = (multipart, partParams, tryNum) => {
        tryNum = tryNum || 1;
        const $this = this;
        this.s3.uploadPart(partParams, function (multiErr, mData) {
            if (multiErr) {
                console.log('multiErr, upload part error:', multiErr);
                if (tryNum < $this.maxUploadTries) {
                    console.log('Retrying upload of part: #', partParams.PartNumber)
                    $this.uploadPart(multipart, partParams, tryNum + 1);
                } else {
                    console.log('Failed uploading part: #', partParams.PartNumber)
                }
                return;
            }
            $this.multipartMap.Parts[this.request.params.PartNumber - 1] = {
                ETag: mData.ETag,
                PartNumber: Number(this.request.params.PartNumber)
            };
            console.log("Completed part", this.request.params.PartNumber);
            console.log('mData', mData);
            if (--$this.numPartsLeft > 0) return; // complete only when all parts uploaded

            var doneParams = {
                Bucket: partParams.Bucket,
                Key: partParams.Key,
                MultipartUpload: $this.multipartMap,
                UploadId: multipart.UploadId
            };

            console.log("Completing upload...");
            $this.completeMultipartUpload(doneParams);
        });
    }

}



module.exports = S3Upload;

// Based on Glacier's example: http://docs.aws.amazon.com/AWSJavaScriptSDK/guide/examples.html#Amazon_Glacier__Multi-part_Upload



// // File
// var fileName = '5.pdf';
// var filePath = './' + fileName;
// var fileKey = fileName;
// var buffer = fs.readFileSync('./' + filePath);
// // S3 Upload options
// var bucket = 'loctest';

// Upload

// var partNum = 0;





