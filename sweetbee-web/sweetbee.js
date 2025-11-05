// 🟨 Toggle mobile nav menu
function toggleMenu() {
    const nav = document.getElementById("navbar");
    nav.classList.toggle("show");
}

// 🟨 Contact Form Validation
function validateForm() {
    const name = document.getElementById("name").value.trim();
    const email = document.getElementById("email").value.trim();
    const phone = document.getElementById("phone").value.trim();
    const message = document.getElementById("message").value.trim();

    // Name check
    if (name === "") {
        alert("Please enter your name.");
        return false;
    }

    // Email check
    const emailPattern = /^[^ ]+@[^ ]+\.[a-z]{2,3}$/;
    if (!email.match(emailPattern)) {
        alert("Please enter a valid email address.");
        return false;
    }

    // Phone check (+251 9 digits)
    const phonePattern = /^\+251\s?\d{9}$/;
    if (!phone.match(phonePattern)) {
        alert("Please enter a valid Ethiopian phone number like +251 911223344.");
        return false;
    }

    // Message length check
    if (message.length < 10) {
        alert("Your message is too short. Please write at least 10 characters.");
        return false;
    }

    return true;
}

// 🟩 Handle contact form submission and load products if applicable
document.addEventListener("DOMContentLoaded", function () {
    const form = document.getElementById("contactForm");
    if (form) {
        form.addEventListener("submit", async function (e) {
            e.preventDefault();

            if (!validateForm()) return;

            const submitBtn = form.querySelector("button[type=submit]");
            submitBtn.disabled = true;

            const formData = {
                name: document.getElementById("name").value,
                email: document.getElementById("email").value,
                phone: document.getElementById("phone").value,
                message: document.getElementById("message").value,
            };

            try {
                const response = await fetch("http://localhost:3001/contact", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(formData),
                });

                const result = await response.json();
                alert(result.message || "✅ Message sent successfully!");
                form.reset();
            } catch (error) {
                alert("❌ Error sending message. Please try again.");
                console.error(error);
            } finally {
                submitBtn.disabled = false;
            }
        });
    }

    // 🟨 If it's the product page, load products
    if (document.getElementById("productList")) {
        loadProducts();
    }
});

// 🐝 Load products on the Products page with image, name, price, and description
async function loadProducts() {
    const container = document.getElementById("productList");
    container.innerHTML = "<p>Loading...</p>";

    try {
        const res = await fetch("http://localhost:3001/admin/products");
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);

        const products = await res.json();

        if (!products.length) {
            container.innerHTML = "<p>No products available.</p>";
            return;
        }

        container.innerHTML = ""; // Clear loading

        products.forEach(p => {
            const item = document.createElement("div");
            item.className = "product-card";
            item.innerHTML = `
                <img src="${p.imageUrl}" alt="${p.name}" class="product-image" />
                <h3 class="product-name">${p.name}</h3>
                <p class="product-price">💰 ${p.price} ETB</p>
                <p class="product-description">${p.description}</p>
            `;
            container.appendChild(item);
        });

    } catch (err) {
        console.error("Failed to load products:", err);
        container.innerHTML = "<p>Failed to load products. Try again later.</p>";
    }
}
