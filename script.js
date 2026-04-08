  const STORAGE = 'sleek-notes';
  const THEME_KEY = 'sleek-notes-theme';

  let notes = JSON.parse(localStorage.getItem(STORAGE) || '[]');
  let activeId = null;
  let saveTimer = null;

  /* ================= SAVE ================= */
  function save() {
    localStorage.setItem(STORAGE, JSON.stringify(notes));
  }

  /* ================= UUID ================= */
  function uuid() {
    return crypto.randomUUID();
  }

  /* ================= ESCAPE HTML ================= */
  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  /* ================= THEME ================= */
  function applyTheme(dark) {
    document.documentElement.classList.toggle('dark', dark);
    localStorage.setItem(THEME_KEY, dark ? 'dark' : 'light');

    const btn = document.getElementById('themeBtn');
    if (btn) btn.innerHTML = dark ? '🌞' : '🌙';
  }

  let isDark = localStorage.getItem(THEME_KEY) === 'dark';
  applyTheme(isDark);

  function toggleTheme() {
    isDark = !isDark;
    applyTheme(isDark);
  }

  /* ================= NOTES ================= */
  function newNote() {
    const now = new Date().toISOString();

    const note = {
      id: uuid(),
      title: '',
      content: '',
      createdAt: now,
      updatedAt: now,
      pinned: false
    };

    notes.unshift(note);
    activeId = note.id;

    save();
    renderList();
    renderEditor();
  }




  function toggleSidebar() {
    const sidebar = document.getElementById("sidebar");
    const overlay = document.getElementById("overlay");

    sidebar.classList.toggle("active");
    overlay.classList.toggle("active");
  }






  /* ================= DELETE ================= */
  function deleteNote(id, e) {
    if (e) e.stopPropagation();

    if (!confirm("Delete this note permanently?")) return;

    notes = notes.filter(n => n.id !== id);

    if (activeId === id) activeId = null;

    save();
    renderList();
    renderEditor();
  }

  /* ================= PIN ================= */
  function togglePin(id, e) {
    if (e) e.stopPropagation();

    const note = notes.find(n => n.id === id);
    if (note) note.pinned = !note.pinned;

    save();
    renderList();
  }

  /* ================= SELECT ================= */
  function selectNote(id) {
    activeId = id;
    renderList();
    renderEditor();
  }

  /* ================= LIST ================= */
  function renderList() {
    const input = document.getElementById('searchInput');
    const q = input ? input.value.toLowerCase() : '';

    const filtered = notes.filter(n =>
      n.title.toLowerCase().includes(q) ||
      n.content.toLowerCase().includes(q)
    );

    const sorted = [
      ...filtered.filter(n => n.pinned),
      ...filtered.filter(n => !n.pinned)
    ];

    const el = document.getElementById('notesList');
    if (!el) return;

    if (!sorted.length) {
      el.innerHTML = `<p class="empty-msg">${q ? 'No notes found' : 'No notes yet'}</p>`;
      return;
    }

    el.innerHTML = sorted.map(n => `
      <div class="note-item ${n.id === activeId ? 'active' : ''}" onclick="selectNote('${n.id}')">
        
        <div class="info">
          <div class="title">${escapeHtml(n.title || 'Untitled')}</div>
          <div class="preview">${escapeHtml((n.content || '').slice(0, 60))}</div>
          <div class="date">${new Date(n.updatedAt).toLocaleDateString()}</div>
        </div>

        <div class="actions" onclick="event.stopPropagation()">
          <button onclick="togglePin('${n.id}', event)">📌</button>
          <button onclick="deleteNote('${n.id}', event)" class="delete-btn">🗑</button>
        </div>

      </div>
    `).join('');
  }

  /* ================= EDITOR ================= */
  function renderEditor() {
    const el = document.getElementById('editorArea');
    if (!el) return;

    const note = notes.find(n => n.id === activeId);

  if (!note) {
      el.innerHTML = '<p>Select or <br> Create a note</p>';
      el.style.display = "flex";
      el.style.alignItems = "center";     // Vertical
      el.style.justifyContent = "center"; // Horizontal
      el.style.fontSize = "40px";
    
      return;
  }

    const wordCount = countWords(note.title + " " + note.content);

    el.innerHTML = `
      <div class="toolbar">
        <span id="wordCount">${wordCount} words</span>

        <div>
          <button onclick="deleteNote('${note.id}')" class="delete-btn">🗑 Delete</button>
          <button onclick="exportTxt()">Export</button>
        </div>
      </div>
    
      <input id="titleInput" class="title-input" placeholder="Title..." />

      <textarea id="contentArea" class="content-area" placeholder="Start writing..."></textarea>
    `;

    const titleInput = document.getElementById('titleInput');
    const contentArea = document.getElementById('contentArea');

    titleInput.value = note.title;
    contentArea.value = note.content;

  titleInput.oninput = () => {
    autoSave('title', titleInput.value);
    updateWordCount();
  };

  contentArea.oninput = () => {
    autoSave('content', contentArea.value);
    updateWordCount();
  };

  function updateWordCount() {
    const title = document.getElementById('titleInput').value || '';
    const content = document.getElementById('contentArea').value || '';

    const count = countWords(title + " " + content);

    const el = document.getElementById('wordCount');
    if (el) el.textContent = count + " words";
  }
  }

  /* ================= AUTOSAVE ================= */
  function autoSave(field, value) {
    const note = notes.find(n => n.id === activeId);
    if (!note) return;

    clearTimeout(saveTimer);

    saveTimer = setTimeout(() => {
      note[field] = value;
      note.updatedAt = new Date().toISOString();

      save();
      renderList();
    }, 300);
  }

  /* ================= UTIL ================= */
  function countWords(text) {
    text = text.trim();
    return text ? text.split(/\s+/).length : 0;
  }

  /* ================= EXPORT ================= */
  function exportTxt() {
    const note = notes.find(n => n.id === activeId);
    if (!note) return;

    const text = `${note.title}\n\n${note.content}`;

    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = (note.title || 'untitled') + '.txt';
    a.click();

    URL.revokeObjectURL(url);
  }

  /* ================= ABOUT MODAL ================= */
  function showAbout() {
    document.getElementById("aboutModal").classList.add("active");
  }

  function hideAbout() {
    document.getElementById("aboutModal").classList.remove("active");
  }

  /* ================= INIT ================= */
  renderList();
  renderEditor();