# Cloudinary Setup for Product Images

## Problem
Product images were stored locally (`/uploads/`) which:
- ❌ Doesn't work on Render (files get wiped on redeploy)
- ❌ Uses localhost URLs that don't work in production

## Solution
Images now upload to **Cloudinary** (cloud storage), giving you permanent URLs that work everywhere.

---

## Setup Steps

### 1. Create Free Cloudinary Account
1. Go to **https://cloudinary.com**
2. Click "Sign Up for Free"
3. Verify your email

### 2. Get Your Credentials
1. Log in to Cloudinary
2. Go to **Dashboard** (you'll see it immediately after login)
3. Copy these 3 values:
   - **Cloud Name** (e.g., `dxyz123`)
   - **API Key** (e.g., `123456789012345`)
   - **API Secret** (e.g., `abcDEF123xyz_SECRET`)

### 3. Update Local `.env` File
Open `backend/.env` and replace these lines:
```env
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

With your actual credentials:
```env
CLOUDINARY_CLOUD_NAME=dxyz123
CLOUDINARY_API_KEY=123456789012345
CLOUDINARY_API_SECRET=abcDEF123xyz_SECRET
```

### 4. Update Render Environment Variables
1. Go to **Render Dashboard** → Select your backend service
2. Go to **Environment** tab
3. Add these 3 variables (click "Add Environment Variable"):
   - `CLOUDINARY_CLOUD_NAME` = your cloud name
   - `CLOUDINARY_API_KEY` = your API key
   - `CLOUDINARY_API_SECRET` = your API secret
4. Click **Save Changes** (Render will auto-redeploy)

### 5. Test Locally
```bash
cd backend
npm start
```

Then:
1. Open admin panel (`http://localhost:5500/admin/admin.html`)
2. Login with `admin` / `12345678`
3. Go to "Manage Products"
4. Add a new product with an image
5. Check the browser console — you should see: `🌥️ Cloudinary configured: ✅`

### 6. Push to GitHub
```bash
git add backend/.env
git commit -m "Add Cloudinary credentials"
git push origin master
```

⚠️ **IMPORTANT**: Make sure `backend/.env` is in `.gitignore` so your secrets don't get pushed to GitHub!

---

## How It Works

**Before (local storage)**:
```
User uploads → Saved to backend/uploads/ → URL: http://localhost:3001/uploads/abc.jpg
```
❌ Doesn't work on Render (files disappear on redeploy)

**After (Cloudinary)**:
```
User uploads → Uploaded to Cloudinary → URL: https://res.cloudinary.com/dxyz123/image/upload/v1234567/sweetbee-products/abc.jpg
```
✅ Permanent URL that works everywhere!

---

## Verify It's Working

After setup, check:
1. **Server logs** should show: `🌥️ Cloudinary configured: ✅`
2. **New products** should have image URLs like: `https://res.cloudinary.com/...`
3. **Images display** correctly in admin panel and SweetBee website

---

## Free Tier Limits
Cloudinary free tier includes:
- ✅ 25GB storage
- ✅ 25GB bandwidth/month
- ✅ Unlimited transformations

More than enough for a small honey shop! 🍯
