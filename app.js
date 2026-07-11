const express = require('express');
const chalk = require('chalk');

const app = express();
const PORT = 3000;

const mockGoals = [
    { id: 1, title: "Master HTML & CSS layouts perfectly", completed: true },
    { id: 2, title: "Learn how to use JavaScript for interactivity", completed: true },
    { id: 3, title: "Deploy a live portfolio site to the web", completed: true },
    { id: 4, title: "Master React & Core Hooks", completed: true },
    { id: 5, title: "Architect production Express.js Backends", completed: false }
];

app.get('/', (req, res) => {
    res.json({ message: "Welcome to the Tech Goals Production API Engine." });
});

app.get('/api/goals', (req, res) => {
    console.log(chalk.blue("[API Read]: Fetching entire goals collection."));
    res.json(mockGoals);
});

app.get('/api/goals/:id', (req, res) => {

    const goalId = parseInt(req.params.id, 10);
    console.log(chalk.yellow(`[API Read]: Searching for resource ID: ${goalId}`));


    const foundGoal = mockGoals.find(goal => goal.id === goalId);

    if (!foundGoal) {
        return res.status(404).json({ 
            error: "Resource Not Found", 
            message: `Goal record with ID ${goalId} does not exist in our system archives.` 
        });
    }

    res.json(foundGoal);
});

app.listen(PORT, () => {
    console.log(chalk.green.bold("======================================="));
    console.log(chalk.cyan.bold(`REST API Live at: http://localhost:${PORT}`));
    console.log(chalk.green.bold("======================================="));
});