import mqtt from "mqtt";
import fetch from "node-fetch";

const MQTT_URL = "mqtts://d7d7430cfc2e4c6b9a6d3f042f72a73c.s1.eu.hivemq.cloud:8883";

const MQTT_OPTIONS = {
  username: "hivemq.webclient.1767167420952",
  password: "i9Ffb;?#UaVDz2EC5@h3",
  rejectUnauthorized: false
};

const GOOGLE_URL = "https://script.google.com/macros/s/AKfycbx3B8gEdEKly5XCWniFFrQ1B-C4pg4qgD14fLtvkQPgSQH7guY6w-frZgpoBabAloIn/exec";

const client = mqtt.connect(MQTT_URL, MQTT_OPTIONS);

client.on("connect", () => {
  console.log("Connected to HiveMQ Cloud");
  client.subscribe("attendance/mark");
});

client.on("message", async (topic, message) => {
  try {
    const data = JSON.parse(message.toString());
    console.log("Received:", data);

    const url = GOOGLE_URL + "?name=" + encodeURIComponent(data.name);

    const response = await fetch(url);
    const text = await response.text();

    console.log("Google Response:", text);

  } catch (error) {
    console.error("Error:", error.message);
  }
});