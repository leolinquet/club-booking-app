#!/usr/bin/env node
/**
 * Generate favicon files from Android icon
 */

import sharp from 'sharp';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const sourceIcon = join(__dirname, '..', 'SportsClubNet-Logos', 'android', 'ic_launcher-web.png');
const publicDir = join(__dirname, 'public');

async function generateFavicons() {
  console.log('🎨 Generating favicon files from Android icon...\n');

  try {
    // Generate favicon.ico (32x32 for compatibility)
    await sharp(sourceIcon)
      .resize(32, 32, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .png()
      .toFile(join(publicDir, 'favicon-32x32.png'));
    console.log('✅ Generated favicon-32x32.png');

    // Generate 16x16 for older browsers
    await sharp(sourceIcon)
      .resize(16, 16, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .png()
      .toFile(join(publicDir, 'favicon-16x16.png'));
    console.log('✅ Generated favicon-16x16.png');

    // For SVG, we'll copy the 96x96 and upscale to create a clean SVG template
    console.log('✅ PNG favicons ready');
    console.log('\n📝 Note: For favicon.ico, you can use an online converter or keep the PNG');
    console.log('   Modern browsers support PNG favicons directly.');
    
  } catch (error) {
    console.error('❌ Error generating favicons:', error.message);
    process.exit(1);
  }
}

generateFavicons();
