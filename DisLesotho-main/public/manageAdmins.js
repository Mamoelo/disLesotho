// manageAdmin.js
  function init() {
    const addAdminBtn = document.getElementById('addAdminBtn');   
    const adminsTable = document.querySelector('.admins-table tbody');
    const roleSelect = document.getElementById('adminRole');
    const recoverBtn = document.getElementById('recoverAdminsBtn');
    const deletedSection = document.getElementById('deleted-section');
    const deletedTableBody = document.getElementById('deleted-admins');

    if (!addAdminBtn || !adminsTable) {
    console.error('Required elements not found!');
    return;
    }

    // Load roles and admins
    loadRoles();
    loadAdmins();
    
    // Add new admin
    addAdminBtn.addEventListener('click', async () => {
        const username = document.getElementById('adminUsername').value;
        const password = document.getElementById('adminPassword').value;
        const email = document.getElementById('adminEmail').value;
        const fullName = document.getElementById('adminFullName').value;
        const roleId = document.getElementById('adminRole').value;
        
        try {
        const response = await fetch('http://localhost:3000/api/admins', {
            method: 'POST',
            headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({
            username,
            password,
            email,
            full_name: fullName,
            role_id: roleId
            })
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || 'Failed to create admin');
        }
        
        alert('Admin created successfully');
        clearForm();
        loadAdmins();
        } catch (error) {
        console.error('Error creating admin:', error);
        alert(`Error: ${error.message}`);
        }
    });
    
    // Load roles into dropdown
    async function loadRoles() {
        try {
            const response = await fetch('http://localhost:3000/api/roles', {
                headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Failed to load roles');
            }
            
            const roles = await response.json();
            
            // Clear existing options
            roleSelect.innerHTML = '<option value="">Select role</option>';
            
            // Add roles to dropdown
            roles.forEach(role => {
                const option = document.createElement('option');
                option.value = role.role_id;
                option.textContent = role.role_name;
                roleSelect.appendChild(option);
            });
        } catch (error) {
            console.error('Error loading roles:', error);
            alert(`Error loading roles: ${error.message}`);
        }
    }
    
    // Load admins into table
    async function loadAdmins() {
        try {
            const response = await fetch('http://localhost:3000/api/admins', {
                headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });
            
            if (!response.ok) {
              const error = await response.json();
              throw new Error(error.message || 'Failed to load admins');
            }

            const admins = await response.json();
            
            // Clear table
            adminsTable.innerHTML = '';
            
            // Add admins to table
            admins.forEach(admin => {
                const row = document.createElement('tr');
                
                row.innerHTML = `
                <td>${admin.username}</td>
                <td>${admin.email}</td>
                <td>${admin.full_name || 'N/A'}</td>
                <td>${admin.role_name}</td>
                <td class="status-${admin.status}">${admin.status.charAt(0).toUpperCase() + admin.status.slice(1)}</td>
                <td>
                    <button class="action-btn edit-btn" data-id="${admin.admin_id}">Edit</button>
                    <button class="action-btn-delete delete-btn" data-id="${admin.admin_id}">Delete</button>
                </td>
                `;
                
                adminsTable.appendChild(row);
                
                // Add event listeners
                row.querySelector('.edit-btn').addEventListener('click', () => openEditModal(admin));
                row.querySelector('.delete-btn').addEventListener('click', () => deleteAdmin(admin.admin_id));
            });
        } catch (error) {
            console.error('Error loading admins:', error);
            alert(`Error loading admins: ${error.message}`);
        }
    }

    recoverBtn.addEventListener('click', () => {
        if (deletedSection.classList.contains('hidden')) {
            loadDeletedAdmins();
            deletedSection.classList.remove('hidden');
            recoverBtn.textContent = 'Hide Deleted Admins';
        } else {
            deletedSection.classList.add('hidden');
            recoverBtn.textContent = 'Show Deleted Admins';
        }
    });
    
    // Open edit modal
    function openEditModal(admin) {
        // Create modal HTML
        const modalHTML = `
        <div class="modal" id="editModal">
            <div class="modal-content">
            <div class="modal-header">
                <h3>Edit Admin: ${admin.username}</h3>
                <button class="close-modal">&times;</button>
            </div>
            <div class="modal-body">
                <div class="form-group">
                <label>Email *</label>
                <input type="email" id="editEmail" value="${admin.email}" required>
                </div>
                <div class="form-group">
                <label>Full Name</label>
                <input type="text" id="editFullName" value="${admin.full_name || ''}">
                </div>
                <div class="form-group">
                <label>Role *</label>
                <select id="editRole">
                    ${getRoleOptions(admin.role_id)}
                </select>
                </div>
                <div class="form-group">
                <label>Status *</label>
                <select id="editStatus">
                    <option value="active" ${admin.status === 'active' ? 'selected' : ''}>Active</option>
                    <option value="suspended" ${admin.status === 'suspended' ? 'selected' : ''}>Suspended</option>
                </select>
                </div>
            </div>
            <div class="modal-footer">
                <button id="saveChangesBtn" class="btn btn-primary">Save Changes</button>
                <button class="btn btn-secondary close-modal">Cancel</button>
            </div>
            </div>
        </div>
        `;
        
        // Add modal to document
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        const modal = document.getElementById('editModal');
        
        // Add event listeners
        modal.querySelector('.close-modal').addEventListener('click', () => modal.remove());
        modal.querySelectorAll('.close-modal').forEach(btn => {
        btn.addEventListener('click', () => modal.remove());
        });
        
        modal.querySelector('#saveChangesBtn').addEventListener('click', async () => {
        await updateAdmin(admin.admin_id);
        modal.remove();
        });
    }
    
    // Generate role options for edit modal
    function getRoleOptions(currentRoleId) {
        let options = '';
        const roles = document.getElementById('adminRole').options;
        
        for (let i = 0; i < roles.length; i++) {
        if (roles[i].value) {
            options += `<option value="${roles[i].value}" ${roles[i].value == currentRoleId ? 'selected' : ''}>${roles[i].textContent}</option>`;
        }
        }
        
        return options;
    }
    
    // Update admin
    async function updateAdmin(adminId) {
        try {
        const email = document.getElementById('editEmail').value;
        const fullName = document.getElementById('editFullName').value;
        const roleId = document.getElementById('editRole').value;
        const status = document.getElementById('editStatus').value;
        
        const response = await fetch(`http://localhost:3000/api/admins/${adminId}`, {
            method: 'PUT',
            headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({
            email,
            full_name: fullName,
            role_id: roleId,
            status
            })
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || 'Failed to update admin');
        }
        
        alert('Admin updated successfully');
        loadAdmins();
        } catch (error) {
        console.error('Error updating admin:', error);
        alert(`Error: ${error.message}`);
        }
    }
    
    // Delete admin
    async function deleteAdmin(adminId) {
        if (!confirm('Are you sure you want to delete this admin?')) return;
        
        try {
            const response = await fetch(`http://localhost:3000/api/admins/${adminId}`, {
                method: 'DELETE',
                headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });
            
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.error || 'Failed to delete admin');
            }
            
            alert('Admin deleted successfully');
            loadAdmins();
        } catch (error) {
            console.error('Error deleting admin:', error);
            alert(`Error: ${error.message}`);
        }
    }

    async function loadDeletedAdmins() {
        try {
            const resp = await fetch('http://localhost:3000/api/admins/deleted', {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
            });
            if (!resp.ok) throw new Error('Failed to fetch deleted admins');
            const deleted = await resp.json();

            // Clear existing rows
            deletedTableBody.innerHTML = '';

            // Populate
            deleted.forEach(adm => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${adm.username}</td>
                <td>${adm.email}</td>
                <td>${new Date(adm.deleted_at).toLocaleString()}</td>
                <td>
                <button class="btn btn-primary restore-btn" data-id="${adm.admin_id}">
                    <i class="fas fa-undo"></i> Restore
                </button>
                </td>
            `;
            deletedTableBody.appendChild(tr);
            });
        } catch (err) {
            console.error('Error loading deleted admins:', err);
            alert(`Error: ${err.message}`);
        }
    }


    document.getElementById('recoverAdminsBtn').addEventListener('click', loadDeletedAdmins);

    document.body.addEventListener('click', async e => {
        if (e.target.closest('.restore-btn')) {
            const btn = e.target.closest('.restore-btn');
            const id  = btn.dataset.id;
            if (!confirm('Restore this admin?')) return;
            try {
            const res = await fetch(`http://localhost:3000/api/admins/${id}/restore`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
            });
            if (!res.ok) throw new Error('Failed to restore admin');
            alert('Admin restored');
            loadAdmins();        // refresh active list
            loadDeletedAdmins(); // refresh deleted list
            } catch (err) {
            console.error('Error restoring admin:', err);
            alert(`Error: ${err.message}`);
            }
        }
    });

    
    // Clear form
    function clearForm() {
        document.getElementById('adminUsername').value = '';
        document.getElementById('adminPassword').value = '';
        document.getElementById('adminEmail').value = '';
        document.getElementById('adminFullName').value = '';
        document.getElementById('adminRole').selectedIndex = 0;
    }
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
  