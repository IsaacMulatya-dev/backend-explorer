const express = require('express');
const chalk = require('chalk');

const app = express();
const PORT = 3000;
app.use(express.json());

const mockGoals = [
    { id: 1, title: "Master HTML & CSS layouts perfectly", completed: true },
    { id: 2, title: "Learn how to use JavaScript for interactivity", completed: true },
    { id: 3, title: "Deploy a live portfolio site to the web", completed: true }
];

app.get('/api/goals', (req, res) => {
    console.log(chalk.blue("[API Read]: Fetching entire goals collection."));
    res.json(mockGoals);
});

app.post('/api/goals', (req, res) => {
    console.log(chalk.green("[API Create]: Incoming POST request detected."));
    
    const { title } = req.body;

    if (!title || title.trim() === "") {
        return res.status(400).json({
            error: "Validation Failed",
            message: "The property 'title' is strictly required and cannot be empty."
        });
    }
    const newGoal = {
        id: mockGoals.length + 1,
        title: title.trim(),
        completed: false
    };

    mockGoals.push(newGoal);

    res.status(201).json(newGoal);
});

app.listen(PORT, () => {
    console.log(chalk.green.bold("======================================="));
    console.log(chalk.cyan.bold(`Secure Data Engine active at: http://localhost:${PORT}`));
    console.log(chalk.green.bold("======================================="));
});