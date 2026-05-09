/**
 * Test script: sends a pickup confirmation email exactly as CheckOutPage does.
 * Run with: node scripts/test-pickup-email.js
 */

const https = require("https");

const SERVICE_ID = "service_9c0n1nd";
const TEMPLATE_ID = "template_l6tqa0l";
const USER_KEY = "oauDokO6GGZB-3gT1";

const testOrderId = "TEST-" + Date.now();

const pickupData = {
  address: "528 N Stone Ridge Dr, Saratoga Springs, UT 84045",
  hours: "6pm - 10pm",
  instructions: "Text (385) 394-8018 with the day and your ETA for pickup.",
};

const pickupMessage = [
  `Your order #${testOrderId} is confirmed for local pickup.`,
  "",
  `Pickup Location: ${pickupData.address}`,
  `Hours: ${pickupData.hours}`,
  `Note: ${pickupData.instructions}`,
  "",
  "We'll reach out when your order is ready. Thank you!",
].join("\n");

const templateParams = {
  service_id: SERVICE_ID,
  template_id: TEMPLATE_ID,
  user_id: USER_KEY,
  template_params: {
    firstName: "Test",
    lastName: "Customer",
    email: "givebackjojo.chegallegos@gmail.com", // sends to your own inbox
    phone: "(385) 000-0000",
    role: "Order Pickup Confirmation",
    message: pickupMessage,
  },
};

const body = JSON.stringify(templateParams);

const options = {
  hostname: "api.emailjs.com",
  path: "/api/v1.0/email/send",
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "Content-Length": Buffer.byteLength(body),
  },
};

console.log("Sending test pickup email...\n");
console.log("--- Email Preview ---");
console.log(pickupMessage);
console.log("---------------------\n");

const req = https.request(options, (res) => {
  let data = "";
  res.on("data", (chunk) => (data += chunk));
  res.on("end", () => {
    if (res.statusCode === 200) {
      console.log("Success! Email sent to givebackjojo.chegallegos@gmail.com");
    } else {
      console.error(`Failed (${res.statusCode}):`, data);
    }
  });
});

req.on("error", (e) => console.error("Request error:", e.message));
req.write(body);
req.end();
