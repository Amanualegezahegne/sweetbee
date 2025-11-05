const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const nodemailer = require('nodemailer');

const app = express();
const PORT = 3001;
const LOCAL_IP = '192.168.125.11'; // ✅ Your local network IP

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Ensure uploads folder exists
if (!fs.existsSync('uploads')) fs.mkdirSync('uploads');

const MESSAGE_FILE = path.join(__dirname, 'messages.json');
const PRODUCT_FILE = path.join(__dirname, 'products.json');
const ADMIN_FILE = path.join(__dirname, 'admin.json');

// ------------ Helper functions ------------
function loadMessages() {
    if (fs.existsSync(MESSAGE_FILE)) {
        return JSON.parse(fs.readFileSync(MESSAGE_FILE, 'utf-8'));
    }
    return [];
}
function saveMessages(messages) {
    fs.writeFileSync(MESSAGE_FILE, JSON.stringify(messages, null, 2));
}
function loadProducts() {
    if (fs.existsSync(PRODUCT_FILE)) {
        return JSON.parse(fs.readFileSync(PRODUCT_FILE, 'utf-8'));
    }
    return [];
}
function saveProducts(products) {
    fs.writeFileSync(PRODUCT_FILE, JSON.stringify(products, null, 2));
}

// ------------ Admin storage functions ------------
function loadAdmin() {
    if (fs.existsSync(ADMIN_FILE)) {
        return JSON.parse(fs.readFileSync(ADMIN_FILE, 'utf-8'));
    }
    // Default admin credentials
    const defaultAdmin = {
        username: 'admin',
        password: 'admin1234',
        email: 'amanualegezahegne2066@gmail.com',
    };
    fs.writeFileSync(ADMIN_FILE, JSON.stringify(defaultAdmin, null, 2));
    return defaultAdmin;
}
function saveAdmin(adminData) {
    fs.writeFileSync(ADMIN_FILE, JSON.stringify(adminData, null, 2));
}

// ------------ Admin credentials ------------
let adminCredentials = loadAdmin();
let resetTokens = {}; // { email: { otp, expires, verified } }

// ------------ Contact API ------------
app.post('/contact', (req, res) => {
    const { name, email, phone, message } = req.body;
    if (!name || !email || !message) {
        return res.status(400).json({ success: false, message: 'Missing required fields' });
    }
    const newMsg = {
        id: uuidv4(),
        name,
        email,
        phone,
        message,
        date: new Date().toISOString(),
    };
    const messages = loadMessages();
    messages.push(newMsg);
    saveMessages(messages);
    res.status(201).json({ success: true, message: 'Message received' });
});

app.get('/admin/messages', (req, res) => {
    res.json(loadMessages());
});

app.delete('/admin/messages/:id', (req, res) => {
    const id = req.params.id;
    const messages = loadMessages();
    const updated = messages.filter(msg => msg.id !== id);
    if (updated.length === messages.length) {
        return res.status(404).json({ message: 'Message not found' });
    }
    saveMessages(updated);
    res.json({ message: 'Message deleted successfully' });
});

// ------------ Product API ------------
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, 'uploads'),
    filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`),
});
const upload = multer({ storage });

app.post('/admin/products', upload.single('image'), (req, res) => {
    const { name, price, description } = req.body;
    if (!req.file || !name || !price || !description) {
        return res.status(400).json({ message: 'Missing fields or image' });
    }
    const imageUrl = `http://${LOCAL_IP}:${PORT}/uploads/${req.file.filename}`;
    const product = { id: uuidv4(), name, price, description, imageUrl };
    const products = loadProducts();
    products.push(product);
    saveProducts(products);
    res.status(201).json({ message: 'Product added', product });
});

app.get('/admin/products', (req, res) => {
    res.json(loadProducts());
});

app.delete('/admin/products/:id', (req, res) => {
    const id = req.params.id;
    const products = loadProducts();
    const updated = products.filter(p => p.id !== id);
    if (updated.length === products.length) {
        return res.status(404).json({ message: 'Product not found' });
    }
    saveProducts(updated);
    res.json({ message: 'Product deleted' });
});

// ------------ Admin Login ------------
app.post('/admin/login', (req, res) => {
    const { username, password } = req.body;
    if (username === adminCredentials.username && password === adminCredentials.password) {
        return res.json({ success: true });
    }
    return res.json({ success: false });
});

// ------------ Reset Password Request (Send OTP) ------------
app.post('/admin/reset-request', (req, res) => {
    const { email } = req.body;
    if (email !== adminCredentials.email) {
        return res.status(404).json({ message: 'Admin email not found.' });
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    resetTokens[email] = {
        otp,
        expires: Date.now() + 10 * 60 * 1000, // valid 10 minutes
        verified: false,
    };

    // Send OTP via email
    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: 'amanualegezahegne2066@gmail.com',
            pass: 'egsmfjryxmdsgutc',
        },
    });

    const mailOptions = {
        from: `"SweetBee Admin" <amanualegezahegne2066@gmail.com>`,
        to: email,
        subject: 'Your Password Reset Code',
        html: `<p>Your confirmation code is: <b>${otp}</b></p>
               <p>This code will expire in 10 minutes.</p>`,
    };

    transporter.sendMail(mailOptions, (error) => {
        if (error) {
            console.error('Mail error:', error);
            return res.status(500).json({ message: 'Failed to send OTP.' });
        }
        res.json({ message: 'OTP sent to your email.' });
    });
});

// ------------ Verify OTP ------------
app.post('/admin/verify-otp', (req, res) => {
    const { email, otp } = req.body;
    const record = resetTokens[email];

    if (!record) {
        return res.status(400).json({ success: false, message: 'No reset request found.' });
    }
    if (record.expires < Date.now()) {
        delete resetTokens[email];
        return res.status(400).json({ success: false, message: 'OTP expired.' });
    }
    if (record.otp !== otp) {
        return res.status(400).json({ success: false, message: 'Invalid OTP.' });
    }

    // ✅ Mark OTP as verified
    resetTokens[email].verified = true;
    res.json({ success: true, message: 'OTP verified. You can now reset your password.' });
});

// ------------ Reset Password After OTP Verification ------------
app.post('/admin/reset-password', (req, res) => {
    const { email, newPassword } = req.body;
    const record = resetTokens[email];

    if (!record || !record.verified) {
        return res.status(400).json({ success: false, message: 'OTP not verified.' });
    }
    if (!newPassword || newPassword.length < 6) {
        return res.status(400).json({ success: false, message: 'Password must be at least 6 characters.' });
    }

    adminCredentials.password = newPassword;
    saveAdmin(adminCredentials); // ✅ Save to file
    delete resetTokens[email]; // Clear OTP after use

    res.json({ success: true, message: 'Password successfully reset!' });
});

// ------------ Check Current Password ------------
app.post('/admin/check-password', (req, res) => {
    const { currentPassword } = req.body;
    if (currentPassword === adminCredentials.password) {
        return res.json({ valid: true });
    }
    res.json({ valid: false });
});

// ------------ Update Profile ------------
app.post('/admin/update-profile', (req, res) => {
    const { username, email, newPassword } = req.body;

    if (!username || !email || !newPassword) {
        return res.status(400).json({ message: 'All fields are required.' });
    }

    adminCredentials.username = username;
    adminCredentials.email = email;
    adminCredentials.password = newPassword;

    saveAdmin(adminCredentials); // ✅ Persist to file

    res.json({ message: 'Profile updated successfully!' });
});

// ------------ Start Server ------------
app.listen(PORT, () => {
    console.log(`🚀 Server running at http://${LOCAL_IP}:${PORT}`);
});
