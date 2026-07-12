const express = require('express');
const chalk = require('chalk');

const app = express();
const PORT = 3000;

app.use(express.json());

let mockGoals = [
    { id: 1, title: "Master HTML & CSS layouts perfectly", completed: true },
    { id: 2, title: "Learn how to use JavaScript for interactivity", completed: true },
    { id: 3, title: "Deploy a live portfolio site to the web", completed: true }
];

app.get('/api/goals', (req, res) => {
    res.json(mockGoals);
});

app.post('/api/goals', (req, res) => {
    const { title } = req.body;
    if (!title || title.trim() === "") {
        return res.status(400).json({ error: "Validation Failed", message: "Title is required." });
    }
    const newGoal = { id: mockGoals.length + 1, title: title.trim(), completed: false };
    mockGoals.push(newGoal);
    res.status(201).json(newGoal);
});

app.put('/api/goals/:id', (req, res) => {
    const goalId = parseInt(req.params.id, 10);
    console.log(chalk.yellow(`[API Update]: Direct modification request for ID: ${goalId}`));

    const targetGoal = mockGoals.find(goal => goal.id === goalId);

    if (!targetGoal) {
        return res.status(404).json({ error: "Record Missing", message: "Cannot find target to update." });
    }

    const { title, completed } = req.body;
    
    if (title !== undefined) targetGoal.title = title.trim();
    if (completed !== undefined) targetGoal.completed = Boolean(completed);

    res.json({ message: "Update successful", updatedRecord: targetGoal });
});

app.delete('/api/goals/:id', (req, res) => {
    const goalId = parseInt(req.params.id, 10);
    console.log(chalk.red(`[API Delete]: Deletion sequence initialized for ID: ${goalId}`));

    const initialLength = mockGoals.length;
    
    mockGoals = mockGoals.filter(goal => goal.id !== goalId);

    if (mockGoals.length === initialLength) {
        return res.status(404).json({ error: "Record Missing", message: "Cannot find target to delete." });
    }

    res.json({ message: `Resource with ID ${goalId} permanently purged from system archives.` });
});

app.listen(PORT, () => {
    console.log(chalk.green.bold("======================================="));
    console.log(chalk.cyan.bold(`Full CRUD Engine online at: http://localhost:${PORT}`));
    console.log(chalk.green.bold("======================================="));
});