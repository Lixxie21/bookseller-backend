const express = require('express');
const Stripe = require('stripe');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const app = express();

// ✅ CORS CORRECTO
app.use(cors({
    origin: [
        'https://stellular-pika-8681a1.netlify.app',
        'http://localhost:5500',
        'http://127.0.0.1:5500'
    ]
}));

app.use(express.json());

const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

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
            success_url: 'https://stellular-pika-8681a1.netlify.app/success.html',
            cancel_url: 'https://stellular-pika-8681a1.netlify.app/cancel.html',
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
        mode: process.env.STRIPE_SECRET_KEY?.includes('sk_live') ? 'LIVE' : 'TEST',
        message: 'CORS configurado para Netlify'
    });
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
    console.log(`Servidor corriendo en puerto ${PORT}`);
});