
function toggleMenu() {
    const nav = document.getElementById("navbar");
    nav.classList.toggle("show");
}

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

    // Phone number check (+251 with 9 digits)
    const phonePattern = /^\+251\s?\d{9}$/;
    if (!phone.match(phonePattern)) {
        alert("Please enter a valid Ethiopian phone number like +251 911223344.");
        return false;
    }

    // Message check
    if (message.length < 10) {
        alert("Your message is too short. Please write at least 10 characters.");
        return false;
    }

    // All validations passed
    alert("Thank you! Your message has been submitted.");
    return false;
}
