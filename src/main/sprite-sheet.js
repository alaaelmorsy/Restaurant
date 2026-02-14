const { ipcMain } = require('electron');
const { getPool, DB_NAME } = require('../db/connection');

// Sprite Sheet Generator
// دمج جميع صور المنتجات في ملف واحد لتقليل عدد الطلبات

let __spriteSheetCache = null;
let __spriteSheetGenerating = false;

module.exports = function init() {
  // Generate sprite sheet on demand
  ipcMain.handle('sprite:generate', async () => {
    if (__spriteSheetGenerating) {
      return { ok: false, error: 'جاري التوليد بالفعل' };
    }
    
    if (__spriteSheetCache) {
      return { ok: true, cached: true, data: __spriteSheetCache };
    }
    
    __spriteSheetGenerating = true;
    
    try {
      const pool = await getPool();
      const conn = await pool.getConnection();
      
      try {
        await conn.query(`USE \`${DB_NAME}\``);
        
        // Fetch all product images
        const [rows] = await conn.query(
          `SELECT id, image_blob, image_mime 
           FROM products 
           WHERE image_blob IS NOT NULL 
           AND is_active = 1 
           ORDER BY id`
        );
        
        if (!rows || rows.length === 0) {
          return { ok: true, empty: true };
        }
        
        // Canvas-like approach: create sprite sheet in-memory
        // For simplicity, we'll arrange images in a grid
        const itemWidth = 100;  // عرض كل صورة في sprite
        const itemHeight = 100; // ارتفاع كل صورة في sprite
        const cols = Math.ceil(Math.sqrt(rows.length)); // عدد الأعمدة
        const spriteWidth = cols * itemWidth;
        const spriteHeight = Math.ceil(rows.length / cols) * itemHeight;
        
        // Build positions map
        const positions = {};
        rows.forEach((row, idx) => {
          const col = idx % cols;
          const rowNum = Math.floor(idx / cols);
          positions[row.id] = {
            x: col * itemWidth,
            y: rowNum * itemHeight,
            width: itemWidth,
            height: itemHeight
          };
        });
        
        const { optimizeProductImage } = require('./image-optimizer');
        
        const images = {};
        await Promise.all(rows.map(async (row) => {
          if (row.image_blob) {
            const imageBuffer = Buffer.from(row.image_blob);
            const optimized = await optimizeProductImage(imageBuffer, row.image_mime || 'image/png');
            if (optimized) {
              images[row.id] = optimized;
            }
          }
        }));
        
        __spriteSheetCache = {
          positions,
          images,
          width: spriteWidth,
          height: spriteHeight,
          itemWidth,
          itemHeight
        };
        
        return { ok: true, data: __spriteSheetCache };
        
      } finally {
        conn.release();
      }
    } catch (e) {
      console.error('Sprite sheet generation error:', e);
      return { ok: false, error: 'فشل توليد sprite sheet' };
    } finally {
      __spriteSheetGenerating = false;
    }
  });
  
  // Get sprite sheet data (cached)
  ipcMain.handle('sprite:get', async () => {
    if (__spriteSheetCache) {
      return { ok: true, data: __spriteSheetCache };
    }
    return { ok: false, error: 'Sprite sheet not generated yet' };
  });
  
  // Clear sprite sheet cache (force regeneration)
  ipcMain.handle('sprite:clear', async () => {
    __spriteSheetCache = null;
    return { ok: true };
  });
};
