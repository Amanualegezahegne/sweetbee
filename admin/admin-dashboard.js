// ============================================================
// API BASE URL
// ============================================================
const API_BASE = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? 'http://localhost:3001'
    : 'https://sweetbee.onrender.com';

// ============================================================
// TOAST NOTIFICATIONS
// ============================================================
function showToast(message, type = 'success') {
    let container = document.getElementById('admin-toast-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'admin-toast-container';
        document.body.appendChild(container);
    }
    const toast = document.createElement('div');
    toast.className = `admin-toast ${type}`;
    toast.textContent = message;
    toast.onclick = () => dismissToast(toast);
    container.appendChild(toast);
    setTimeout(() => dismissToast(toast), 4000);
}

function dismissToast(toast) {
    if (!toast.parentNode) return;
    toast.classList.add('leaving');
    toast.addEventListener('animationend', () => toast.remove(), { once: true });
}

// ============================================================
// DOM READY
// ============================================================
document.addEventListener('DOMContentLoaded', function () {
    if (document.getElementById('productForm')) {
        document.getElementById('productForm').addEventListener('submit', handleProductSubmit);
        loadProducts();
    }
    if (document.getElementById('messageTableBody')) {
        loadMessages();
    }
    if (document.getElementById('ep-form')) {
        document.getElementById('ep-form').addEventListener('submit', handleEditProfileSubmit);
    }
    if (document.getElementById('resetRequestForm')) {
        document.getElementById('resetRequestForm').addEventListener('submit', handleResetRequest);
    }
    if (document.getElementById('otpForm')) {
        document.getElementById('otpForm').addEventListener('submit', handleOtpConfirm);
    }
    if (document.getElementById('resetForm')) {
        document.getElementById('resetForm').addEventListener('submit', handlePasswordReset);
    }
});

// ============================================================
// PRODUCTS
// ============================================================
async function handleProductSubmit(e) {
    e.preventDefault();
    const name = document.getElementById('productName').value.trim();
    const price = document.getElementById('productPrice').value.trim();
    const description = document.getElementById('productDesc').value.trim();
    const imageFile = document.getElementById('productImage').files[0];

    if (!name || !price || !description || !imageFile) {
        showToast('Please fill in all fields and select an image', 'error');
        return;
    }

    const btn = e.target.querySelector('button[type=submit]');
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Adding…';

    const formData = new FormData();
    formData.append('name', name);
    formData.append('price', price);
    formData.append('description', description);
    formData.append('image', imageFile);

    try {
        const res = await fetch(`${API_BASE}/admin/products`, { method: 'POST', body: formData });
        const result = await res.json();
        showToast('✅ ' + (result.message || 'Product added!'), 'success');
        e.target.reset();
        loadProducts();
    } catch (err) {
        showToast('❌ Error adding product', 'error');
    } finally {
        btn.disabled = false;
        btn.innerHTML = '<i class="fas fa-plus"></i> Add Product';
    }
}

async function loadProducts() {
    const container = document.getElementById('productList') || document.getElementById('productItems');
    if (!container) return;

    container.innerHTML = `<div class="empty-state"><i class="fas fa-spinner fa-spin"></i><p>Loading…</p></div>`;

    try {
        const res = await fetch(`${API_BASE}/admin/products`);
        const products = await res.json();

        if (!Array.isArray(products) || products.length === 0) {
            container.innerHTML = `<div class="empty-state"><i class="fas fa-box-open"></i><p>No products yet. Add one above!</p></div>`;
            return;
        }

        // Render as cards
        container.className = 'product-grid';
        container.innerHTML = products.map(p => `
            <div class="product-item">
                <img src="${escapeHTML(p.imageUrl || '')}" alt="${escapeHTML(p.name || '')}"
                     onerror="this.style.background='#222';this.style.height='80px';" />
                <div class="product-item-body">
                    <h4>${escapeHTML(truncate(p.name || 'Unnamed', 40))}</h4>
                    <span class="price">ETB ${Number(p.price || 0).toLocaleString()}</span>
                    <p>${escapeHTML(truncate(p.description || '', 90))}</p>
                    <button class="btn-danger" onclick="deleteProduct('${p.id || p._id}')">
                        <i class="fas fa-trash"></i> Delete
                    </button>
                </div>
            </div>
        `).join('');

    } catch (err) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-exclamation-triangle" style="color:#ef4444;"></i>
                <p>Failed to load products. <a href="#" onclick="loadProducts()" style="color:var(--brand);">Retry</a></p>
            </div>`;
    }
}

async function deleteProduct(id) {
    if (!confirm('Delete this product?')) return;
    try {
        await fetch(`${API_BASE}/admin/products/${id}`, { method: 'DELETE' });
        showToast('🗑️ Product deleted', 'success');
        loadProducts();
    } catch (err) {
        showToast('❌ Error deleting product', 'error');
    }
}

// ============================================================
// MESSAGES
// ============================================================
async function loadMessages() {
    const tbody = document.getElementById('messageTableBody');
    if (!tbody) return;

    try {
        const res = await fetch(`${API_BASE}/admin/messages`);
        const messages = await res.json();

        const countEl = document.getElementById('msgCount');
        if (countEl) countEl.textContent = `${messages.length} message${messages.length !== 1 ? 's' : ''}`;

        if (!messages.length) {
            tbody.innerHTML = `<tr><td colspan="6"><div class="empty-state"><i class="fas fa-inbox"></i><p>No messages yet</p></div></td></tr>`;
            return;
        }

        tbody.innerHTML = messages.map(msg => `
            <tr>
                <td data-label="Name">${escapeHTML(msg.name || '')}</td>
                <td data-label="Email">${escapeHTML(msg.email || '')}</td>
                <td data-label="Phone">${escapeHTML(msg.phone || '—')}</td>
                <td data-label="Message" style="max-width:260px;">${escapeHTML(msg.message || '')}</td>
                <td data-label="Date" style="white-space:nowrap;color:var(--text-muted);font-size:0.8rem;">
                    ${msg.date ? new Date(msg.date).toLocaleDateString() : '—'}
                </td>
                <td data-label="Action">
                    <button class="btn-danger" onclick="deleteMessage('${msg.id || msg._id}')">
                        <i class="fas fa-trash"></i> Delete
                    </button>
                </td>
            </tr>
        `).join('');

    } catch (err) {
        tbody.innerHTML = `<tr><td colspan="6"><div class="empty-state"><i class="fas fa-exclamation-triangle" style="color:#ef4444;"></i><p>Failed to load messages</p></div></td></tr>`;
    }
}

async function deleteMessage(id) {
    if (!confirm('Delete this message?')) return;
    try {
        await fetch(`${API_BASE}/admin/messages/${id}`, { method: 'DELETE' });
        showToast('🗑️ Message deleted', 'success');
        loadMessages();
    } catch (err) {
        showToast('❌ Error deleting message', 'error');
    }
}

// ============================================================
// EDIT PROFILE
// ============================================================
async function handleEditProfileSubmit(e) {
    e.preventDefault();
    const username = document.getElementById('ep-username').value.trim();
    const email = document.getElementById('ep-email').value.trim();
    const currentPassword = document.getElementById('ep-current-password').value.trim();
    const newPassword = document.getElementById('ep-new-password').value.trim();
    const confirmPassword = document.getElementById('ep-confirm-password').value.trim();

    ['ep-username-error','ep-email-error','ep-current-password-error','ep-new-password-error','ep-confirm-password-error']
        .forEach(id => { const el = document.getElementById(id); if (el) el.textContent = ''; });

    let valid = true;

    if (username.length < 3) {
        document.getElementById('ep-username-error').textContent = 'Username must be at least 3 characters.';
        valid = false;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        document.getElementById('ep-email-error').textContent = 'Please enter a valid email.';
        valid = false;
    }

    try {
        const checkRes = await fetch(`${API_BASE}/admin/check-password`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ currentPassword })
        });
        const checkData = await checkRes.json();
        if (!checkData.valid) {
            document.getElementById('ep-current-password-error').textContent = 'Current password is incorrect.';
            valid = false;
        }
    } catch {
        document.getElementById('ep-current-password-error').textContent = 'Error verifying password.';
        valid = false;
    }

    if (newPassword.length < 6) {
        document.getElementById('ep-new-password-error').textContent = 'Password must be at least 6 characters.';
        valid = false;
    }
    if (newPassword !== confirmPassword) {
        document.getElementById('ep-confirm-password-error').textContent = 'Passwords do not match.';
        valid = false;
    }
    if (!valid) return;

    const btn = document.getElementById('ep-submit');
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving…';

    try {
        const res = await fetch(`${API_BASE}/admin/update-profile`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, email, newPassword })
        });
        const data = await res.json();
        showToast('✅ ' + (data.message || 'Profile updated!'), 'success');
    } catch {
        showToast('❌ Error updating profile', 'error');
    } finally {
        btn.disabled = false;
        btn.innerHTML = '<i class="fas fa-save"></i> Save Changes';
    }
}

// ============================================================
// OTP PASSWORD RESET
// ============================================================
async function handleResetRequest(e) {
    e.preventDefault();
    const email = document.getElementById('email').value.trim();
    const btn = document.getElementById('reqBtn');
    const errEl = document.getElementById('reqError');
    if (errEl) errEl.classList.remove('show');

    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending…';

    try {
        const res = await fetch(`${API_BASE}/admin/reset-request`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email })
        });
        const data = await res.json();
        if (res.ok) {
            localStorage.setItem('resetEmail', email);
            showToast('📧 Code sent! Check your email.', 'success');
            setTimeout(() => window.location.href = 'OTP-confirmation.html', 1200);
        } else {
            if (errEl) { errEl.textContent = data.message || 'Email not found.'; errEl.classList.add('show'); }
        }
    } catch {
        if (errEl) { errEl.textContent = '⚠️ Could not connect to server.'; errEl.classList.add('show'); }
    } finally {
        btn.disabled = false;
        btn.innerHTML = '<i class="fas fa-paper-plane"></i> Send Reset Code';
    }
}

async function handleOtpConfirm(e) {
    e.preventDefault();
    const otp = document.getElementById('otp').value.trim();
    const email = localStorage.getItem('resetEmail');
    const btn = document.getElementById('otpBtn');
    const errEl = document.getElementById('otpError');
    if (errEl) errEl.classList.remove('show');

    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Verifying…';

    try {
        const res = await fetch(`${API_BASE}/admin/verify-otp`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, otp })
        });
        const data = await res.json();
        if (res.ok && data.success) {
            showToast('✅ Code verified!', 'success');
            setTimeout(() => window.location.href = 'reset-password.html', 800);
        } else {
            if (errEl) { errEl.textContent = data.message || 'Invalid code.'; errEl.classList.add('show'); }
        }
    } catch {
        if (errEl) { errEl.textContent = '⚠️ Could not connect to server.'; errEl.classList.add('show'); }
    } finally {
        btn.disabled = false;
        btn.innerHTML = '<i class="fas fa-check-circle"></i> Verify Code';
    }
}

async function handlePasswordReset(e) {
    e.preventDefault();
    const newPassword = document.getElementById('newPassword').value.trim();
    const confirmPassword = document.getElementById('confirmPassword').value.trim();
    const email = localStorage.getItem('resetEmail');
    const btn = document.getElementById('resetBtn');
    const errEl = document.getElementById('resetError');
    if (errEl) errEl.classList.remove('show');

    if (newPassword.length < 6) {
        if (errEl) { errEl.textContent = 'Password must be at least 6 characters.'; errEl.classList.add('show'); }
        return;
    }
    if (newPassword !== confirmPassword) {
        if (errEl) { errEl.textContent = 'Passwords do not match.'; errEl.classList.add('show'); }
        return;
    }

    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Resetting…';

    try {
        const res = await fetch(`${API_BASE}/admin/reset-password`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, newPassword })
        });
        const data = await res.json();
        if (res.ok && data.success) {
            const successEl = document.getElementById('resetSuccess');
            if (successEl) { successEl.textContent = '✅ Password reset! Redirecting to login…'; successEl.style.display = 'block'; }
            localStorage.removeItem('resetEmail');
            setTimeout(() => window.location.href = 'admin.html', 2000);
        } else {
            if (errEl) { errEl.textContent = data.message || 'Reset failed.'; errEl.classList.add('show'); }
        }
    } catch {
        if (errEl) { errEl.textContent = '⚠️ Could not connect to server.'; errEl.classList.add('show'); }
    } finally {
        btn.disabled = false;
        btn.innerHTML = '<i class="fas fa-lock"></i> Reset Password';
    }
}

// ============================================================
// UTILS
// ============================================================
function escapeHTML(str) {
    if (typeof str !== 'string') return '';
    return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#x27;');
}

function truncate(text, max) {
    return text.length > max ? text.slice(0, max - 1) + '…' : text;
}

function logout() {
    window.location.href = 'admin.html';
}

function toggleMenu() {
    const nav = document.querySelector('nav');
    if (nav) nav.classList.toggle('active');
}
