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

// Configure Stripe with Secret Key from .env
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// Recreate __dirname for ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

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

// Create Checkout Route
app.post('/create-checkout-session', async (req, res) => {
    const { planId, uid } = req.body;

    // In production, you might map the planId to a priceId from .env
    // const priceId = process.env.STRIPE_PRICE_ID; 

    try {
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: [
                {
                    price: planId, // The ID from Stripe Dashboard (e.g., price_123xyz)
                    quantity: 1,
                },
            ],
            mode: 'subscription',
            success_url: `${req.headers.origin}/premium?success=true`,
            cancel_url: `${req.headers.origin}/premium?canceled=true`,
            metadata: {
                firebaseUID: uid // Important: to link payment to user in the webhook
            }
        });

        res.json({ url: session.url });
    } catch (e) {
        console.error("Stripe Error:", e);
        res.status(500).json({ error: e.message });
    }
});

// Handle SPA routing: serve index.html for any unknown route
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

const PORT = process.env.PORT || 4242;
app.listen(PORT, () => console.log(`Node server running on port ${PORT}`));
