const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const nodemailer = require('nodemailer');
const { MongoClient, ObjectId } = require('mongodb');
const { v2: cloudinary } = require('cloudinary');
require('dotenv').config();

// Force TLS workaround for Render deployment
if (process.env.NODE_ENV === 'production') {
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
}

const app = express();
const PORT = process.env.PORT || 3001;
const LOCAL_IP = process.env.LOCAL_IP || 'localhost';

// ============================================================
// Cloudinary Configuration
// ============================================================
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});
console.log('🌥️  Cloudinary configured:', process.env.CLOUDINARY_CLOUD_NAME ? '✅' : '❌ Missing credentials');

// ============================================================
// MongoDB Connection
// ============================================================
let db;

async function connectDB() {
    const client = new MongoClient(process.env.MONGODB_URI);
    await client.connect();
    db = client.db('sweetbee');
    console.log('✅ Connected to MongoDB Atlas');
}

// Collections (equivalent to SQL tables)
const col = {
    products:  () => db.collection('products'),
    messages:  () => db.collection('messages'),
    admin:     () => db.collection('admin'),
    resetTokens: () => db.collection('reset_tokens'),
};

// ============================================================
// Middleware
// ============================================================
app.use(cors({
    origin: [
        'http://localhost:5500',
        'http://localhost:3000',
        'http://127.0.0.1:5500',
        /\.vercel\.app$/,
        /\.onrender\.com$/,
    ],
    credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ============================================================
// Multer — memory storage for Cloudinary upload
// ============================================================
const storage = multer.memoryStorage();
const upload = multer({
    storage,
    limits: { fileSize: 10 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        const ok = /jpeg|jpg|png|gif|webp/.test(path.extname(file.originalname).toLowerCase());
        cb(ok ? null : new Error('Only image files allowed'), ok);
    },
});

// ============================================================
// Helper
// ============================================================
function sendError(res, status, message) {
    return res.status(status).json({ success: false, message });
}

// ============================================================
// PRODUCTS API
// ============================================================

// GET all products (newest first)
app.get('/admin/products', async (req, res) => {
    try {
        const products = await col.products().find().sort({ createdAt: -1 }).toArray();
        // Map _id to id for frontend compatibility
        res.json(products.map(p => ({ ...p, id: p._id.toString() })));
    } catch (e) {
        sendError(res, 500, 'Failed to fetch products');
    }
});

// POST add product with image
app.post('/admin/products', upload.single('image'), async (req, res) => {
    const { name, price, description } = req.body;
    if (!req.file || !name || !price || !description) {
        return sendError(res, 400, 'Missing fields or image');
    }
    try {
        // Upload to Cloudinary
        const uploadStream = cloudinary.uploader.upload_stream(
            { folder: 'sweetbee-products', resource_type: 'image' },
            async (error, result) => {
                if (error) {
                    console.error('❌ Cloudinary upload error:', error);
                    return sendError(res, 500, 'Failed to upload image');
                }

                // Save product with Cloudinary URL
                const product = {
                    name,
                    price: parseFloat(price),
                    description,
                    imageUrl: result.secure_url,
                    cloudinaryId: result.public_id,
                    createdAt: new Date(),
                };

                const dbResult = await col.products().insertOne(product);
                res.status(201).json({
                    message: 'Product added',
                    product: { ...product, id: dbResult.insertedId.toString() },
                });
            }
        );

        // Pipe the buffer to Cloudinary
        uploadStream.end(req.file.buffer);
    } catch (e) {
        console.error('❌ Product add error:', e);
        sendError(res, 500, 'Failed to add product');
    }
});

// DELETE product
app.delete('/admin/products/:id', async (req, res) => {
    try {
        const product = await col.products().findOne({ _id: new ObjectId(req.params.id) });
        
        // Delete from Cloudinary if public_id exists
        if (product?.cloudinaryId) {
            try {
                await cloudinary.uploader.destroy(product.cloudinaryId);
                console.log('🗑️  Deleted from Cloudinary:', product.cloudinaryId);
            } catch (cloudErr) {
                console.warn('⚠️  Failed to delete from Cloudinary:', cloudErr.message);
            }
        }

        // Delete from MongoDB
        await col.products().deleteOne({ _id: new ObjectId(req.params.id) });
        res.json({ message: 'Product deleted' });
    } catch (e) {
        console.error('❌ Delete error:', e);
        sendError(res, 500, 'Failed to delete product');
    }
});

// ============================================================
// MESSAGES API
// ============================================================

// POST contact form
app.post('/contact', async (req, res) => {
    const { name, email, phone, message } = req.body;
    if (!name || !email || !message) return sendError(res, 400, 'Missing required fields');
    try {
        await col.messages().insertOne({ name, email, phone, message, date: new Date(), read: false });
        res.status(201).json({ success: true, message: 'Message received' });
    } catch (e) {
        sendError(res, 500, 'Failed to save message');
    }
});

// GET all messages
app.get('/admin/messages', async (req, res) => {
    try {
        const messages = await col.messages().find().sort({ date: -1 }).toArray();
        res.json(messages.map(m => ({ ...m, id: m._id.toString() })));
    } catch (e) {
        sendError(res, 500, 'Failed to fetch messages');
    }
});

// DELETE message
app.delete('/admin/messages/:id', async (req, res) => {
    try {
        await col.messages().deleteOne({ _id: new ObjectId(req.params.id) });
        res.json({ message: 'Message deleted successfully' });
    } catch (e) {
        sendError(res, 500, 'Failed to delete message');
    }
});

// PATCH mark message as read
app.patch('/admin/messages/:id/read', async (req, res) => {
    try {
        await col.messages().updateOne({ _id: new ObjectId(req.params.id) }, { $set: { read: true } });
        res.json({ success: true });
    } catch (e) {
        sendError(res, 500, 'Failed to update message');
    }
});

// ============================================================
// ADMIN AUTH
// ============================================================

// Seed default admin if none exists
async function seedAdmin() {
    const exists = await col.admin().findOne({});
    if (!exists) {
        await col.admin().insertOne({
            username: process.env.DEFAULT_ADMIN_USERNAME || 'admin',
            password: process.env.DEFAULT_ADMIN_PASSWORD || 'admin1234',
            email: process.env.DEFAULT_ADMIN_EMAIL || 'amanualegezahegne2066@gmail.com',
        });
        console.log('🔑 Default admin created');
    }
}

// POST login
app.post('/admin/login', async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) return res.json({ success: false });
    const admin = await col.admin().findOne({ username });
    if (!admin) return res.json({ success: false });
    res.json({ success: admin.password === password });
});

// POST check current password
app.post('/admin/check-password', async (req, res) => {
    const { currentPassword } = req.body;
    const admin = await col.admin().findOne({ password: currentPassword });
    res.json({ valid: !!admin });
});

// POST update profile
app.post('/admin/update-profile', async (req, res) => {
    const { username, email, newPassword } = req.body;
    if (!username || !email || !newPassword) return sendError(res, 400, 'All fields are required.');
    try {
        await col.admin().updateOne({}, { $set: { username, email, password: newPassword } });
        res.json({ message: 'Profile updated successfully!' });
    } catch (e) {
        sendError(res, 500, 'Failed to update profile');
    }
});

// ============================================================
// PASSWORD RESET — OTP Flow
// ============================================================

// POST send OTP
app.post('/admin/reset-request', async (req, res) => {
    const { email } = req.body;
    const admin = await col.admin().findOne({ email });
    if (!admin) return res.status(404).json({ message: 'Admin email not found.' });

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    await col.resetTokens().deleteMany({ email });
    await col.resetTokens().insertOne({ email, otp, expiresAt, verified: false });

    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: { user: process.env.MAIL_USER, pass: process.env.MAIL_PASS },
    });

    transporter.sendMail({
        from: `"SweetBee Admin" <${process.env.MAIL_USER}>`,
        to: email,
        subject: 'Your Password Reset Code',
        html: `<p>Your confirmation code is: <b>${otp}</b></p><p>Expires in 10 minutes.</p>`,
    }, (err) => {
        if (err) return res.status(500).json({ message: 'Failed to send OTP.' });
        res.json({ message: 'OTP sent to your email.' });
    });
});

// POST verify OTP
app.post('/admin/verify-otp', async (req, res) => {
    const { email, otp } = req.body;
    const record = await col.resetTokens().findOne({ email, otp });
    if (!record) return res.status(400).json({ success: false, message: 'Invalid OTP.' });
    if (record.expiresAt < new Date()) {
        await col.resetTokens().deleteMany({ email });
        return res.status(400).json({ success: false, message: 'OTP expired.' });
    }
    await col.resetTokens().updateOne({ email }, { $set: { verified: true } });
    res.json({ success: true, message: 'OTP verified.' });
});

// POST reset password
app.post('/admin/reset-password', async (req, res) => {
    const { email, newPassword } = req.body;
    const record = await col.resetTokens().findOne({ email, verified: true });
    if (!record) return res.status(400).json({ success: false, message: 'OTP not verified.' });
    if (!newPassword || newPassword.length < 6) {
        return res.status(400).json({ success: false, message: 'Password must be at least 6 characters.' });
    }
    await col.admin().updateOne({ email }, { $set: { password: newPassword } });
    await col.resetTokens().deleteMany({ email });
    res.json({ success: true, message: 'Password successfully reset!' });
});

// ============================================================
// Start Server
// ============================================================
connectDB()
    .then(() => seedAdmin())
    .then(() => {
        app.listen(PORT, () => {
            console.log(`🚀 SweetBee server running at http://${LOCAL_IP}:${PORT}`);
        });
    })
    .catch(err => {
        console.error('❌ Failed to connect to MongoDB:', err.message);
        process.exit(1);
    });
