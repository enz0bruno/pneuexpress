import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import cors from "cors";
import bodyParser from "body-parser";
import Stripe from "stripe";

// Initialize Stripe lazily
let stripe: Stripe | null = null;
const getStripe = () => {
  if (!stripe) {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) {
      console.warn("STRIPE_SECRET_KEY is not set. Stripe features will be disabled.");
      return null;
    }
    stripe = new Stripe(key);
  }
  return stripe;
};

// In-memory store for orders (replace with a database for production)
const orders: Record<string, { 
  id: string, 
  status: 'pending' | 'confirmed' | 'processing', 
  amount: number,
  items: any[],
  customer: any,
  date: Date
}> = {};

// PIX Generator Helper
function generatePixPayload(key: string, name: string, city: string, amount: number, txid: string) {
  const formatField = (id: string, value: string) => {
    const len = value.length.toString().padStart(2, '0');
    return `${id}${len}${value}`;
  };

  const merchantAccountInfo = 
    formatField('00', 'br.gov.bcb.pix') + 
    formatField('01', key);

  const payload = [
    formatField('00', '01'), // Payload Format Indicator
    formatField('26', merchantAccountInfo),
    formatField('52', '0000'), // Merchant Category Code
    formatField('53', '986'),  // Transaction Currency (BRL)
    formatField('54', amount.toFixed(2)), // Transaction Amount
    formatField('58', 'BR'),   // Country Code
    formatField('59', name.substring(0, 25)), // Merchant Name (max 25)
    formatField('60', city.substring(0, 15)), // Merchant City (max 15)
    formatField('62', formatField('05', txid)), // Additional Data Field (TXID)
  ].join('');

  const withCrcPlaceholder = payload + '6304';
  
  // CRC16 CCITT-FALSE
  let crc = 0xFFFF;
  for (let i = 0; i < withCrcPlaceholder.length; i++) {
    crc ^= withCrcPlaceholder.charCodeAt(i) << 8;
    for (let j = 0; j < 8; j++) {
      if ((crc & 0x8000) !== 0) {
        crc = ((crc << 1) ^ 0x1021) & 0xFFFF;
      } else {
        crc = (crc << 1) & 0xFFFF;
      }
    }
  }
  const crcHex = crc.toString(16).toUpperCase().padStart(4, '0');
  return withCrcPlaceholder + crcHex;
}

// InfinitePay Integration Helper
const createInfinitePayPix = async (amount: number, orderId: string) => {
  const apiKey = process.env.INFINITEPAY_API_KEY;
  if (!apiKey || apiKey.trim() === "" || apiKey.includes("YOUR_")) {
    throw new Error("InfinitePay API Key is missing or invalid in Settings > Secrets.");
  }

  try {
    const url = "https://api.infinitepay.io/v1/pix/transactions";
    console.log(`Calling InfinitePay API: POST ${url} for Order ${orderId}`);
    
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey.trim()}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        amount: Math.round(amount * 100), // InfinitePay expects cents
        order_id: orderId,
        metadata: {
          external_id: orderId,
        },
      }),
    });

    const responseText = await response.text();
    let data;
    try {
      data = JSON.parse(responseText);
    } catch (e) {
      console.error("InfinitePay Response is not JSON (HTML detected):", responseText.substring(0, 500));
      if (response.status === 401 || response.status === 403) {
        throw new Error("InfinitePay API Key is unauthorized. Please check if the token is correct and has PIX permissions.");
      }
      if (response.status === 404) {
        throw new Error("InfinitePay API endpoint not found. Please verify the API URL.");
      }
      throw new Error(`InfinitePay API returned an HTML error (Status: ${response.status}). This usually means the API Key is invalid or the service is unavailable.`);
    }

    if (!response.ok) {
      throw new Error(data.message || data.error || `InfinitePay Error: ${response.status} - ${responseText.substring(0, 100)}`);
    }

    return {
      pixCode: data.pix_code || data.brcode || data.pix_payload,
      qrCodeData: data.pix_code || data.brcode || data.pix_payload,
      paymentId: data.id || data.transaction_id,
    };
  } catch (error: any) {
    console.error("InfinitePay API Error Details:", error.message);
    throw error;
  }
};

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(cors());
  app.use(bodyParser.json());

  // --- API Routes for Payment Integration ---

  // Endpoint to create a Stripe Checkout Session
  app.post("/api/create-checkout-session", async (req, res) => {
    const { items, successUrl, cancelUrl, customer } = req.body;
    const stripeInstance = getStripe();

    if (!stripeInstance) {
      return res.status(500).json({ error: "Stripe is not configured." });
    }

    try {
      const session = await stripeInstance.checkout.sessions.create({
        payment_method_types: ["card"],
        line_items: items.map((item: any) => ({
          price_data: {
            currency: "brl",
            product_data: {
              name: `${item.brand} ${item.size}`,
              images: [item.image.startsWith('http') ? item.image : `${process.env.APP_URL}${item.image}`],
            },
            unit_amount: Math.round(item.price * 100),
          },
          quantity: item.qty,
        })),
        mode: "payment",
        success_url: successUrl,
        cancel_url: cancelUrl,
        customer_email: customer?.email,
      });

      // Store order as pending
      const orderId = Math.random().toString(36).substring(2, 10).toUpperCase();
      orders[orderId] = {
        id: orderId,
        status: 'pending',
        amount: items.reduce((acc: number, item: any) => acc + (item.price * item.qty), 0),
        items,
        customer,
        date: new Date()
      };

      res.json({ id: session.id, orderId });
    } catch (error: any) {
      console.error("Error creating Stripe session:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Endpoint to create a PIX payment
  app.post("/api/payment/create", async (req, res) => {
    const { amount, items, customer } = req.body;
    const orderId = Math.random().toString(36).substring(2, 10).toUpperCase();
    
    // Store the order
    orders[orderId] = {
      id: orderId,
      status: 'pending',
      amount: amount,
      items,
      customer,
      date: new Date()
    };

    try {
      // Use InfinitePay API if configured, otherwise fallback to manual (for testing)
      if (process.env.INFINITEPAY_API_KEY) {
        const infinitePayData = await createInfinitePayPix(amount, orderId);
        
        // Update order with InfinitePay's internal ID if needed
        // orders[orderId].infinitePayId = infinitePayData.paymentId;

        res.json({
          paymentId: orderId,
          qrCodeData: infinitePayData.qrCodeData,
          pixCode: infinitePayData.pixCode,
          expiresIn: 3600
        });
      } else {
        // Fallback to manual PIX generator (using the user's key from environment)
        const pixKey = process.env.PIX_KEY || "pneu_expressbr@jim.com";
        const merchantName = "Pneu Express Br";
        const merchantCity = "SAO PAULO";
        
        const pixCode = generatePixPayload(pixKey, merchantName, merchantCity, amount, orderId);
        const qrCodeData = pixCode;

        res.json({
          paymentId: orderId,
          qrCodeData,
          pixCode,
          expiresIn: 3600
        });
      }
    } catch (error: any) {
      console.error("Error creating PIX payment:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Endpoint to check order status
  app.get("/api/payment/status/:id", (req, res) => {
    const { id } = req.params;
    const order = orders[id];

    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    res.json({ status: order.status });
  });

  // Endpoint for customer to notify payment
  app.post("/api/payment/notify", (req, res) => {
    const { orderId } = req.body;
    if (orders[orderId]) {
      orders[orderId].status = 'processing'; // Customer says they paid, merchant needs to check
      res.json({ success: true });
    } else {
      res.status(404).json({ error: "Order not found" });
    }
  });

  // Admin endpoint to see all orders
  app.get("/api/admin/orders", (req, res) => {
    res.json(Object.values(orders).sort((a, b) => b.date.getTime() - a.date.getTime()));
  });

  // Admin endpoint to confirm payment
  app.post("/api/admin/confirm-payment", (req, res) => {
    const { orderId } = req.body;
    if (orders[orderId]) {
      orders[orderId].status = 'confirmed';
      res.json({ success: true });
    } else {
      res.status(404).json({ error: "Order not found" });
    }
  });

  // Webhook for InfinitePay (simplified)
  app.post("/api/payment/webhook", (req, res) => {
    const { event, data } = req.body;
    
    // InfinitePay sends events like 'pix.transaction.confirmed'
    if (event === 'pix.transaction.confirmed') {
      const orderId = data.external_id;
      if (orders[orderId]) {
        orders[orderId].status = 'confirmed';
        console.log(`Order ${orderId} confirmed via InfinitePay Webhook`);
      }
    }

    // Also handle general webhook format if needed
    const { paymentId, status, orderId } = req.body;
    const id = orderId || paymentId;
    if (orders[id]) {
      orders[id].status = status;
      res.json({ success: true });
    } else {
      res.status(404).json({ error: "Order not found" });
    }
  });

  // --- Vite Middleware ---

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
