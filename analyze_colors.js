import { Vibrant } from 'node-vibrant/node';

async function analyze() {
  try {
    const v = new Vibrant('https://i.postimg.cc/wvWCZFWX/IMG-1050.jpg');
    const palette = await v.getPalette();
    console.log("Vibrant:", palette.Vibrant?.hex);
    console.log("Muted:", palette.Muted?.hex);
    console.log("DarkVibrant:", palette.DarkVibrant?.hex);
    console.log("DarkMuted:", palette.DarkMuted?.hex);
    console.log("LightVibrant:", palette.LightVibrant?.hex);
    console.log("LightMuted:", palette.LightMuted?.hex);
  } catch (e) {
    console.error(e);
  }
}
analyze();
