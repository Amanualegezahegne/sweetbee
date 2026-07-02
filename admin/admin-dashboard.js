// ================== Admin Dashboard Functions ==================

// Central API URL — localhost in dev, Render URL in production
const API_BASE = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? 'http://localhost:3001'
    : 'https://sweetbee-backend.onrender.com';

// Logout function
function logout() {
    alert("You have been logged out.");
    window.location.href = "admin.html";
}

// Toggle navigation menu
function toggleMenu() {
    const nav = document.querySelector('nav');
    nav.classList.toggle('active');
}

// When DOM is ready
document.addEventListener("DOMContentLoaded", function () {
    const productForm = document.getElementById("productForm");
    const editProfileForm = document.getElementById("ep-form");
    const resetRequestForm = document.getElementById("resetRequestForm");
    const otpForm = document.getElementById("otpForm");
    const resetForm = document.getElementById("resetForm");

    if (productForm) productForm.addEventListener("submit", handleProductSubmit);
    if (editProfileForm) editProfileForm.addEventListener("submit", handleEditProfileSubmit);
    if (resetRequestForm) resetRequestForm.addEventListener("submit", handleResetRequest);
    if (otpForm) otpForm.addEventListener("submit", handleOtpConfirm);
    if (resetForm) resetForm.addEventListener("submit", handlePasswordReset);

    loadMessages();
    loadProducts();
});

// ================== PRODUCT MANAGEMENT ==================
async function handleProductSubmit(e) {
    e.preventDefault();

    const name = document.getElementById("productName").value.trim();
    const price = document.getElementById("productPrice").value.trim();
    const description = document.getElementById("productDesc").value.trim();
    const imageFile = document.getElementById("productImage").files[0];

    if (!name || !price || !description || !imageFile) {
        alert("❌ Please fill in all product fields");
        return;
    }

    const formData = new FormData();
    formData.append("name", name);
    formData.append("price", price);
    formData.append("description", description);
    formData.append("image", imageFile);

    try {
        const res = await fetch(`${API_BASE}/admin/products`, {
            method: "POST",
            body: formData
        });

        const result = await res.json();
        alert(result.message);
        document.getElementById("productForm").reset();
        loadProducts();
    } catch (err) {
        console.error("Error adding product:", err);
        alert("⚠️ Error adding product");
    }
}

async function loadProducts() {
    try {
        const res = await fetch(`${API_BASE}/admin/products`);
        const products = await res.json();

        const list = document.getElementById("productItems");
        if (!list) return;
        list.innerHTML = "";

        if (products.length === 0) {
            list.innerHTML = "<li>No products available.</li>";
            return;
        }

        products.forEach((p) => {
            const li = document.createElement("li");
            li.innerHTML = `
                <div style="display: flex; align-items: center; gap: 15px; margin-bottom: 10px; border: 1px solid #ccc; padding: 10px; border-radius: 8px;">
                    <img src="${p.imageUrl}" alt="${p.name}" width="80" height="80" style="object-fit: cover; border-radius: 5px;" />
                    <div style="flex-grow: 1;">
                        <strong style="font-size: 18px;">${p.name}</strong><br />
                        <span style="color: green; font-weight: bold;">${p.price} ETB</span><br />
                        <small>${p.description}</small>
                    </div>
                    <button onclick="deleteProduct('${p.id}')">🗑️ Delete</button>
                </div>
            `;
            list.appendChild(li);
        });
    } catch (err) {
        console.error("Error loading products:", err);
    }
}

async function deleteProduct(id) {
    if (!confirm("Are you sure you want to delete this product?")) return;

    try {
        const res = await fetch(`${API_BASE}/admin/products/${id}`, {
            method: "DELETE",
        });

        const result = await res.json();
        alert(result.message);
        loadProducts();
    } catch (err) {
        console.error("Error deleting product:", err);
    }
}

// ================== MESSAGES ==================
async function loadMessages() {
    try {
        const res = await fetch(`${API_BASE}/admin/messages`);
        const messages = await res.json();

        const tbody = document.getElementById("messageTableBody");
        if (!tbody) return;
        tbody.innerHTML = "";

        if (messages.length === 0) {
            tbody.innerHTML = `<tr><td colspan="5">No messages available.</td></tr>`;
            return;
        }

        messages.forEach((msg) => {
            const tr = document.createElement("tr");
            tr.innerHTML = `
                <td data-label="Name">${msg.name}</td>
                <td data-label="Email">${msg.email}</td>
                <td data-label="Phone">${msg.phone || "-"}</td>
                <td data-label="Message">${msg.message}</td>
                <td data-label="Action"><button onclick="deleteMessage('${msg.id}')">🗑️ Delete</button></td>
            `;
            tbody.appendChild(tr);
        });
    } catch (err) {
        console.error("Error loading messages:", err);
    }
}

async function deleteMessage(id) {
    if (!confirm("Are you sure you want to delete this message?")) return;

    try {
        const res = await fetch(`${API_BASE}/admin/messages/${id}`, {
            method: "DELETE",
        });

        const result = await res.json();
        alert(result.message);
        loadMessages();
    } catch (err) {
        console.error("Error deleting message:", err);
    }
}

// ================== EDIT PROFILE ==================
async function handleEditProfileSubmit(e) {
    e.preventDefault();

    const username = document.getElementById("ep-username").value.trim();
    const email = document.getElementById("ep-email").value.trim();
    const currentPassword = document.getElementById("ep-current-password").value.trim();
    const newPassword = document.getElementById("ep-new-password").value.trim();
    const confirmPassword = document.getElementById("ep-confirm-password").value.trim();

    const usernameError = document.getElementById("ep-username-error");
    const emailError = document.getElementById("ep-email-error");
    const currentPasswordError = document.getElementById("ep-current-password-error");
    const newPasswordError = document.getElementById("ep-new-password-error");
    const confirmPasswordError = document.getElementById("ep-confirm-password-error");

    [usernameError, emailError, currentPasswordError, newPasswordError, confirmPasswordError].forEach(el => el.textContent = "");

    let valid = true;

    if (username.length < 3) {
        usernameError.textContent = "Username must be at least 3 characters.";
        valid = false;
    }

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(email)) {
        emailError.textContent = "Please enter a valid email.";
        valid = false;
    }

    try {
        const checkRes = await fetch(`${API_BASE}/admin/check-password`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ currentPassword })
        });
        const checkData = await checkRes.json();
        if (!checkData.valid) {
            currentPasswordError.textContent = "Current password is incorrect.";
            valid = false;
        }
    } catch (err) {
        currentPasswordError.textContent = "Error verifying current password.";
        valid = false;
    }

    if (newPassword.length < 6) {
        newPasswordError.textContent = "Password must be at least 6 characters.";
        valid = false;
    }

    if (newPassword !== confirmPassword) {
        confirmPasswordError.textContent = "Passwords do not match.";
        valid = false;
    }

    if (!valid) return;

    try {
        const res = await fetch(`${API_BASE}/admin/update-profile`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username, email, newPassword })
        });
        const data = await res.json();
        alert(data.message);
    } catch (err) {
        alert("⚠️ Error updating profile.");
    }
}

// ================== RESET PASSWORD WITH OTP ==================
let globalEmail = "";

async function handleResetRequest(e) {
    e.preventDefault();
    globalEmail = document.getElementById("email").value.trim();

    try {
        const res = await fetch(`${API_BASE}/admin/reset-request`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email: globalEmail })
        });

        const data = await res.json();
        alert(data.message);

        if (res.ok) {
            localStorage.setItem("resetEmail", globalEmail);
            window.location.href = "otp-confirmation.html";
        }
    } catch (err) {
        alert("⚠️ Could not send reset link.");
    }
}

async function handleOtpConfirm(e) {
    e.preventDefault();
    const otp = document.getElementById("otp").value.trim();
    const email = localStorage.getItem("resetEmail");

    try {
        const res = await fetch(`${API_BASE}/admin/verify-otp`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, otp })
        });

        const data = await res.json();
        alert(data.message);

        if (res.ok && data.success) {
            window.location.href = "reset-password.html";
        }
    } catch (err) {
        alert("⚠️ OTP confirmation failed.");
    }
}

async function handlePasswordReset(e) {
    e.preventDefault();
    const newPassword = document.getElementById("newPassword").value.trim();
    const confirmPassword = document.getElementById("confirmPassword").value.trim();
    const email = localStorage.getItem("resetEmail");

    const messageEl = document.getElementById("message");
    messageEl.textContent = "";
    messageEl.className = "";

    if (newPassword.length < 6) {
        messageEl.textContent = "❌ Password must be at least 6 characters.";
        messageEl.className = "error";
        return;
    }

    if (newPassword !== confirmPassword) {
        messageEl.textContent = "❌ Passwords do not match.";
        messageEl.className = "error";
        return;
    }

    try {
        const res = await fetch(`${API_BASE}/admin/reset-password`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, newPassword })
        });

        const data = await res.json();

        if (res.ok && data.success) {
            messageEl.textContent = "✅ Password reset successful! Redirecting...";
            messageEl.className = "success";
            localStorage.removeItem("resetEmail");
            setTimeout(() => { window.location.href = "admin.html"; }, 5000);
        } else {
            messageEl.textContent = "⚠️ " + (data.message || "Password reset failed.");
            messageEl.className = "error";
        }
    } catch (err) {
        messageEl.textContent = "⚠️ Could not reset password.";
        messageEl.className = "error";
    }
}
