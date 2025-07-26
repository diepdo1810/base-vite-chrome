import sharp from 'sharp';
import fs from 'fs-extra';
import path from 'path';

// Helper function để resolve đường dẫn
function r(relativePath) {
  return path.resolve(process.cwd(), relativePath);
}

async function convertSvgToPng() {
  try {
    // Đọc file SVG
    const svgBuffer = await fs.readFile(r('extension/assets/icon.svg'));
    
    // Convert SVG sang PNG với kích thước 512x512
    const pngBuffer = await sharp(svgBuffer)
      .resize(512, 512)
      .png()
      .toBuffer();
    
    // Ghi file PNG
    await fs.writeFile(r('extension/assets/icon-512.png'), pngBuffer);
    
    console.log('✅ Icon đã được convert thành công từ SVG sang PNG!');
  } catch (error) {
    console.error('❌ Lỗi khi convert icon:', error);
  }
}

convertSvgToPng(); 