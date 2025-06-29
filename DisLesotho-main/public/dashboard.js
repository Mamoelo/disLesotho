//dashboard.js 
const loadedCSS = new Set();
const loadedJS  = new Set();

function unloadAssets() {
  // Remove all dynamically injected CSS
  for (let href of Array.from(loadedCSS)) {
    const link = document.querySelector(`link[data-dynamic][href="${href}"]`);
    if (link) link.remove();
    loadedCSS.delete(href);
  }

  // Remove all dynamically injected JS
  for (let src of Array.from(loadedJS)) {
    const script = document.querySelector(`script[data-dynamic][src="${src}"]`);
    if (script) script.remove();
    loadedJS.delete(src);
  }
}

function loadCSS(href) {
  if (loadedCSS.has(href)) return Promise.resolve();
  return new Promise(resolve => {
    const link = document.createElement('link');
    link.rel  = 'stylesheet';
    link.href = href;
    link.setAttribute('data-dynamic', '');
    link.onload = () => {
      loadedCSS.add(href);
      resolve();
    };
    document.head.appendChild(link);
  });
}

function loadJS(src) {
  if (loadedJS.has(src)) return Promise.resolve();
  return new Promise(resolve => {
    const script = document.createElement('script');
    script.src = src;
    script.setAttribute('data-dynamic', '');
    script.onload = () => {
      loadedJS.add(src);
      resolve();
    };
    document.body.appendChild(script);
  });
}

async function showPanel(htmlUrl, cssUrls = [], jsUrls = []) {
  // 1) unload everything
  unloadAssets();

  // 2) fetch & inject the HTML
  const resp = await fetch(htmlUrl);
  const text = await resp.text();
  const wrapper = `<div id="wrapper">${text}</div>`;
  const doc = new DOMParser().parseFromString(wrapper, 'text/html');
  const headerEl = doc.querySelector('#wrapper header')?.outerHTML || '';
  const mainEl   = doc.querySelector('#wrapper .main-content')?.outerHTML || doc.querySelector('#wrapper .container')?.outerHTML || '';
  loadContent(headerEl + mainEl);

  // 3) load only the CSS & JS needed for this panel
  await Promise.all ([
    ...cssUrls.map(loadCSS),
    ...jsUrls.map(loadJS)
  ]);
  // if (cssUrl) promises.push(loadCSS(cssUrl));
  // if (jsUrl)  promises.push(loadJS(jsUrl));
  // await Promise.all(promises);

  // now your panel is styled and scripted just right
}

function loadContent(html) {
  const dyn = document.getElementById('dynamic-content');
  dyn.innerHTML = html;
  dyn.classList.remove('hidden');
}

function injectScriptOnce(src) {
  if (document.querySelector(`script[src="${src}"]`)) return;
  const s = document.createElement('script');
  s.src = src;
  document.body.appendChild(s);
}

const stream = document.getElementById("stream");

stream.addEventListener("click", () => {
    window.location.href = "/public/live.html";
  });

// Manage admins click handler
document.getElementById('admin-management').onclick = e => {
  e.preventDefault();
  // await loadIcons();
  showPanel(
    '/public/manageAdmins.html',
    ['/public/manageAdmins.css'],
    ['/public/manageAdmins.js']
  );
};

// Update content click handler
document.getElementById('update-content').onclick = e => {
  e.preventDefault();
  // await loadIcons();
  showPanel(
    '/public/uploadForm.html',
    [
      'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css',
      '/public/uploadStyle.css'
    ],
    [
      'https://cdnjs.cloudflare.com/ajax/libs/jquery/3.6.0/jquery.min.js',
      '/public/uploadFormscript.js'  
    ]
    
  );
};

// Live streaming click handler
// document.getElementById('stream').onclick = e => {
//   e.preventDefault();
//   injectPage(
//     '/public/live.html',
//     '/public/live.css',
//     '/public/live.js'
//   );
// };

// Dashboard link (if you add one)
const WELCOME_HTML = `
  <!-- Page header -->
  <header class="main-header">
    <div class="header-left">
      <button class="menu-toggle" aria-label="Toggle Sidebar">☰</button>
      <h1>Admin Dashboard</h1>
    </div>
    <div class="header-right">
      <input type="text" class="search-input" placeholder="Search…" />
      <button class="roles-btn">Roles ▾</button>
      <div class="profile-dropdown">
        <img src="https://via.placeholder.com/32" alt="Profile" class="profile-avatar" />
        <span id="admin-username"></span>
      </div>
    </div>
  </header>

  <!-- Main content area -->
  <div class="content-area">
    <div id="welcome-content">
      <h2>Welcome, <span id="admin-username-display"></span>!</h2>
      <p>Your role: <span id="admin-role-display"></span></p>
    </div>
  </div>
`;

// wire up your “home” button
document.getElementById('dashboard-link').onclick = e => {
  e.preventDefault();
  loadContent(WELCOME_HTML);

  // re‐populate the spans from localStorage
  document.getElementById('admin-username-display').textContent = 
    localStorage.getItem('username') || 'Admin';
  document.getElementById('admin-role-display').textContent = 
    localStorage.getItem('roleName') || 'N/A';
};