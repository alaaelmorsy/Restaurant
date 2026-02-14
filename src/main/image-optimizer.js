const sharp = require('sharp');

const THUMBNAIL_SIZE = 150;
const THUMBNAIL_QUALITY = 80;

async function optimizeProductImage(imageBuffer, mime = 'image/png') {
  try {
    if (!imageBuffer || imageBuffer.length === 0) {
      return null;
    }

    const sharpInstance = sharp(imageBuffer);
    const metadata = await sharpInstance.metadata();
    
    if (!metadata || !metadata.width || !metadata.height) {
      return { base64: imageBuffer.toString('base64'), mime };
    }

    const isSmallImage = metadata.width <= THUMBNAIL_SIZE && metadata.height <= THUMBNAIL_SIZE;
    
    if (isSmallImage) {
      return { base64: imageBuffer.toString('base64'), mime };
    }

    const optimizedBuffer = await sharpInstance
      .resize(THUMBNAIL_SIZE, THUMBNAIL_SIZE, {
        fit: 'cover',
        position: 'center'
      })
      .webp({ quality: THUMBNAIL_QUALITY })
      .toBuffer();

    return {
      base64: optimizedBuffer.toString('base64'),
      mime: 'image/webp'
    };
  } catch (error) {
    console.error('Image optimization error:', error.message);
    return imageBuffer ? { base64: imageBuffer.toString('base64'), mime } : null;
  }
}

async function optimizeBatch(items) {
  const optimized = {};
  
  await Promise.all(
    Object.entries(items).map(async ([id, data]) => {
      if (data && data.buffer) {
        const result = await optimizeProductImage(data.buffer, data.mime);
        if (result) {
          optimized[id] = result;
        }
      } else if (data && data.base64) {
        const buffer = Buffer.from(data.base64, 'base64');
        const result = await optimizeProductImage(buffer, data.mime);
        if (result) {
          optimized[id] = result;
        }
      }
    })
  );
  
  return optimized;
}

module.exports = {
  optimizeProductImage,
  optimizeBatch,
  THUMBNAIL_SIZE,
  THUMBNAIL_QUALITY
};
