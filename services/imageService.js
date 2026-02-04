const https = require('https');

async function uploadToImgBB(buffer) {
    return new Promise((resolve, reject) => {
        const apiKey = process.env.IMGBB_API_KEY;
        const boundary = '----WebKitFormBoundary7MA4YWxkTrZu0gW';

        const options = {
            method: 'POST',
            hostname: 'api.imgbb.com',
            path: `/1/upload?key=${apiKey}`,
            headers: {
                'Content-Type': `multipart/form-data; boundary=${boundary}`
            }
        };

        const req = https.request(options, (res) => {
            let chunks = [];
            res.on('data', (chunk) => chunks.push(chunk));
            res.on('end', () => {
                const body = Buffer.concat(chunks).toString();
                const response = JSON.parse(body);
                if (response.success) {
                    resolve(response.data.url);
                } else {
                    reject(new Error(response.error.message || 'Upload failed'));
                }
            });
        });

        req.on('error', (err) => reject(err));

        const postData = [
            `--${boundary}`,
            'Content-Disposition: form-data; name="image"; filename="image.jpg"',
            'Content-Type: image/jpeg',
            '',
            ''
        ].join('\r\n');

        req.write(postData);
        req.write(buffer);
        req.write(`\r\n--${boundary}--\r\n`);
        req.end();
    });
}

module.exports = { uploadToImgBB };
