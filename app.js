(function () {
  'use strict';

  // Elements
  const root = document.documentElement;
  const input = document.getElementById('taskInput');
  const addBtn = document.getElementById('addBtn');
  const list = document.getElementById('taskList');
  const filterButtons = Array.from(document.querySelectorAll('.chip'));
  const clearCompletedBtn = document.getElementById('clearCompleted');
  const themeToggle = document.getElementById('themeToggle');

  // State
  let tasks = [];
  let filter = 'all'; // 'all' | 'active' | 'completed'

  // Storage helpers
  const STORAGE_KEY = 'todo.tasks.v1';
  const THEME_KEY = 'todo.theme.v1';
  function save() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
  }
  function load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      tasks = raw ? JSON.parse(raw) : [];
    } catch (_) {
      tasks = [];
    }
  }

  // Theme
  function applyTheme(theme) {
    root.setAttribute('data-theme', theme);
  }
  function loadTheme() {
    const saved = localStorage.getItem(THEME_KEY);
    const prefersLight = window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches;
    const theme = saved || (prefersLight ? 'light' : 'dark');
    applyTheme(theme);
  }
  function toggleTheme() {
    const current = root.getAttribute('data-theme') || 'dark';
    const next = current === 'dark' ? 'light' : 'dark';
    applyTheme(next);
    localStorage.setItem(THEME_KEY, next);
  }


  // Utils
  function uid() { return Math.random().toString(36).slice(2, 9); }

  function createTaskItem(task, entering = false) {
    const li = document.createElement('li');
    li.className = 'task' + (task.completed ? ' completed' : '');
    li.dataset.id = task.id;
    if (entering) li.classList.add('enter');

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.checked = task.completed;
    checkbox.addEventListener('change', () => toggleCompleted(task.id, checkbox.checked));

    const content = document.createElement('div');
    content.className = 'content';

    const text = document.createElement('span');
    text.className = 'text';
    text.textContent = task.text;

    content.appendChild(text);

    const actions = document.createElement('div');
    actions.className = 'actions';

    const editBtn = document.createElement('button');
    editBtn.className = 'icon-btn edit';
    editBtn.title = 'Edit';
    editBtn.setAttribute('aria-label', 'Edit task');
    editBtn.textContent = '✏️';
    editBtn.addEventListener('click', () => beginEdit(task.id));

    const delBtn = document.createElement('button');
    delBtn.className = 'icon-btn delete';
    delBtn.title = 'Delete';
    delBtn.setAttribute('aria-label', 'Delete task');
    delBtn.textContent = '🗑️';
    delBtn.addEventListener('click', () => removeTask(task.id));

    actions.appendChild(editBtn);
    actions.appendChild(delBtn);

    li.appendChild(checkbox);
    li.appendChild(content);
    li.appendChild(actions);

    return li;
  }

  function render() {
    list.innerHTML = '';
    const filtered = tasks.filter(t =>
      filter === 'all' ? true : filter === 'active' ? !t.completed : t.completed
    );
    const frag = document.createDocumentFragment();
    filtered.forEach(t => frag.appendChild(createTaskItem(t)));
    list.appendChild(frag);
  }

  function addTask(text) {
    const value = text.trim();
    if (!value) return;
    const task = { id: uid(), text: value, completed: false, createdAt: Date.now() };
    tasks.push(task);
    save();
    // Render only the new item for fade animation
    const li = createTaskItem(task, true);
    // insert at the end
    list.appendChild(li);
    input.value = '';
  }

  function toggleCompleted(id, done) {
    const t = tasks.find(x => x.id === id);
    if (!t) return;
    t.completed = !!done;
    save();
    render();
  }

  function beginEdit(id) {
    const li = list.querySelector(`[data-id="${id}"]`);
    if (!li) return;
    if (li.classList.contains('editing')) return;
    li.classList.add('editing');

    const content = li.querySelector('.content');
    const oldText = content.querySelector('.text').textContent;

    const inputEl = document.createElement('input');
    inputEl.className = 'edit-input';
    inputEl.type = 'text';
    inputEl.value = oldText;

    // Replace content child
    content.innerHTML = '';
    content.appendChild(inputEl);
    inputEl.focus();
    inputEl.setSelectionRange(oldText.length, oldText.length);

    function commit(saveChange) {
      const t = tasks.find(x => x.id === id);
      if (!t) return;
      if (saveChange) {
        const nv = inputEl.value.trim();
        if (nv) t.text = nv; else return cancel();
        save();
      }
      render();
    }
    function cancel() { render(); }

    inputEl.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') commit(true);
      else if (e.key === 'Escape') cancel();
    });

    // Replace actions with Save/Cancel temporarily
    const actions = li.querySelector('.actions');
    const oldActions = actions.innerHTML;
    actions.innerHTML = '';

    const saveBtn = document.createElement('button');
    saveBtn.className = 'icon-btn edit';
    saveBtn.textContent = '💾';
    saveBtn.title = 'Save';
    saveBtn.addEventListener('click', () => commit(true));

    const cancelBtn = document.createElement('button');
    cancelBtn.className = 'icon-btn';
    cancelBtn.textContent = '↩️';
    cancelBtn.title = 'Cancel';
    cancelBtn.addEventListener('click', cancel);

    actions.appendChild(saveBtn);
    actions.appendChild(cancelBtn);
  }

  function removeTask(id) {
    const idx = tasks.findIndex(x => x.id === id);
    if (idx === -1) return;
    tasks.splice(idx, 1);
    save();
    render();
  }

  function clearCompleted() {
    tasks = tasks.filter(t => !t.completed);
    save();
    render();
  }

  // Events
  addBtn.addEventListener('click', () => addTask(input.value));
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') addTask(input.value);
  });

  filterButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      filterButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      filter = btn.dataset.filter;
      render();
    });
  });

  clearCompletedBtn.addEventListener('click', clearCompleted);
  themeToggle.addEventListener('click', toggleTheme);
  

  // Init
  loadTheme();
  load();
  render();
  
})();
