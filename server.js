const express = require('express');
const Stripe = require('stripe');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const app = express();

// ✅ CONFIGURACIÓN CORS CORRECTA
app.use(cors({
    origin: [
        'https://stellular-pika-8681a1.netlify.app',  // TU NETLIFY
        'http://localhost:5500',
        'http://127.0.0.1:5500',
        'https://railway.com'  // Para pruebas internas
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

app.use(express.json());

// Middleware para logging (opcional, ayuda a debuggear)
app.use((req, res, next) => {
    console.log(`${req.method} ${req.path} - Origin: ${req.headers.origin}`);
    next();
});

app.post('/create-checkout-session', async (req, res) => {
    try {
        const { items } = req.body;
        
        const lineItems = items.map(item => ({
            price_data: {
                currency: 'usd',
                product_data: {
                    name: item.title,
                    description: `by ${item.author}`,
                },
                unit_amount: Math.round(item.price * 100),
            },
            quantity: item.quantity,
        }));

        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: lineItems,
            mode: 'payment',
            success_url: `${process.env.FRONTEND_URL || 'https://stellular-pika-8681a1.netlify.app'}/success.html`,
            cancel_url: `${process.env.FRONTEND_URL || 'https://stellular-pika-8681a1.netlify.app'}/cancel.html`,
        });

        res.json({ id: session.id });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: error.message });
    }
});

app.get('/health', (req, res) => {
    res.json({ 
        status: 'ok', 
        mode: process.env.STRIPE_SECRET_KEY.includes('sk_live') ? 'LIVE' : 'TEST',
        allowedOrigins: [
            'https://stellular-pika-8681a1.netlify.app',
            'http://localhost:5500'
        ]
    });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor corriendo en puerto ${PORT}`);
    console.log(`CORS permitido para: https://stellular-pika-8681a1.netlify.app`);
});