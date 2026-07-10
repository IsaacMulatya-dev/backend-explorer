const express = require('express');
const chalk = require('chalk');

const app = express();
const PORT = 3000;

app.get('/', (req, res) => {
    res.json({
        message: "Welcome to your first professional Express.js server!",
        framework: "Express v4",
        status: "Secure"
    });
});

app.get('/api/status', (req, res) => {
    res.json({
        uptime: process.uptime().toFixed(1) + "s",
        platform: process.platform,
        memory: process.memoryUsage().heapUsed
    });
});

app.use((req, res) => {
    res.status(404).json({
        error: "Route Not Found",
        suggestion: "Verify your endpoint parameters or check API documentation structures."
    });
});

app.listen(PORT, () => {
    console.log(chalk.green.bold("======================================="));
    console.log(chalk.cyan.bold(`🚀 Express Server listening at: http://localhost:${PORT}`));
    console.log(chalk.green.bold("======================================="));
});