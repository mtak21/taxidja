const sharp = require('sharp');
const path = require('path');

const designDir = __dirname;
const assetsDir = path.join(__dirname, '..', 'assets');

const jobs = [
  { src: 'icon-full.svg', out: 'icon.png', size: 1024 },
  { src: 'icon-wheel-symbol.svg', out: 'android-icon-foreground.png', size: 1024 },
  { src: 'icon-background.svg', out: 'android-icon-background.png', size: 1024 },
  { src: 'icon-monochrome.svg', out: 'android-icon-monochrome.png', size: 1024 },
  { src: 'icon-wheel-symbol.svg', out: 'splash-icon.png', size: 512 },
  { src: 'icon-full.svg', out: 'favicon.png', size: 196 },
];

async function run() {
  for (const job of jobs) {
    const srcPath = path.join(designDir, job.src);
    const outPath = path.join(assetsDir, job.out);
    await sharp(srcPath, { density: 384 })
      .resize(job.size, job.size)
      .png()
      .toFile(outPath);
    console.log(`${job.out} <- ${job.src} (${job.size}x${job.size})`);
  }
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
