const { S3Client, PutObjectCommand, DeleteObjectCommand, HeadBucketCommand, CreateBucketCommand, GetObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const { v4: uuidv4 } = require('uuid');

const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

const BUCKET = process.env.AWS_S3_BUCKET || 'roz-food-images';

async function checkOrCreateBucket() {
  try {
    await s3Client.send(new HeadBucketCommand({ Bucket: BUCKET }));
    console.log(`S3 Bucket '${BUCKET}' is ready.`);
  } catch (error) {
    if (error.name === 'NotFound' || error.$metadata?.httpStatusCode === 404) {
      console.log(`Bucket '${BUCKET}' not found. Attempting to create...`);
      try {
        await s3Client.send(new CreateBucketCommand({ Bucket: BUCKET }));
        console.log(`S3 Bucket '${BUCKET}' created successfully.`);
      } catch (createError) {
        console.error('Failed to create S3 bucket.', createError.message);
      }
    } else {
      console.error('Error checking S3 bucket:', error.message);
    }
  }
}

async function uploadImage(buffer, mimeType) {
  const ext = mimeType === 'image/png' ? 'png' : 'jpg';
  const key = `food-images/${uuidv4()}.${ext}`;

  await s3Client.send(
    new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      Body: buffer,
      ContentType: mimeType,
    })
  );

  return key;
}

async function getImageUrl(key) {
  if (!key) return null;
  if (key.startsWith('http')) return key; // Already a URL (probably external or already signed)

  const command = new GetObjectCommand({
    Bucket: BUCKET,
    Key: key,
  });

  // Expire in 24 hours
  return await getSignedUrl(s3Client, command, { expiresIn: 3600 * 24 });
}

async function deleteImage(imageUrl) {
  try {
    let key = imageUrl;
    if (imageUrl.startsWith('http')) {
      const url = new URL(imageUrl);
      // Key is the part after the bucket name in virtual-hosted style or path style
      // This is a bit tricky, but usually the last part
      key = url.pathname.slice(1);
    }
    
    await s3Client.send(
      new DeleteObjectCommand({
        Bucket: BUCKET,
        Key: key,
      })
    );
  } catch (err) {
    console.error('Failed to delete image from S3:', err.message);
  }
}

module.exports = { uploadImage, deleteImage, getImageUrl, checkOrCreateBucket };
