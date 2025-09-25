const taskInput = document.getElementById('taskText');
const taskDate = document.getElementById('taskDate');
const taskTime = document.getElementById('taskTime');
const taskPriority = document.getElementById('taskPriority');
const addBtn = document.getElementById('addBtn');
const taskListEl = document.getElementById('taskList');
const clearCompletedBtn = document.getElementById('clearCompleted');
const countActiveEl = document.getElementById('countActive');
const filterButtons = document.querySelectorAll('.filter-btn');
const searchBox = document.getElementById('searchBox');
const themeToggle = document.getElementById('themeToggle');
const taskInputArea = document.getElementById('taskInputArea');

let tasks = JSON.parse(localStorage.getItem('tasks_v2') || '[]');
let currentFilter = 'all';

function saveTasks() {
  localStorage.setItem('tasks_v2', JSON.stringify(tasks));
}

function createTask(text, date, time, priority) {
  return {
    id: Date.now().toString(),
    text: text.trim(),
    date,
    time,
    priority,
    completed: false
  };
}


function addTask() {
  if (!taskInput.value.trim()) return;
  tasks.unshift(createTask(taskInput.value, taskDate.value, taskTime.value, taskPriority.value));
  taskInput.value = '';
  taskDate.value = '';
  taskTime.value = '';
  taskPriority.value = 'medium';
  saveTasks();
  renderTasks();
}

function toggleTaskComplete(id) {
  tasks = tasks.map(t => t.id === id ? { ...t, completed: !t.completed } : t);
  saveTasks();
  renderTasks();
}

function deleteTask(id) {
  tasks = tasks.filter(t => t.id !== id);
  saveTasks();
  renderTasks();
}

function editTask(id, newText) {
  tasks = tasks.map(t => t.id === id ? { ...t, text: newText } : t);
  saveTasks();
  renderTasks();
}

function clearCompleted() {
  tasks = tasks.filter(t => !t.completed);
  saveTasks();
  renderTasks();
}

function setFilter(f) {
  currentFilter = f;
  filterButtons.forEach(b => b.classList.toggle('active', b.dataset.filter === f));

  // Show add task input only if filter is all or active, hide if completed
  if (f === 'completed') {
    taskInputArea.style.display = 'none';
  } else {
    taskInputArea.style.display = 'flex';
  }

  renderTasks();
}

function renderTasks() {
  taskListEl.innerHTML = '';

  let shown = tasks;

  if (currentFilter === 'active') {
    shown = tasks.filter(t => !t.completed);
  } else if (currentFilter === 'completed') {
    shown = tasks.filter(t => t.completed);
  }

  if (searchBox.value.trim()) {
    shown = shown.filter(t =>
      t.text.toLowerCase().includes(searchBox.value.toLowerCase())
    );
  }

  shown.forEach(task => {
    const li = document.createElement('li');
    li.className = 'task-item';
    li.draggable = true;
    li.dataset.id = task.id;

    // Checkbox
    const cb = document.createElement('input');
    cb.type = 'checkbox';
    cb.checked = task.completed;
    cb.className = 'task-checkbox';
    cb.setAttribute('aria-label', `Mark task "${task.text}" completed`);
    cb.addEventListener('click', () => toggleTaskComplete(task.id));

    // Task Text
    const span = document.createElement('div');
    span.className = 'task-text' + (task.completed ? ' completed' : '');
    span.textContent = task.text;

    // Inline Edit
    span.addEventListener('dblclick', () => {
      const input = document.createElement('input');
      input.type = 'text';
      input.value = task.text;
      input.className = 'task-text';
      input.setAttribute('aria-label', 'Edit task text');

      input.addEventListener('keydown', e => {
        if (e.key === 'Enter') {
          if (input.value.trim()) editTask(task.id, input.value);
        } else if (e.key === 'Escape') {
          renderTasks();
        }
      });

      input.addEventListener('blur', () => renderTasks());
      li.replaceChild(input, span);
      input.focus();
    });

    // Metadata
    const meta = document.createElement('div');
    meta.className = 'task-meta';

    if (task.date) {
      const dateSpan = document.createElement('span');
      dateSpan.textContent = `⏰ ${task.date}`;
      meta.appendChild(dateSpan);
    }

    if (task.time) {
      const timeSpan = document.createElement('span');
      timeSpan.textContent = `🕒 ${task.time}`;
      meta.appendChild(timeSpan);
    }

    const pr = document.createElement('span');
    pr.className = `priority-${task.priority}`;
    pr.textContent = ` • ${task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}`;
    meta.appendChild(pr);

    // Actions
    const actions = document.createElement('div');
    actions.className = 'task-actions';

    const delBtn = document.createElement('button');
    delBtn.className = 'action-btn';
    delBtn.textContent = 'Delete';
    delBtn.setAttribute('aria-label', `Delete task "${task.text}"`);
    delBtn.addEventListener('click', () => deleteTask(task.id));

    actions.appendChild(delBtn);

    li.appendChild(cb);
    li.appendChild(span);
    li.appendChild(meta);
    li.appendChild(actions);

    taskListEl.appendChild(li);
  });

  countActiveEl.textContent = `${tasks.filter(t => !t.completed).length} active`;
}

// ========== Event Listeners ==========

addBtn.addEventListener('click', addTask);

taskInput.addEventListener('keydown', e => {
  if (e.key === 'Enter') addTask();
});

clearCompletedBtn.addEventListener('click', clearCompleted);

filterButtons.forEach(b =>
  b.addEventListener('click', () => setFilter(b.dataset.filter))
);

searchBox.addEventListener('input', renderTasks);

themeToggle.addEventListener('click', () => {
  document.body.classList.toggle('dark');
});

// ========== Drag and Drop Support ==========

let dragId = null;

taskListEl.addEventListener('dragstart', e => {
  dragId = e.target.dataset.id;
});

taskListEl.addEventListener('dragover', e => {
  e.preventDefault();
});

taskListEl.addEventListener('drop', e => {
  e.preventDefault();
  const targetId = e.target.closest('li')?.dataset.id;

  if (dragId && targetId && dragId !== targetId) {
    const from = tasks.findIndex(t => t.id === dragId);
    const to = tasks.findIndex(t => t.id === targetId);
    const moved = tasks.splice(from, 1)[0];
    tasks.splice(to, 0, moved);
    saveTasks();
    renderTasks();
  }
});

// ========== Initial Setup ==========

setFilter('all');
renderTasks();
