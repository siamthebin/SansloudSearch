import getPixels from 'get-pixels';

getPixels("https://i.postimg.cc/wvWCZFWX/IMG-1050.jpg", function(err, pixels) {
  if(err) {
    console.log("Bad image path")
    return
  }
  console.log("Dimensions:", pixels.shape);
});
