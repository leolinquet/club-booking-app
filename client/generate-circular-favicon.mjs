/**
 * Generate circular favicon from logo
 * Run with: node generate-circular-favicon.mjs
 * Requires: npm install sharp
 */

import sharp from 'sharp';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

async function generateCircularFavicon(inputPath, outputPath, size) {
  try {
    // Create a circular mask
    const circleBuffer = Buffer.from(
      `<svg width="${size}" height="${size}">
        <circle cx="${size/2}" cy="${size/2}" r="${size/2}" fill="white"/>
      </svg>`
    );

    // Process the image
    await sharp(inputPath)
      .resize(size, size, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 0 } })
      .composite([{
        input: circleBuffer,
        blend: 'dest-in'
      }])
      .png()
      .toFile(outputPath);

    console.log(`✅ Generated: ${outputPath}`);
  } catch (error) {
    console.error(`❌ Error generating ${outputPath}:`, error.message);
  }
}

async function main() {
  const logoPath = join(__dirname, 'public', 'sportsclubnet-high-resolution-logo.png');
  const outputDir = join(__dirname, 'public');

  console.log('🎨 Generating circular favicon versions...\n');

  // Generate different sizes
  await generateCircularFavicon(logoPath, join(outputDir, 'favicon-circular-512.png'), 512);
  await generateCircularFavicon(logoPath, join(outputDir, 'favicon-circular-192.png'), 192);
  await generateCircularFavicon(logoPath, join(outputDir, 'favicon-circular-32.png'), 32);
  await generateCircularFavicon(logoPath, join(outputDir, 'favicon-circular-16.png'), 16);

  console.log('\n✨ All circular favicons generated successfully!');
  console.log('\nNext steps:');
  console.log('1. Check the generated files in client/public/');
  console.log('2. Update index.html to reference the new favicon');
}

main().catch(console.error);
