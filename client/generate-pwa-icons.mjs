#!/usr/bin/env node
/**
 * Generate PWA icons from the high-resolution logo
 * 
 * Usage:
 *   npm install sharp (if not installed)
 *   node generate-pwa-icons.mjs
 */

import sharp from 'sharp';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const sourceLogo = join(__dirname, 'public', 'sportsclubnet-high-resolution-logo.png');
const publicDir = join(__dirname, 'public');

const icons = [
  { name: 'web-app-manifest-192x192.png', size: 192, circular: true, purpose: 'PWA manifest icon' },
  { name: 'web-app-manifest-512x512.png', size: 512, circular: true, purpose: 'PWA manifest icon' },
  { name: 'apple-touch-icon.png', size: 180, circular: false, purpose: 'iOS homescreen icon' }
];

async function generateIcon(icon) {
  const outputPath = join(publicDir, icon.name);
  const padding = Math.floor(icon.size * 0.1); // 10% padding
  const logoSize = icon.size - (padding * 2);
  
  try {
    let pipeline = sharp(sourceLogo)
      .resize(logoSize, logoSize, {
        fit: 'contain',
        background: { r: 0, g: 0, b: 0, alpha: 0 }
      });
    
    if (icon.circular) {
      // Create circular mask
      const circle = Buffer.from(
        `<svg width="${icon.size}" height="${icon.size}">
          <circle cx="${icon.size / 2}" cy="${icon.size / 2}" r="${icon.size / 2}" fill="white"/>
        </svg>`
      );
      
      // Extend with padding and apply circular mask
      pipeline = pipeline
        .extend({
          top: padding,
          bottom: padding,
          left: padding,
          right: padding,
          background: { r: 0, g: 0, b: 0, alpha: 0 }
        })
        .composite([{
          input: circle,
          blend: 'dest-in'
        }]);
    } else {
      // Just add padding for non-circular icons
      pipeline = pipeline.extend({
        top: padding,
        bottom: padding,
        left: padding,
        right: padding,
        background: { r: 0, g: 0, b: 0, alpha: 0 }
      });
    }
    
    await pipeline.png().toFile(outputPath);
    console.log(`✅ Generated ${icon.name} (${icon.size}×${icon.size}) - ${icon.purpose}`);
  } catch (error) {
    console.error(`❌ Failed to generate ${icon.name}:`, error.message);
    throw error;
  }
}

async function main() {
  console.log('🎨 Generating PWA icons from sportsclubnet-high-resolution-logo.png...\n');
  
  try {
    for (const icon of icons) {
      await generateIcon(icon);
    }
    
    console.log('\n✨ All icons generated successfully!');
    console.log('\n📱 Your app will now display the correct logo when added to homescreen on:');
    console.log('   • iOS devices (apple-touch-icon.png)');
    console.log('   • Android devices (web-app-manifest icons)');
    console.log('   • Desktop PWA installations');
    
  } catch (error) {
    console.error('\n❌ Icon generation failed:', error.message);
    process.exit(1);
  }
}

main();
