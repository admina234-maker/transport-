import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Initialize Google GenAI client (server-side only)
const getGenAI = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.warn("GEMINI_API_KEY is not set in environment variables.");
  }
  return new GoogleGenAI({
    apiKey: apiKey || "",
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
};

// API: Health check
app.get("/api/health", (_req, res) => {
  res.json({
    status: "ok",
    school: "Wisdom Nursery and Primary School",
    contactPerson: "Mr. R SARAVANAN",
    contactPhone: "9176593129",
    upiId: "rsaravanan102002-1@okhdfcbank",
    timestamp: new Date().toISOString(),
  });
});

// API: Gemini AI Transport & Parent Assistant
app.post("/api/gemini/assistant", async (req, res) => {
  try {
    const { prompt, context } = req.body;
    if (!prompt) {
      return res.status(400).json({ error: "Prompt is required" });
    }

    const ai = getGenAI();
    const systemInstruction = `You are the AI Helpdesk Assistant for Wisdom Nursery and Primary School, Essur.
School Details:
- Name: Wisdom Nursery and Primary School, Essur
- Motto: LEARN TODAY, LEAD TOMORROW.
- Transport Manager / Contact Person: Mr. R SARAVANAN (Mobile: +91 9176593129)
- Location: Essur, near Cheyyar / Vandavasi, Tamil Nadu, India.
- UPI ID for online payments: rsaravanan102002-1@okhdfcbank (Account Holder: R Saravanan)

Key Responsibilities:
1. Answer parent questions regarding school bus tracking, van routes, arrival times, student safety, and RFID attendance.
2. Explain transport fee calculation structure (Distance based: 0-5km ₹800/mo, 5-10km ₹1200/mo, 10-15km ₹1600/mo, 15+km ₹2000/mo; Van 1x, Force Traveller 1.1x, Bus 1.25x multiplier).
3. Assist with payment status, school term fees (Nursery ₹12,000/term, Primary ₹15,000/term), and instant UPI receipt confirmation.
4. Keep replies polite, reassuring, professional, and clear. Always offer to connect parents with Mr. R SARAVANAN at 9176593129 if urgent.`;

    const fullPrompt = context 
      ? `[Current Context: ${JSON.stringify(context)}]\n\nUser Question: ${prompt}`
      : prompt;

    const response = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents: fullPrompt,
      config: {
        systemInstruction,
        temperature: 0.7,
      },
    });

    res.json({ text: response.text });
  } catch (error: any) {
    console.error("Gemini Assistant Error:", error);
    res.status(500).json({
      error: "Failed to query Wisdom Transport Assistant",
      message: error?.message || "Internal server error",
    });
  }
});

// API: Gemini AI Route Optimization
app.post("/api/gemini/optimize-route", async (req, res) => {
  try {
    const { vehicleType, stops, startLocation } = req.body;
    const ai = getGenAI();

    const prompt = `Re-order and optimize the pickup sequence for school van/bus to minimize travel distance and fuel consumption.
Start location: ${startLocation || "Wisdom Nursery & Primary School, Essur"}
Vehicle Type: ${vehicleType || "14-Seater Van"}
Current Stops: ${JSON.stringify(stops || [])}

Respond with JSON containing:
- optimizedSequence: array of stop names in ideal pickup order
- estimatedTotalKm: estimated distance in km
- estimatedTotalTimeMins: estimated travel duration
- recommendations: string summarizing route safety & speed tips.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      },
    });

    try {
      const data = JSON.parse(response.text || "{}");
      res.json(data);
    } catch {
      res.json({ raw: response.text });
    }
  } catch (error: any) {
    console.error("Gemini Route Optimize Error:", error);
    res.status(500).json({ error: "Failed to optimize route", message: error?.message });
  }
});

// API: Verify simulated UPI payment
app.post("/api/payments/verify-upi", (req, res) => {
  const { studentId, studentName, amount, utrNumber, paymentMethod, feeType } = req.body;
  
  if (!studentId || !amount || !utrNumber) {
    return res.status(400).json({ error: "Missing transaction details" });
  }

  const receiptNumber = "WIS-" + Math.floor(100000 + Math.random() * 900000);
  const timestamp = new Date().toISOString();

  res.json({
    success: true,
    message: "Payment recorded successfully",
    receipt: {
      receiptNumber,
      schoolName: "Wisdom Nursery and Primary School",
      address: "Essur, Tamil Nadu",
      motto: "LEARN TODAY, LEAD TOMORROW.",
      contactPerson: "Mr. R SARAVANAN (9176593129)",
      upiId: "rsaravanan102002-1@okhdfcbank",
      studentId,
      studentName,
      amountPaid: amount,
      utrNumber,
      paymentMethod: paymentMethod || "UPI Transfer",
      feeType: feeType || "Transport & School Fees",
      paymentDate: new Date().toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }),
      status: "VERIFIED & CONFIRMED"
    }
  });
});

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Wisdom School Transport Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
