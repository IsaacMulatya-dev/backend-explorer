const http = require('http');
const chalk = require('chalk');

const PORT = 3000;
const HOST = 'localhost';
const server = http.createServer((req, res) => {
    console.log(chalk.magenta(`📡 [Incoming Request]: ${req.method} path request to: ${req.url}`));

    res.writeHead(200, { 'Content-Type': 'application/json' });

    const serverPayload = {
        status: "Online",
        message: "Secure backend engine connection established successfully!",
        environment: "Node.js Core HTTP System",
        timestamp: new Date().toISOString()
    };
    res.end(JSON.stringify(serverPayload));
});

server.listen(PORT, HOST, () => {
    console.log(chalk.green.bold("======================================="));
    console.log(chalk.cyan.bold(`Server is active and listening for traffic!`));
    console.log(chalk.yellow(`Access endpoint at: http://${HOST}:${PORT}`));
    console.log(chalk.green.bold("======================================="));
    console.log(chalk.gray("Press Ctrl + C to stop the server process\n"));
});