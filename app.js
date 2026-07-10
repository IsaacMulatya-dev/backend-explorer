const http = require('http');
const chalk = require('chalk');

const PORT = 3000;
const HOST = 'localhost';

const server = http.createServer((req, res) => {
    console.log(chalk.magenta(`📡 [Request Incoming]: ${req.method} -> Path: ${req.url}`));
    if (req.url === '/' && req.method === 'GET') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ 
            gateway: "Welcome to the Systems API Root Hub",
            endpoints_available: ["/api/status", "/api/data"]
        }));
    } 

    else if (req.url === '/api/status' && req.method === 'GET') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ 
            uptime: process.uptime().toFixed(2) + " seconds",
            memoryUsage: process.memoryUsage().heapUsed,
            db_connection: "Securely Emulated"
        }));
    } 
    else {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ 
            error: "Resource Not Found",
            message: "The requested path does not map to a recognized security socket endpoint."
        }));
    }
});

server.listen(PORT, HOST, () => {
    console.log(chalk.green.bold("======================================="));
    console.log(chalk.cyan.bold(`🚀 Multi-Route Active: http://${HOST}:${PORT}`));
    console.log(chalk.green.bold("======================================="));
});