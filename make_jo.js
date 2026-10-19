const fs = require('fs');
const b64 = fs.readFileSync('JO.jpg').toString('base64');
fs.writeFileSync('js/jo_data.js', 'window.JO_DATA_URL = "data:image/jpeg;base64,' + b64 + '";\n');
console.log('Successfully wrote js/jo_data.js, length:', b64.length);
