const express = require("express");
const mqtt = require("mqtt");
const fetch = require("node-fetch");

const app = express();

/**************** ENV VARIABLES ****************/
const MQTT_HOST = process.env.MQTT_HOST;
const MQTT_USER = process.env.MQTT_USER;
const MQTT_PASS = process.env.MQTT_PASS;
const MQTT_PORT = process.env.MQTT_PORT || 8883;
const GOOGLE_URL = process.env.GOOGLE_URL;

console.log("MQTT_HOST:", MQTT_HOST);
console.log("MQTT_PORT:", MQTT_PORT);
console.log("MQTT_USER:", MQTT_USER ? "Loaded" : "Missing");
console.log("GOOGLE_URL:", GOOGLE_URL ? "Loaded" : "Missing");

/**************** MQTT CONNECT ****************/
const client = mqtt.connect(`mqtts://${MQTT_HOST}:${MQTT_PORT}`, {
  username: MQTT_USER,
  password: MQTT_PASS,
  rejectUnauthorized: false,
  reconnectPeriod: 5000
});

client.on("connect", () => {
  console.log("Connected to HiveMQ Cloud");

  client.subscribe("attendance/mark", (err) => {
    if (err) console.log("Subscribe error:", err);
    else console.log("Subscribed to attendance/mark");
  });
});

client.on("error", (err) => {
  console.error("MQTT ERROR:", err);
});

/**************** SAFE GOOGLE SEND ****************/
async function sendToGoogle(data) {

  const sheetName = data.sheet || "iiot theory";

  const url = `${GOOGLE_URL}?name=${encodeURIComponent(data.name)}&sheet=${encodeURIComponent(sheetName)}`;

  console.log("Sending to Google:", url);

  try {

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timeout);

    const text = await response.text();

    console.log("Google response:", text);

    if (response.status === 200) {
      return { success: true };
    } else {
      return { success: false, error: "Bad HTTP status" };
    }

  } catch (err) {
    console.error("Google fetch error:", err.message);
    return { success: false, error: err.message };
  }
}

/**************** MESSAGE HANDLER ****************/
client.on("message", async (topic, message) => {

  let data;

  try {
    data = JSON.parse(message.toString());
  } catch (err) {
    console.error("Invalid JSON:", err);
    return;
  }

  console.log("Received:", data);

  if (!data.id) {
    console.log("Missing message ID");
    return;
  }

  const result = await sendToGoogle(data);

  const ackPayload = {
    id: data.id,
    status: result.success ? "SUCCESS" : "FAILED"
  };

  client.publish("attendance/ack", JSON.stringify(ackPayload));

  console.log("ACK sent:", ackPayload);
});

/**************** EXPRESS FOR RENDER ****************/
const PORT = process.env.PORT || 3000;

app.get("/", (req, res) => {
  res.send("Attendance Relay Running");
});

app.listen(PORT, "0.0.0.0", () => {
  console.log("Server running on port " + PORT);
});