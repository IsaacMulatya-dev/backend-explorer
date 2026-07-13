const express = require('express');
const chalk = require('chalk');
const goalsRouter = require('./routes/goals');

const app = express();
const PORT = 3000;

app.use(express.json());
app.use('/api/goals', goalsRouter);

app.use((req, res) => {
    res.status(404).json({ error: "Route Not Found" });
});

app.listen(PORT, () => {
    console.log(chalk.green.bold("======================================="));
    console.log(chalk.cyan.bold(`Modular Engine listening at: http://localhost:${PORT}`));
    console.log(chalk.green.bold("======================================="));
});