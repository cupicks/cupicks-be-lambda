const AWS = require("aws-sdk");
const sharp = require("sharp");

const s3 = new AWS.S3();

exports.handler = async (event, context, done) => {
    const Bucket = event.Records[0].s3.bucket.name;
    const Key = event.Records[0].s3.object.key;
    const filename = Key.split("/")[Key.split("/").length - 1];

    const ext = Key.split(".")[Key.split(".").length - 1];
    const format = ext === "jpg" ? "jpeg" : ext;

    try {
        const s3Object = await s3.getObject({ Bucket, Key }).promise();

        const { width } = await sharp(s3Object.Body).metadata();

        if (format === "png") { // PNG
            if (width < 600) {
                return await s3.putObject(
                    {
                        Bucket,
                        Key: `comment-resized/${filename}`,
                        Body: s3Object.Body,
                    }
                ).promise();
            } else {
                const pngResized = await sharp(s3Object.Body)
                .resize(600, 600, { fit: "inside"})
                .png({ palette: true })
                .toBuffer();

                return await s3.putObject(
                    {
                        Bucket,
                        Key: `comment-resized/${filename}`,
                        Body: pngResized,
                    }
                ).promise();
            }
        }

        if (width < 600) { // JPEG
            return await s3.putObject(
                {
                    Bucket,
                    Key: `comment-resized/${filename}`,
                    Body: s3Object.Body,
                }
                ).promise();
        } else {
            const jpegResized = await sharp(s3Object.Body)
            .resize(600, 600, { fit: "inside" })
            .toFormat(format)
            .toBuffer();

            return await s3.putObject(
                {
                    Bucket,
                    Key: `comment-resized/${filename}`,
                    Body: jpegResized,
                }
                ).promise();
        }

    } catch (err) {
        console.log(err);
        return done(err);
    } finally {
        return done(null, `comment-resized/${filename}`);
    }
};