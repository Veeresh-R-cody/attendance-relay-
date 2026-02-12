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
    if (err) {
      console.log("Subscribe error:", err);
    } else {
      console.log("Subscribed to attendance/mark");
    }
  });
});

client.on("error", (err) => {
  console.error("MQTT ERROR:", err);
});

client.on("message", async (topic, message) => {
  try {
    const data = JSON.parse(message.toString());
    console.log("Received:", data);

    if (!data.name) {
      console.log("No name provided");
      return;
    }

    const url = `${GOOGLE_URL}?name=${encodeURIComponent(data.name)}`;
    const response = await fetch(url);
    const text = await response.text();

    console.log("Google response:", text);

  } catch (err) {
    console.error("Message handling error:", err);
  }
});

/**************** EXPRESS (MANDATORY FOR RENDER) ****************/
const PORT = process.env.PORT || 3000;

app.get("/", (req, res) => {
  res.send("Attendance Relay Running");
});

app.listen(PORT, "0.0.0.0", () => {
  console.log("Server running on port " + PORT);
});