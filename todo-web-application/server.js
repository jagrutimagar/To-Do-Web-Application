const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const dataFilePath = path.join(__dirname, 'data', 'tasks.json');

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

function readTasks() {
  const raw = fs.readFileSync(dataFilePath, 'utf8');
  return JSON.parse(raw);
}

function writeTasks(tasks) {
  fs.writeFileSync(dataFilePath, JSON.stringify(tasks, null, 2));
}

app.get('/api/tasks', (req, res) => {
  try {
    const tasks = readTasks();
    res.json(tasks);
  } catch (error) {
    res.status(500).json({ error: 'Unable to read tasks.' });
  }
});

app.post('/api/tasks', (req, res) => {
  try {
    const title = String(req.body.title || '').trim();

    if (!title) {
      return res.status(400).json({ error: 'Task title is required.' });
    }

    const tasks = readTasks();
    const newTask = {
      id: Date.now(),
      title,
      completed: false,
    };

    tasks.push(newTask);
    writeTasks(tasks);
    res.status(201).json(newTask);
  } catch (error) {
    res.status(500).json({ error: 'Unable to save task.' });
  }
});

app.put('/api/tasks/:id', (req, res) => {
  try {
    const tasks = readTasks();
    const taskId = Number(req.params.id);
    const task = tasks.find((item) => item.id === taskId);

    if (!task) {
      return res.status(404).json({ error: 'Task not found.' });
    }

    if (req.body.title !== undefined) {
      const trimmedTitle = String(req.body.title).trim();
      if (!trimmedTitle) {
        return res.status(400).json({ error: 'Task title cannot be empty.' });
      }
      task.title = trimmedTitle;
    }

    if (req.body.completed !== undefined) {
      task.completed = Boolean(req.body.completed);
    }

    writeTasks(tasks);
    res.json(task);
  } catch (error) {
    res.status(500).json({ error: 'Unable to update task.' });
  }
});

app.delete('/api/tasks/:id', (req, res) => {
  try {
    const tasks = readTasks();
    const taskId = Number(req.params.id);
    const taskIndex = tasks.findIndex((item) => item.id === taskId);

    if (taskIndex === -1) {
      return res.status(404).json({ error: 'Task not found.' });
    }

    const [removedTask] = tasks.splice(taskIndex, 1);
    writeTasks(tasks);
    res.json(removedTask);
  } catch (error) {
    res.status(500).json({ error: 'Unable to delete task.' });
  }
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Todo app running at http://localhost:${PORT}`);
});
