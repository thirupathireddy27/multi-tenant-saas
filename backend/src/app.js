const express = require("express");
const authRoutes = require("./routes/auth.routes");
const authMiddleware = require("./middleware/auth.middleware");
const projectRoutes = require("./routes/project.routes");
const cors = require("cors");
require("dotenv").config();
require("./config/db");


const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));


app.use(
    cors({
        origin: process.env.FRONTEND_URL,
        credentials: true,
    })
);

app.use("/api/auth", authRoutes);

app.use("/api/projects", projectRoutes);

app.get("/api/health", async (req, res) => {
    return res.status(200).json({
        status: "ok",
        database: "connected",
        timestamp: new Date().toISOString(),
    });
});



app.get("/api/protected", authMiddleware, (req, res) => {
    return res.status(200).json({
        success: true,
        message: "Protected route accessed",
        user: req.user,
    });
});

app.get("/test", (req, res) => {
  res.send("Server working");
});

module.exports = app;
