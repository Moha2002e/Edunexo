import express from 'express';
import cors from 'cors';
import Stripe from 'stripe';
import admin from 'firebase-admin';
import path from 'path';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// Load environment variables
dotenv.config();

const stripe = new Stripe('sk_test_YOUR_STRIPE_SECRET_KEY'); // ⚠️ REPLACE ME or use process.env.STRIPE_KEY

// Recreate __dirname for ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Initialize Firebase Admin
// const serviceAccount = await import('./service-account.json', { assert: { type: 'json' } });
// admin.initializeApp({
//   credential: admin.credential.cert(serviceAccount.default)
// });
// admin.initializeApp(); 

const app = express();

// Serve static files from the 'dist' directory (Vite build)
app.use(express.static(path.join(__dirname, 'dist')));

// Use JSON parser for all non-webhook routes
app.use((req, res, next) => {
    if (req.originalUrl === '/webhook') {
        next();
    } else {
        express.json()(req, res, next);
    }
});

app.use(cors());

// Stripe Webhook needs special handling (raw body) but we already handle it in the middleware above via express.json exclusion
// We can add specific routes here if needed for API

// Handle SPA routing: serve index.html for any unknown route
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

const PORT = process.env.PORT || 4242;
app.listen(PORT, () => console.log(`Node server running on port ${PORT}`));
