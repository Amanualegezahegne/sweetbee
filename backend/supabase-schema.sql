-- Supabase Database Schema for SweetBee Honey Shop
-- Run this in your Supabase SQL Editor

-- ============================================
-- 1. ADMIN TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS admin (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default admin (password: 'admin1234' - you should change this!)
INSERT INTO admin (username, password_hash, email)
VALUES ('admin', 'aman2066', 'amanualegezahegne2066@gmail.com')
ON CONFLICT (username) DO NOTHING;

-- ============================================
-- 2. PRODUCTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    price NUMERIC(10, 2) NOT NULL,
    description TEXT,
    image_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_products_created_at ON products(created_at DESC);

-- ============================================
-- 3. MESSAGES (CONTACT FORM) TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    message TEXT NOT NULL,
    date TIMESTAMPTZ DEFAULT NOW(),
    read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_messages_date ON messages(date DESC);
CREATE INDEX IF NOT EXISTS idx_messages_read ON messages(read);

-- ============================================
-- 4. PASSWORD RESET TOKENS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS reset_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT NOT NULL,
    otp TEXT NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for cleanup and fast lookups
CREATE INDEX IF NOT EXISTS idx_reset_tokens_email ON reset_tokens(email);
CREATE INDEX IF NOT EXISTS idx_reset_tokens_expires ON reset_tokens(expires_at);

-- Automatically delete expired tokens (runs daily)
CREATE OR REPLACE FUNCTION delete_expired_tokens()
RETURNS void AS $$
BEGIN
    DELETE FROM reset_tokens WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 5. ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================

-- Enable RLS on all tables
ALTER TABLE admin ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE reset_tokens ENABLE ROW LEVEL SECURITY;

-- Admin table: Only service role can access (no public access)
CREATE POLICY "Admin access via service role only"
    ON admin FOR ALL
    USING (auth.role() = 'service_role');

-- Products: Public can read, service role can modify
CREATE POLICY "Public can read products"
    ON products FOR SELECT
    USING (true);

CREATE POLICY "Service role can insert products"
    ON products FOR INSERT
    WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Service role can update products"
    ON products FOR UPDATE
    USING (auth.role() = 'service_role');

CREATE POLICY "Service role can delete products"
    ON products FOR DELETE
    USING (auth.role() = 'service_role');

-- Messages: Public can insert, service role can read/delete
CREATE POLICY "Public can insert messages"
    ON messages FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Service role can read messages"
    ON messages FOR SELECT
    USING (auth.role() = 'service_role');

CREATE POLICY "Service role can delete messages"
    ON messages FOR DELETE
    USING (auth.role() = 'service_role');

-- Reset tokens: Service role only
CREATE POLICY "Service role can manage reset tokens"
    ON reset_tokens FOR ALL
    USING (auth.role() = 'service_role');

-- ============================================
-- 6. UPDATED_AT TRIGGER
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_admin_updated_at
    BEFORE UPDATE ON admin
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_products_updated_at
    BEFORE UPDATE ON products
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 7. MIGRATE EXISTING DATA (Optional - run after schema)
-- ============================================

-- Insert existing products
-- INSERT INTO products (id, name, price, description, image_url)
-- VALUES 
--     ('a1db2522-fe09-4c58-a899-648908c825a6', 'tazma', 2500, 'enjoy the true feeling', 'http://localhost:3001/uploads/1753258926671-pic4.jpg'),
--     ('7abc90ba-9346-48f0-a6a2-56b61f3cc358', 'white honey', 2500, 'loved by nature', 'http://192.168.125.11:3001/uploads/1759299749782-pic2.jpg');

-- Insert existing messages
-- INSERT INTO messages (id, name, email, phone, message, date)
-- VALUES
--     ('4746b1c2-1aae-4ea0-af8a-b081bda983a2', 'amanuale gezahegne', 'amanualegezahegne2066@gmail.com', '+251920663555', 'we love to hear more from you my boyy', '2025-10-01T06:24:25.655Z'),
--     ('d5c49d4f-7dad-4f18-9a58-f377766f9794', 'aman shewa', 'amanualegezahegne3551@gmail.com', '+251920663554', 'i love the honey and i want more of you', '2025-10-31T16:25:23.421Z');
