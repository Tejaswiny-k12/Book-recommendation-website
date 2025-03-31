document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const loginSection = document.getElementById('login-section');
    const dashboardSection = document.getElementById('dashboard-section');
    const passwordFormSection = document.getElementById('password-form-section');
    const loginForm = document.getElementById('login-form');
    const masterPasswordInput = document.getElementById('master-password');
    const loginMessage = document.getElementById('login-message');
    const logoutBtn = document.getElementById('logout-btn');
    const addPasswordBtn = document.getElementById('add-password-btn');
    const passwordsList = document.getElementById('passwords-list');
    const noPasswordsMessage = document.getElementById('no-passwords-message');
    const passwordForm = document.getElementById('password-form');
    const formTitle = document.getElementById('form-title');
    const editIdInput = document.getElementById('edit-id');
    const siteNameInput = document.getElementById('site-name');
    const usernameInput = document.getElementById('username');
    const passwordInput = document.getElementById('password');
    const notesInput = document.getElementById('notes');
    const cancelBtn = document.getElementById('cancel-btn');
    const togglePasswordBtn = document.getElementById('toggle-password');
    const searchInput = document.getElementById('search-input');
    const themeToggle = document.getElementById('theme-toggle');

    // State
    let masterPassword = '';
    let passwords = [];
    let isEditing = false;

    // Check if dark mode is preferred
    if (localStorage.getItem('darkMode') === 'true' || 
        (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches && 
         localStorage.getItem('darkMode') === null)) {
        document.body.classList.add('dark');
    }

    // Theme toggle
    themeToggle.addEventListener('click', () => {
        document.body.classList.toggle('dark');
        localStorage.setItem('darkMode', document.body.classList.contains('dark'));
    });

    // Login form submission
    loginForm.addEventListener('submit', function(e) {
        e.preventDefault();
        const password = masterPasswordInput.value.trim();
        
        if (!password) {
            showMessage(loginMessage, 'Please enter a master password', 'error');
            return;
        }
        
        // Check if user exists
        const hashedCheck = localStorage.getItem('masterPasswordHash');
        
        if (hashedCheck) {
            // Verify password
            if (CryptoJS.SHA256(password).toString() !== hashedCheck) {
                showMessage(loginMessage, 'Incorrect master password', 'error');
                return;
            }
        } else {
            // First time login - create new account
            localStorage.setItem('masterPasswordHash', CryptoJS.SHA256(password).toString());
            localStorage.setItem('passwords', encryptData([], password));
        }
        
        // Login successful
        masterPassword = password;
        loadPasswords();
        showDashboard();
        masterPasswordInput.value = '';
    });

    // Logout
    logoutBtn.addEventListener('click', function() {
        masterPassword = '';
        passwords = [];
        showLoginSection();
    });

    // Add new password
    addPasswordBtn.addEventListener('click', function() {
        isEditing = false;
        formTitle.textContent = 'Add New Password';
        editIdInput.value = '';
        passwordForm.reset();
        showPasswordForm();
    });

    // Cancel password form
    cancelBtn.addEventListener('click', function() {
        showDashboard();
    });

    // Toggle password visibility
    togglePasswordBtn.addEventListener('click', function() {
        if (passwordInput.type === 'password') {
            passwordInput.type = 'text';
        } else {
            passwordInput.type = 'password';
        }
    });

    // Password form submission
    passwordForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const passwordData = {
            id: isEditing ? editIdInput.value : Date.now().toString(),
            siteName: siteNameInput.value.trim(),
            username: usernameInput.value.trim(),
            password: passwordInput.value,
            notes: notesInput.value.trim(),
            createdAt: isEditing ? getPasswordById(editIdInput.value).createdAt : new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        
        if (isEditing) {
            // Update existing password
            const index = passwords.findIndex(p => p.id === passwordData.id);
            if (index !== -1) {
                passwords[index] = passwordData;
            }
        } else {
            // Add new password
            passwords.push(passwordData);
        }
        
        savePasswords();
        showDashboard();
        renderPasswordsList();
    });

    // Search functionality
    searchInput.addEventListener('input', function() {
        renderPasswordsList();
    });

    // Helper Functions
    function showLoginSection() {
        loginSection.classList.remove('hidden');
        dashboardSection.classList.add('hidden');
        passwordFormSection.classList.add('hidden');
    }

    function showDashboard() {
        loginSection.classList.add('hidden');
        dashboardSection.classList.remove('hidden');
        passwordFormSection.classList.add('hidden');
    }

    function showPasswordForm() {
        loginSection.classList.add('hidden');
        dashboardSection.classList.add('hidden');
        passwordFormSection.classList.remove('hidden');
    }

    function showMessage(element, message, type) {
        element.textContent = message;
        element.className = 'message';
        element.classList.add(type);
        
        // Clear message after 3 seconds
        setTimeout(() => {
            element.textContent = '';
            element.className = 'message';
        }, 3000);
    }

    function loadPasswords() {
        try {
            const encryptedData = localStorage.getItem('passwords');
            if (encryptedData) {
                passwords = decryptData(encryptedData, masterPassword);
                renderPasswordsList();
            }
        } catch (error) {
            console.error('Error loading passwords:', error);
        }
    }

    function savePasswords() {
        try {
            localStorage.setItem('passwords', encryptData(passwords, masterPassword));
        } catch (error) {
            console.error('Error saving passwords:', error);
        }
    }

    function renderPasswordsList() {
        const searchTerm = searchInput.value.toLowerCase();
        const filteredPasswords = passwords.filter(p => 
            p.siteName.toLowerCase().includes(searchTerm) || 
            p.username.toLowerCase().includes(searchTerm) ||
            p.notes.toLowerCase().includes(searchTerm)
        );
        
        if (filteredPasswords.length === 0) {
            noPasswordsMessage.style.display = 'block';
            passwordsList.innerHTML = '';
            return;
        }
        
        noPasswordsMessage.style.display = 'none';
        
        // Sort by site name
        filteredPasswords.sort((a, b) => a.siteName.localeCompare(b.siteName));
        
        let html = '';
        filteredPasswords.forEach(p => {
            html += `
                <div class="password-item" data-id="${p.id}">
                    <div class="password-item-header">
                        <div class="site-name">${escapeHtml(p.siteName)}</div>
                        <div class="password-actions">
                            <button class="action-btn copy-username" title="Copy Username">
                                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>
                            </button>
                            <button class="action-btn copy-password" title="Copy Password">
                                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 8.5V6a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-2.5"/><path d="M7 10h4"/><path d="M7 14h4"/><path d="M15 12h6"/></svg>
                            </button>
                            <button class="action-btn edit-password" title="Edit">
                                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></svg>
                            </button>
                            <button class="action-btn delete-password" title="Delete">
                                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/></svg>
                            </button>
                        </div>
                    </div>
                    <div class="password-details">
                        <div class="detail-row">
                            <span class="detail-label">Username:</span>
                            <span>${escapeHtml(p.username)}</span>
                        </div>
                        <div class="detail-row">
                            <span class="detail-label">Password:</span>
                            <span>••••••••</span>
                        </div>
                        ${p.notes ? `
                        <div class="detail-row">
                            <span class="detail-label">Notes:</span>
                            <span>${escapeHtml(p.notes)}</span>
                        </div>
                        ` : ''}
                    </div>
                </div>
            `;
        });
        
        passwordsList.innerHTML = html;
        
        // Add event listeners to buttons
        document.querySelectorAll('.copy-username').forEach(btn => {
            btn.addEventListener('click', function() {
                const id = this.closest('.password-item').dataset.id;
                const password = getPasswordById(id);
                copyToClipboard(password.username);
            });
        });
        
        document.querySelectorAll('.copy-password').forEach(btn => {
            btn.addEventListener('click', function() {
                const id = this.closest('.password-item').dataset.id;
                const password = getPasswordById(id);
                copyToClipboard(password.password);
            });
        });
        
        document.querySelectorAll('.edit-password').forEach(btn => {
            btn.addEventListener('click', function() {
                const id = this.closest('.password-item').dataset.id;
                editPassword(id);
            });
        });
        
        document.querySelectorAll('.delete-password').forEach(btn => {
            btn.addEventListener('click', function() {
                const id = this.closest('.password-item').dataset.id;
                deletePassword(id);
            });
        });
    }

    function getPasswordById(id) {
        return passwords.find(p => p.id === id);
    }

    function editPassword(id) {
        const password = getPasswordById(id);
        if (!password) return;
        
        isEditing = true;
        formTitle.textContent = 'Edit Password';
        editIdInput.value = password.id;
        siteNameInput.value = password.siteName;
        usernameInput.value = password.username;
        passwordInput.value = password.password;
        notesInput.value = password.notes;
        
        showPasswordForm();
    }

    function deletePassword(id) {
        if (confirm('Are you sure you want to delete this password?')) {
            passwords = passwords.filter(p => p.id !== id);
            savePasswords();
            renderPasswordsList();
        }
    }

    function copyToClipboard(text) {
        navigator.clipboard.writeText(text).then(() => {
            // Show a temporary notification
            const notification = document.createElement('div');
            notification.textContent = 'Copied to clipboard!';
            notification.style.position = 'fixed';
            notification.style.bottom = '20px';
            notification.style.left = '50%';
            notification.style.transform = 'translateX(-50%)';
            notification.style.padding = '10px 20px';
            notification.style.backgroundColor = 'var(--primary-color)';
            notification.style.color = 'white';
            notification.style.borderRadius = '5px';
            notification.style.zIndex = '1000';
            
            document.body.appendChild(notification);
            
            setTimeout(() => {
                notification.remove();
            }, 2000);
        }).catch(err => {
            console.error('Could not copy text: ', err);
        });
    }

    function encryptData(data, key) {
        return CryptoJS.AES.encrypt(JSON.stringify(data), key).toString();
    }

    function decryptData(encryptedData, key) {
        const bytes = CryptoJS.AES.decrypt(encryptedData, key);
        return JSON.parse(bytes.toString(CryptoJS.enc.Utf8));
    }

    function escapeHtml(unsafe) {
        return unsafe
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    // Initialize
    showLoginSection();
});