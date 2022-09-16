import sharp from "sharp";
import AWS from "aws-sdk";
import { Context, APIGatewayProxyCallback, APIGatewayEvent } from "aws-lambda";

const s3 = new AWS.S3();

export const handler = async (event: APIGatewayEvent, context: Context, done: APIGatewayProxyCallback): Promise<void> => {
    const Bucket = event.Records[0].s3.bucket.name;
    const Key = event.Records[0].s3.object.key;

    const filename = Key.split("/")[Key.split("/").length - 1];
    const ext = Key.split(".")[Key.split('.').length - 1];
    const format = ext === "jpg" ? "jpeg" : ext;

    try {
        const s3Object: any = await s3.getObject({ Bucket, Key }).promise();

        const resizedImage = await sharp(s3Object.Body)
        .resize(200, 200, { fit: "inside" })
        .toFormat(format)
        .toBuffer();

        await s3.putObject({
        Bucket,
        Key: `profile-resized/${filename}`,
        Body: resizedImage,
        }).promise();
        
        return done(null, `profile-resized/${filename}`);
    } catch (error) {
        console.error(error);
        return done(error);
    }
}

