const os = require('os');
const chalk = require('chalk');

console.log(chalk.blue.bold("---------------------------------------"));
console.log(chalk.green.bold("Node.js Runtime Engine Initialized!"));
console.log(chalk.blue.bold("---------------------------------------"));

const totalMemoryGB = (os.totalmem() / 1024 / 1024 / 1024).toFixed(2);
const freeMemoryGB = (os.freemem() / 1024 / 1024 / 1024).toFixed(2);

console.log(`${chalk.yellow("OS Platform:")} ${os.platform()}`);
console.log(`${chalk.yellow("CPU Architecture:")} ${os.arch()}`);
console.log(`${chalk.cyan("Total System Memory:")} ${totalMemoryGB} GB`);
console.log(`${chalk.cyan(" Free System Memory:")} ${freeMemoryGB} GB`);
console.log(chalk.blue.bold("---------------------------------------"));