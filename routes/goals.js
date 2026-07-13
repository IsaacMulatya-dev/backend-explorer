const express = require('express');
const chalk = require('chalk');

const router = express.Router();
let mockGoals = [
    { id: 1, title: "Master HTML & CSS layouts perfectly", completed: true },
    { id: 2, title: "Learn how to use JavaScript for interactivity", completed: true },
    { id: 3, title: "Deploy a live portfolio site to the web", completed: true }
];

router.get('/', (req, res) => {
    res.json(mockGoals);
});

router.post('/', (req, res) => {
    const { title } = req.body;
    if (!title || title.trim() === "") {
        return res.status(400).json({ error: "Validation Failed", message: "Title is required." });
    }
    const newGoal = { id: mockGoals.length + 1, title: title.trim(), completed: false };
    mockGoals.push(newGoal);
    res.status(201).json(newGoal);
});

router.put('/:id', (req, res) => {
    const goalId = parseInt(req.params.id, 10);
    const targetGoal = mockGoals.find(goal => goal.id === goalId);

    if (!targetGoal) {
        return res.status(404).json({ error: "Record Missing", message: "Cannot find target to update." });
    }

    const { title, completed } = req.body;
    if (title !== undefined) targetGoal.title = title.trim();
    if (completed !== undefined) targetGoal.completed = Boolean(completed);

    res.json({ message: "Update successful", updatedRecord: targetGoal });
});

router.delete('/:id', (req, res) => {
    const goalId = parseInt(req.params.id, 10);
    const initialLength = mockGoals.length;
    
    mockGoals = mockGoals.filter(goal => goal.id !== goalId);

    if (mockGoals.length === initialLength) {
        return res.status(404).json({ error: "Record Missing", message: "Cannot find target to delete." });
    }

    res.json({ message: `Resource with ID ${goalId} permanently purged.` });
});

module.exports = router;