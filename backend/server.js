const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const nodemailer = require('nodemailer');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;
const LOCAL_IP = process.env.LOCAL_IP || 'localhost';

// ============================================================
// Supabase Client (uses SERVICE ROLE KEY — never expose to browser)
// ============================================================
const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

// ============================================================
// Middleware
// ============================================================
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded images locally
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Ensure uploads folder exists
if (!fs.existsSync('uploads')) fs.mkdirSync('uploads');

// ============================================================
// Multer — local image storage
// ============================================================
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, 'uploads'),
    filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`),
});
const upload = multer({
    storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB max
    fileFilter: (req, file, cb) => {
        const allowed = /jpeg|jpg|png|gif|webp/;
        const ok = allowed.test(path.extname(file.originalname).toLowerCase()) &&
                   allowed.test(file.mimetype);
        cb(ok ? null : new Error('Only image files are allowed'), ok);
    },
});

// ============================================================
// Helper: send error response
// ============================================================
function sendError(res, status, message, details) {
    const body = { success: false, message };
    if (details) body.details = details;
    return res.status(status).json(body);
}

// ============================================================
// PRODUCTS API
// ============================================================

// GET /admin/products — public
app.get('/admin/products', async (req, res) => {
    const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) return sendError(res, 500, 'Failed to fetch products', error.message);
    res.json(data);
});

// POST /admin/products — add product with image upload
app.post('/admin/products', upload.single('image'), async (req, res) => {
    const { name, price, description } = req.body;

    if (!req.file || !name || !price || !description) {
        return sendError(res, 400, 'Missing fields or image');
    }

    const imageUrl = `http://${LOCAL_IP}:${PORT}/uploads/${req.file.filename}`;

    const { data, error } = await supabase
        .from('products')
        .insert([{ name, price: parseFloat(price), description, image_url: imageUrl }])
        .select()
        .single();

    if (error) return sendError(res, 500, 'Failed to add product', error.message);
    res.status(201).json({ message: 'Product added', product: data });
});

// DELETE /admin/products/:id
app.delete('/admin/products/:id', async (req, res) => {
    const { id } = req.params;

    const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', id);

    if (error) return sendError(res, 500, 'Failed to delete product', error.message);
    res.json({ message: 'Product deleted' });
});

// ============================================================
// CONTACT / MESSAGES API
// ============================================================

// POST /contact — save contact form submission
app.post('/contact', async (req, res) => {
    const { name, email, phone, message } = req.body;

    if (!name || !email || !message) {
        return sendError(res, 400, 'Missing required fields');
    }

    const { error } = await supabase
        .from('messages')
        .insert([{ name, email, phone, message }]);

    if (error) return sendError(res, 500, 'Failed to save message', error.message);
    res.status(201).json({ success: true, message: 'Message received' });
});

// GET /admin/messages — get all contact messages
app.get('/admin/messages', async (req, res) => {
    const { data, error } = await supabase
        .from('messages')
        .select('*')
        .order('date', { ascending: false });

    if (error) return sendError(res, 500, 'Failed to fetch messages', error.message);
    res.json(data);
});

// DELETE /admin/messages/:id
app.delete('/admin/messages/:id', async (req, res) => {
    const { id } = req.params;

    const { error } = await supabase
        .from('messages')
        .delete()
        .eq('id', id);

    if (error) return sendError(res, 500, 'Failed to delete message', error.message);
    res.json({ message: 'Message deleted successfully' });
});

// PATCH /admin/messages/:id/read — mark as read
app.patch('/admin/messages/:id/read', async (req, res) => {
    const { id } = req.params;

    const { error } = await supabase
        .from('messages')
        .update({ read: true })
        .eq('id', id);

    if (error) return sendError(res, 500, 'Failed to mark message as read', error.message);
    res.json({ success: true });
});

// ============================================================
// ADMIN AUTH API
// ============================================================

// POST /admin/login
app.post('/admin/login', async (req, res) => {
    const { username, password } = req.body;

    const { data, error } = await supabase
        .from('admin')
        .select('*')
        .eq('username', username)
        .eq('password_hash', password)
        .single();

    if (error || !data) {
        return res.json({ success: false });
    }
    res.json({ success: true });
});

// POST /admin/check-password
app.post('/admin/check-password', async (req, res) => {
    const { currentPassword } = req.body;

    const { data, error } = await supabase
        .from('admin')
        .select('id')
        .eq('password_hash', currentPassword)
        .single();

    res.json({ valid: !error && !!data });
});

// POST /admin/update-profile
app.post('/admin/update-profile', async (req, res) => {
    const { username, email, newPassword } = req.body;

    if (!username || !email || !newPassword) {
        return sendError(res, 400, 'All fields are required.');
    }

    // Update all admin rows (only one admin exists)
    const { error } = await supabase
        .from('admin')
        .update({ username, email, password_hash: newPassword })
        .not('id', 'is', null); // update all rows

    if (error) return sendError(res, 500, 'Failed to update profile', error.message);
    res.json({ message: 'Profile updated successfully!' });
});

// ============================================================
// PASSWORD RESET — OTP Flow
// ============================================================

// POST /admin/reset-request — send OTP email
app.post('/admin/reset-request', async (req, res) => {
    const { email } = req.body;

    // Check email exists in admin table
    const { data: adminRow, error: findError } = await supabase
        .from('admin')
        .select('email')
        .eq('email', email)
        .single();

    if (findError || !adminRow) {
        return res.status(404).json({ message: 'Admin email not found.' });
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString(); // 10 min

    // Delete old tokens for this email first
    await supabase.from('reset_tokens').delete().eq('email', email);

    // Insert new token
    const { error: insertError } = await supabase
        .from('reset_tokens')
        .insert([{ email, otp, expires_at: expiresAt }]);

    if (insertError) return sendError(res, 500, 'Failed to create reset token', insertError.message);

    // Send OTP email
    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.MAIL_USER,
            pass: process.env.MAIL_PASS,
        },
    });

    const mailOptions = {
        from: `"SweetBee Admin" <${process.env.MAIL_USER}>`,
        to: email,
        subject: 'Your Password Reset Code',
        html: `<p>Your confirmation code is: <b>${otp}</b></p>
               <p>This code will expire in 10 minutes.</p>`,
    };

    transporter.sendMail(mailOptions, (mailError) => {
        if (mailError) {
            console.error('Mail error:', mailError);
            return res.status(500).json({ message: 'Failed to send OTP.' });
        }
        res.json({ message: 'OTP sent to your email.' });
    });
});

// POST /admin/verify-otp
app.post('/admin/verify-otp', async (req, res) => {
    const { email, otp } = req.body;

    const { data: record, error } = await supabase
        .from('reset_tokens')
        .select('*')
        .eq('email', email)
        .eq('otp', otp)
        .single();

    if (error || !record) {
        return res.status(400).json({ success: false, message: 'Invalid OTP.' });
    }
    if (new Date(record.expires_at) < new Date()) {
        await supabase.from('reset_tokens').delete().eq('email', email);
        return res.status(400).json({ success: false, message: 'OTP expired.' });
    }

    // Mark as verified
    await supabase
        .from('reset_tokens')
        .update({ verified: true })
        .eq('email', email);

    res.json({ success: true, message: 'OTP verified. You can now reset your password.' });
});

// POST /admin/reset-password
app.post('/admin/reset-password', async (req, res) => {
    const { email, newPassword } = req.body;

    // Check token is verified
    const { data: record, error } = await supabase
        .from('reset_tokens')
        .select('verified')
        .eq('email', email)
        .single();

    if (error || !record || !record.verified) {
        return res.status(400).json({ success: false, message: 'OTP not verified.' });
    }
    if (!newPassword || newPassword.length < 6) {
        return res.status(400).json({ success: false, message: 'Password must be at least 6 characters.' });
    }

    // Update password
    const { error: updateError } = await supabase
        .from('admin')
        .update({ password_hash: newPassword })
        .eq('email', email);

    if (updateError) return sendError(res, 500, 'Failed to reset password', updateError.message);

    // Delete used token
    await supabase.from('reset_tokens').delete().eq('email', email);

    res.json({ success: true, message: 'Password successfully reset!' });
});

// ============================================================
// Start Server
// ============================================================
app.listen(PORT, () => {
    console.log(`🚀 SweetBee server running at http://${LOCAL_IP}:${PORT}`);
    console.log(`📦 Supabase connected to: ${process.env.SUPABASE_URL || '⚠️  SUPABASE_URL not set'}`);
});
