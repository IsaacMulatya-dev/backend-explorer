
const os = require('os');

console.log("---------------------------------------");
console.log("Node.js Runtime Engine Initialized!");
console.log("---------------------------------------");
const totalMemoryGB = (os.totalmem() / 1024 / 1024 / 1024).toFixed(2);
const freeMemoryGB = (os.freemem() / 1024 / 1024 / 1024).toFixed(2);

console.log(`OS Platform: ${os.platform()}`);
console.log(` CPU Architecture: ${os.arch()}`);
console.log(`Total System Memory: ${totalMemoryGB} GB`);
console.log(`Free System Memory: ${freeMemoryGB} GB`);
console.log("---------------------------------------");