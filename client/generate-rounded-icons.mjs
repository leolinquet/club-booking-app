#!/usr/bin/env node
/**
 * Generate iOS-style rounded square app icons
 * This creates icons with the iOS rounded corner aesthetic
 * 
 * Usage:
 *   npm install sharp (if not installed)
 *   node generate-rounded-icons.mjs
 */

import sharp from 'sharp';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const sourceLogo = join(__dirname, 'public', 'sportsclubnet-high-resolution-logo.png');
const publicDir = join(__dirname, 'public');

const icons = [
  { name: 'icon-512.png', size: 512, purpose: 'Android/PWA large icon' },
  { name: 'icon-192.png', size: 192, purpose: 'Android/PWA small icon' },
  { name: 'apple-touch-icon.png', size: 180, purpose: 'iOS homescreen icon' }
];

/**
 * Generate SVG for iOS-style rounded square with proper corner radius
 * iOS uses approximately 22.37% corner radius (114/512 for 512px icons)
 */
function createRoundedSquareMask(size) {
  const cornerRadius = Math.round(size * 0.2237); // iOS standard ~22.37%
  
  return Buffer.from(`
    <svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#0ea5e9;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#0284c7;stop-opacity:1" />
        </linearGradient>
      </defs>
      <rect width="${size}" height="${size}" rx="${cornerRadius}" ry="${cornerRadius}" fill="url(#bg)"/>
    </svg>
  `);
}

async function generateIcon(icon) {
  const outputPath = join(publicDir, icon.name);
  const padding = Math.floor(icon.size * 0.15); // 15% padding for breathing room
  const logoSize = icon.size - (padding * 2);
  
  try {
    // Create the rounded square background
    const background = await sharp(createRoundedSquareMask(icon.size))
      .png()
      .toBuffer();
    
    // Resize and prepare the logo
    const logo = await sharp(sourceLogo)
      .resize(logoSize, logoSize, {
        fit: 'contain',
        background: { r: 0, g: 0, b: 0, alpha: 0 }
      })
      .toBuffer();
    
    // Composite logo on top of rounded background
    await sharp(background)
      .composite([{
        input: logo,
        top: padding,
        left: padding
      }])
      .png()
      .toFile(outputPath);
    
    console.log(`✅ Generated ${icon.name} (${icon.size}×${icon.size}) - ${icon.purpose}`);
  } catch (error) {
    console.error(`❌ Failed to generate ${icon.name}:`, error.message);
    throw error;
  }
}

async function main() {
  console.log('🎨 Generating iOS-style rounded square icons...\n');
  
  try {
    for (const icon of icons) {
      await generateIcon(icon);
    }
    
    console.log('\n✨ All rounded icons generated successfully!');
    console.log('\n📱 Features:');
    console.log('   • iOS-style rounded corners (22.37% radius)');
    console.log('   • Blue gradient background (#0ea5e9 → #0284c7)');
    console.log('   • Logo centered with 15% padding');
    console.log('   • Optimized for homescreen display');
    console.log('\n🔧 Next steps:');
    console.log('   1. Run: node update-manifest-for-rounded-icons.mjs');
    console.log('   2. Or manually update manifest.webmanifest and index.html');
    
  } catch (error) {
    console.error('\n❌ Icon generation failed:', error.message);
    console.log('\n💡 Alternative: Use the browser-based tool instead:');
    console.log('   Open: http://localhost:5173/generate-rounded-icons-browser.html');
    process.exit(1);
  }
}

main();
