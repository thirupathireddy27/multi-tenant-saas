const express = require("express");
const cors = require("cors");
require("dotenv").config();

const app = express();

app.use(express.json());

app.use(
  cors({
    origin: process.env.FRONTEND_URL,
    credentials: true,
  })
);

app.get("/api/health", async (req, res) => {
  return res.status(200).json({
    status: "ok",
    database: "connected",
    timestamp: new Date().toISOString(),
  });
});

module.exports = app;
