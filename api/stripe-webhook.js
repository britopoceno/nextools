const Stripe = require('stripe');
const admin = require('firebase-admin');

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// Initialize Firebase Admin (Only if not already initialized)
if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert({
            projectId: process.env.FIREBASE_PROJECT_ID,
            clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
            // Replace \n with actual newlines to support Vercel Environment Variables
            privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
        }),
    });
}

const db = admin.firestore();

// Vercel raw body config (required for Stripe webhook signature verification)
export const config = {
    api: {
        bodyParser: false,
    },
};

// Helper function to read the raw body from the incoming request stream
async function buffer(readable) {
    const chunks = [];
    for await (const chunk of readable) {
        chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
    }
    return Buffer.concat(chunks);
}

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        res.setHeader('Allow', 'POST');
        return res.status(405).end('Method Not Allowed');
    }

    const buf = await buffer(req);
    const sig = req.headers['stripe-signature'];
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    let event;

    try {
        // Verify the webhook signature
        event = stripe.webhooks.constructEvent(buf, sig, webhookSecret);
    } catch (err) {
        console.error(`Webhook Error: ${err.message}`);
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    // Handle the checkout.session.completed event
    if (event.type === 'checkout.session.completed') {
        const session = event.data.object;

        // The user UID must be passed via the checkout URL as client_reference_id
        // e.g., https://buy.stripe.com/test_123?client_reference_id=UID
        const firebaseUid = session.client_reference_id;

        if (firebaseUid) {
            try {
                // Update the user's document in Firestore to set isPro to true
                await db.collection('users').doc(firebaseUid).update({
                    isPro: true,
                    proUpdatedAt: admin.firestore.FieldValue.serverTimestamp()
                });

                console.log(`Successfully upgraded user ${firebaseUid} to Pro.`);
            } catch (error) {
                console.error(`Error updating Firestore for UID ${firebaseUid}:`, error);
                return res.status(500).json({ error: 'Database update failed' });
            }
        } else {
            console.warn('No client_reference_id found on the session.');
        }
    }

    // Acknowledge receipt of the event
    res.json({ received: true });
}
