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

/**************** EXPRESS (MANDATORY FOR RENDER) ****************/
const PORT = process.env.PORT || 3000;
app.listen(PORT)

app.get("/", (req, res) => {
  res.send("Attendance Relay Running");
});

app.listen(PORT, "0.0.0.0", () => {
  console.log("Server running on port " + PORT);
});

/**************** MQTT CONNECT ****************/
const options = {
  username: MQTT_USER,
  password: MQTT_PASS,
  rejectUnauthorized: false,
};

const client = mqtt.connect(`mqtts://${MQTT_HOST}:${MQTT_PORT}`, options);

client.on("connect", () => {
  console.log("Connected to HiveMQ Cloud");
  client.subscribe("attendance/mark", () => {
    console.log("Subscribed to attendance/mark");
  });
});

client.on("message", async (topic, message) => {
  try {
    const data = JSON.parse(message.toString());
    console.log("Received:", data);

    if (!data.name) return;

    const url = `${GOOGLE_URL}?name=${encodeURIComponent(data.name)}`;

    const response = await fetch(url);
    const text = await response.text();

    console.log("Google response:", text);

  } catch (err) {
    console.error("Error:", err);
  }
});