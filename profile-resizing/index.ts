import sharp from "sharp";
import AWS, { AWSError } from "aws-sdk";

const s3 = new AWS.S3();

export const handler = async (event, context, done) => {
    const Bucket = event.Records[0].s3.bucket.name;
    const Key = event.Records[0].s3.object.key;

    const filename = Key.split("/")[Key.split("/").length - 1];
    const ext = Key.split(".")[Key.split(".").length - 1];
    const format = ext === "jpg" ? "jpeg" : ext;

    try {
        // 이미지 버퍼
        const s3Object: AWSError | any = await s3.getObject({ Bucket, Key }).promise();

        // 리사이징 옵션
        const resizedImage = await sharp(s3Object.Body)
        .resize(400, 400, { fit: "inside" })
        .toFormat(format)
        .toBuffer();

        await s3.putObject(
            {
                Bucket,
                Key: `profile-resized/${filename}`, // 저장 경로
                Body: resizedImage,
            }
        ).promise();

        return done(null, `profile-resized/${filename}`);
    } catch (error) {
        console.error(error);
        return done(error);
    }
}