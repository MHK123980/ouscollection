const fs = require('fs');
const path = require('path');

const processFile = (filePath) => {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;
    content = content.replace(/res\.redirect\((['"`].*?['"`])\)/g, (match, url) => {
        modified = true;
        return `const io = req.app.get('io'); if (io) { io.emit('site_updated'); } ${match}`;
    });
    if (modified) {
        fs.writeFileSync(filePath, content);
        console.log('Updated ' + path.basename(filePath));
    }
};

processFile('controllers/productController.js');
processFile('controllers/adminController.js');
processFile('controllers/shopController.js');
