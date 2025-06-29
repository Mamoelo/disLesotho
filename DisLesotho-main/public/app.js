// app.js
document.addEventListener('DOMContentLoaded', () => {
  const loginForm = document.getElementById('login-form');
  const dashboard = document.getElementById('dashboard');
  const errorMessage = document.getElementById('error-message');
  const logoutBtn = document.getElementById('logout-btn');
  const adminUsername = document.getElementById('admin-username');
  const adminRole = document.getElementById('admin-role');

  const usernameInput = document.getElementById('username');
  const passwordInput = document.getElementById('password');

  // Check if already logged in
  const token = localStorage.getItem('token');
  if (token) {
    verifyToken(token);
  }

  // Login form submission
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    errorMessage.textContent = '';
    
    const username = usernameInput.value;
    const password = passwordInput.value;
    
    try {
      const response = await fetch('http://localhost:3000/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        // Handle specific error cases
        let errorMsg = 'Login failed';
        if (data.error === 'INVALID_USERNAME') {
          errorMsg = 'Username not found';
          usernameInput.focus();
        } else if (data.error === 'INVALID_PASSWORD') {
          errorMsg = 'Incorrect password';
          passwordInput.focus();
        } else if (data.error === 'ACCOUNT_INACTIVE') {
          errorMsg = 'Account is inactive';
        }
        throw new Error(errorMsg);
      }
      
      // Save token and admin info
      localStorage.setItem('token', data.token);
      localStorage.setItem('adminId', data.adminId);
      localStorage.setItem('username', data.username);

      localStorage.setItem('roleId', data.role.id);
      localStorage.setItem('roleName', data.role.name);
      localStorage.setItem('canAddContent',    data.role.canAdd);
      localStorage.setItem('canRemoveContent', data.role.canRemove);
      localStorage.setItem('canStartStream',   data.role.canStartStream);
      localStorage.setItem('canSetSchedule',   data.role.canSchedule);
      localStorage.setItem('canManageUsers',   data.role.canManageUsers);
      
      // Show dashboard
      showDashboard(data.username, data.role.name);
      
    } catch (error) {
      errorMessage.textContent = error.message;
    }
  });

  // Logout button
  logoutBtn.addEventListener('click', () => {
    localStorage.removeItem('token');
    localStorage.removeItem('adminId');
    localStorage.removeItem('username');
    localStorage.removeItem('roleId');
    localStorage.removeItem('roleName');
    localStorage.removeItem('canAddContent');
    localStorage.removeItem('canRemoveContent');
    localStorage.removeItem('canStartStream');
    localStorage.removeItem('canSetSchedule');
    localStorage.removeItem('canManageUsers');
    location.reload();
  });

  function showDashboard(username, roleName) {
    document.body.classList.remove('login-body');
    document.body.classList.add('dashboard-body');
    loginForm.parentElement.classList.add('hidden');
    dashboard.classList.remove('hidden');
    adminUsername.textContent = username;
    adminRole.textContent = roleName;

    applyPermissionFilters();
  }

  function applyPermissionFilters() {
    // Parse each stored permission flag (defaults to false if missing)
    const canAdd       = JSON.parse(localStorage.getItem('canAddContent')    || 'false');
    const canRemove    = JSON.parse(localStorage.getItem('canRemoveContent') || 'false');
    const canStream    = JSON.parse(localStorage.getItem('canStartStream')   || 'false');
    const canSchedule  = JSON.parse(localStorage.getItem('canSetSchedule')   || 'false');
    const canManage    = JSON.parse(localStorage.getItem('canManageUsers')   || 'false');

    // Utility to hide a nav-item <li> given any inner element’s ID
    function hideNavItemByInnerId(innerId) {
      const anchor = document.getElementById(innerId);
      if (anchor) {
        const li = anchor.closest('.nav-item');
        if (li) li.classList.add('hidden');
      }
    }

    // 1) "Update content" (id="update-content") only if canAdd OR canRemove
    if (!(canAdd || canRemove)) {
      hideNavItemByInnerId('update-content');
    }

    // 2) "Add event" (id="add-event") only if canAdd
    if (!canAdd) {
      hideNavItemByInnerId('add-event');
    }

    // 3) "Live streaming" (id="stream") only if canStream
    if (!canStream) {
      hideNavItemByInnerId('stream');
    }

    // 4) "Statistics" (id="Statistics") only if canSchedule
    //    (e.g. scheduling-related metrics or calendar access)
    if (!canSchedule) {
      hideNavItemByInnerId('Statistics');
    }
    if (!canManage) {
      hideNavItemByInnerId('admin-management');
    }
  }

  async function verifyToken(token) {
    try {
      const response = await fetch('http://localhost:3000/dashboard', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Session expired');
      }
      
      // Get username from local storage or API
      const username = localStorage.getItem('username') || 'Admin';
      const roleName = localStorage.getItem('roleName') || 'N/A';
      showDashboard(username, roleName);
      
    } catch (error) {
      localStorage.removeItem('token');
      errorMessage.textContent = 'Session expired. Please login again.';
    }
  }
});