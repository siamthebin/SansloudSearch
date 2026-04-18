import { Jimp } from 'jimp';

async function analyze() {
  const image = await Jimp.read('https://i.postimg.cc/wvWCZFWX/IMG-1050.jpg');
  console.log("Width:", image.bitmap.width, "Height:", image.bitmap.height);
  
  let darkest = [255, 255, 255];
  let lightest = [0, 0, 0];
  
  for (let y = 0; y < image.bitmap.height; y++) {
    for (let x = 0; x < image.bitmap.width; x++) {
      const hex = image.getPixelColor(x, y);
      const r = (hex >> 24) & 255;
      const g = (hex >> 16) & 255;
      const b = (hex >> 8) & 255;
      
      const brightness = (r * 299 + g * 587 + b * 114) / 1000;
      
      if (brightness < (darkest[0]*299 + darkest[1]*587 + darkest[2]*114)/1000) {
        darkest = [r, g, b];
      }
      if (brightness > (lightest[0]*299 + lightest[1]*587 + lightest[2]*114)/1000) {
        lightest = [r, g, b];
      }
    }
  }
  
  console.log("Darkest:", darkest);
  console.log("Lightest:", lightest);
}
analyze();
