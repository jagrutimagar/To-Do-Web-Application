const taskForm = document.getElementById('task-form');
const taskInput = document.getElementById('task-input');
const taskList = document.getElementById('task-list');

function createTextTask(task) {
  const text = document.createElement('span');
  text.className = 'task-text';
  text.textContent = task.title;
  return text;
}

function createTaskEditor(task) {
  const form = document.createElement('form');
  form.className = 'task-editor-form';
  form.dataset.id = task.id;

  const input = document.createElement('input');
  input.type = 'text';
  input.className = 'task-editor-input';
  input.value = task.title;
  input.setAttribute('aria-label', `Edit task ${task.title}`);
  input.required = true;

  const actions = document.createElement('div');
  actions.className = 'task-editor-actions';

  const saveButton = document.createElement('button');
  saveButton.type = 'submit';
  saveButton.className = 'task-save-btn';
  saveButton.textContent = 'Save';

  const cancelButton = document.createElement('button');
  cancelButton.type = 'button';
  cancelButton.className = 'task-cancel-btn';
  cancelButton.textContent = 'Cancel';
  cancelButton.dataset.action = 'cancel';
  cancelButton.dataset.id = task.id;

  actions.appendChild(saveButton);
  actions.appendChild(cancelButton);
  form.appendChild(input);
  form.appendChild(actions);
  return form;
}

async function fetchTasks() {
  const response = await fetch('/api/tasks');
  const tasks = await response.json();
  renderTasks(tasks);
}

function renderTasks(tasks) {
  taskList.innerHTML = '';

  if (!tasks.length) {
    const emptyState = document.createElement('li');
    emptyState.className = 'empty-state';
    emptyState.textContent = 'No tasks yet. Add one above.';
    taskList.appendChild(emptyState);
    return;
  }

  tasks.forEach((task) => {
    const item = document.createElement('li');
    item.className = `task-item ${task.completed ? 'completed' : ''}`;
    item.dataset.id = task.id;

    const main = document.createElement('div');
    main.className = 'task-main';

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.checked = task.completed;
    checkbox.className = 'task-checkbox';
    checkbox.setAttribute('aria-label', `Mark ${task.title} as complete`);
    checkbox.dataset.id = task.id;
    checkbox.dataset.action = 'toggle';

    main.appendChild(checkbox);
    main.appendChild(createTextTask(task));

    const actions = document.createElement('div');
    actions.className = 'task-actions';

    const editButton = document.createElement('button');
    editButton.type = 'button';
    editButton.className = 'edit-btn';
    editButton.textContent = 'Edit';
    editButton.dataset.id = task.id;
    editButton.dataset.action = 'edit';

    const deleteButton = document.createElement('button');
    deleteButton.type = 'button';
    deleteButton.className = 'delete-btn';
    deleteButton.textContent = 'Delete';
    deleteButton.dataset.id = task.id;
    deleteButton.dataset.action = 'delete';

    actions.appendChild(editButton);
    actions.appendChild(deleteButton);
    item.appendChild(main);
    item.appendChild(actions);
    taskList.appendChild(item);
  });
}

async function updateTask(id, updates) {
  const response = await fetch(`/api/tasks/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(updates),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Unable to update task.');
  }
}

taskForm.addEventListener('submit', async (event) => {
  event.preventDefault();

  const title = taskInput.value.trim();
  if (!title) {
    taskInput.focus();
    return;
  }

  const response = await fetch('/api/tasks', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ title }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    alert(errorData.error || 'Something went wrong while adding the task.');
    return;
  }

  taskInput.value = '';
  fetchTasks();
});

taskList.addEventListener('click', async (event) => {
  const target = event.target;
  if (!(target instanceof HTMLElement)) return;

  const button = target.closest('button');
  if (!button) return;

  const { action, id } = button.dataset;
  if (!action || !id) return;

  if (action === 'delete') {
    await fetch(`/api/tasks/${id}`, { method: 'DELETE' });
    fetchTasks();
    return;
  }

  if (action === 'edit') {
    const item = button.closest('.task-item');
    const main = item.querySelector('.task-main');
    const text = item.querySelector('.task-text');
    const taskId = Number(id);
    const form = createTaskEditor({ id: taskId, title: text.textContent.trim() });
    main.replaceChild(form, text);
    button.disabled = true;
    item.querySelector('.delete-btn').disabled = true;
    return;
  }

  if (action === 'cancel') {
    fetchTasks();
  }
});

taskList.addEventListener('submit', async (event) => {
  const form = event.target.closest('.task-editor-form');
  if (!form) return;

  event.preventDefault();

  const taskId = Number(form.dataset.id);
  const input = form.querySelector('.task-editor-input');
  const nextTitle = input.value.trim();

  if (!nextTitle) {
    input.focus();
    return;
  }

  try {
    await updateTask(taskId, { title: nextTitle });
    fetchTasks();
  } catch (error) {
    alert(error.message);
  }
});

taskList.addEventListener('change', async (event) => {
  const target = event.target;
  if (!(target instanceof HTMLInputElement)) return;

  const { action, id } = target.dataset;
  if (action !== 'toggle' || !id) return;

  try {
    await updateTask(Number(id), { completed: target.checked });
    fetchTasks();
  } catch (error) {
    alert(error.message);
  }
});

fetchTasks();
