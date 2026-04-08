const fs = require('fs');
const { Jimp } = require('jimp');

async function extract() {
    console.log('Reading image...');
    let image;
    try {
        image = await Jimp.read('public/assets/images/screenshot.png');
    } catch(e) {
        // older jimp style fallback
        const j = require('jimp');
        image = await j.read('public/assets/images/screenshot.png');
    }
    
    // Some JIMP versions use image.bitmap, some use image.width
    const bitmap = image.bitmap || image;
    const width = bitmap.width;
    const height = bitmap.height;
    
    console.log('Image dimensions', width, height);

    // Get background color from top-left pixel
    const bgInt = image.getPixelColor(1, 1);
    
    // To handle different Jimp versions
    let bgRgb = {r: 255, g: 255, b: 255, a: 255};
    if (typeof Jimp !== 'undefined' && Jimp.intToRGBA) bgRgb = Jimp.intToRGBA(bgInt);
    else if (image.constructor && image.constructor.intToRGBA) bgRgb = image.constructor.intToRGBA(bgInt);
    else bgRgb = { r: (bgInt >> 24) & 255, g: (bgInt >> 16) & 255, b: (bgInt >> 8) & 255, a: bgInt & 255 };

    console.log('Background Color:', bgRgb);

    const isBg = (x, y) => {
        const cInt = image.getPixelColor(x, y);
        let c = { r: (cInt >> 24) & 255, g: (cInt >> 16) & 255, b: (cInt >> 8) & 255 };
        // some jimp versions might be returning A B G R, wait Let's use simple heuristic:
        // just check if pixel is exactly the same color
        return cInt === bgInt; // check exact match first? 
        // With jpeg artifacts, there could be slight variances, but screenshots are usually PNG and exact match works.
    };

    // We will do a simple scanning approach to build rectangles for fast extraction
    const threshold = 10;
    const isBgFuzzy = (x,y) => {
        const cInt = image.getPixelColor(x, y);
        let r = (cInt >> 24) & 255;
        let g = (cInt >> 16) & 255;
        let b = (cInt >> 8) & 255;
        return Math.abs(r - bgRgb.r) < threshold && 
               Math.abs(g - bgRgb.g) < threshold && 
               Math.abs(b - bgRgb.b) < threshold;
    };

    const visited = new Uint8Array(width * height);
    const objects = [];

    let q = new Int32Array(width * height * 2);

    for (let y = 0; y < height; y+=2) { // step by 2 for speed
        for (let x = 0; x < width; x+=2) {
            let idx = y * width + x;
            if (visited[idx]) continue;
            
            if (isBgFuzzy(x, y)) {
                visited[idx] = 1;
                continue;
            }

            // Start BFS
            let qHead = 0;
            let qTail = 0;
            q[qTail++] = x;
            q[qTail++] = y;
            visited[idx] = 1;
            
            let minX = x, maxX = x, minY = y, maxY = y;

            while(qHead < qTail) {
                const cx = q[qHead++];
                const cy = q[qHead++];
                
                if (cx < minX) minX = cx;
                if (cx > maxX) maxX = cx;
                if (cy < minY) minY = cy;
                if (cy > maxY) maxY = cy;

                const dirs = [[1,0],[-1,0],[0,1],[0,-1],[1,1],[-1,-1],[-1,1],[1,-1]];
                for(let i=0; i<dirs.length; i++) {
                    const nx = cx + dirs[i][0];
                    const ny = cy + dirs[i][1];
                    if (nx >=0 && nx < width && ny >= 0 && ny < height) {
                        let nidx = ny * width + nx;
                        if (!visited[nidx]) {
                            visited[nidx] = 1;
                            if (!isBgFuzzy(nx, ny)) {
                                q[qTail++] = nx;
                                q[qTail++] = ny;
                            }
                        }
                    }
                }
            }

            const oWidth = maxX - minX + 1;
            const oHeight = maxY - minY + 1;
            if (oWidth > 80 && oHeight > 80 && oWidth < width * 0.9) { // large enough, but not entire screen
                objects.push({minX, maxX, minY, maxY, oWidth, oHeight});
            }
        }
    }
    
    console.log('Found objects:', objects.length);
    objects.sort((a,b) => (b.oWidth*b.oHeight) - (a.oWidth*a.oHeight));

    for (let i = 0; i < objects.length; i++) {
        const obj = objects[i];
        console.log(`Object ${i}: x=${obj.minX}, y=${obj.minY}, w=${obj.oWidth}, h=${obj.oHeight}`);
        
        let clone = image.clone();
        clone.crop({ x: obj.minX, y: obj.minY, w: obj.oWidth, h: obj.oHeight });
        
        // Output coordinates to file for our layout script
        fs.appendFileSync('objects.json', JSON.stringify({id: i, ...obj}) + '\n');

        // Make exact bg color transparent
        for(let yy=0; yy<obj.oHeight; yy++){
            for(let xx=0; xx<obj.oWidth; xx++){
                if (isBgFuzzy(obj.minX + xx, obj.minY + yy)) {
                    clone.setPixelColor(0x00000000, xx, yy);
                }
            }
        }

        await clone.write(`public/assets/images/object_${i}.png`);
    }
    console.log('Done!');
}

extract().catch(console.error);
