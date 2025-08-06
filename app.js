const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const cors = require("cors");
const mongoose = require("mongoose");
const session = require("express-session");
const passport = require("passport");
require("dotenv").config();

const authRoutes = require("./src/api/routes/auth.routes");
const { connectDatabase } = require("./src/config/database");
const {
  initializeWebSockets,
} = require("./src/infrastructure/websockets/chat.handler");

// 🧠 Passport config
require("./src/config/passport");

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: [
      process.env.CLIENT_URL || "http://localhost:3000",
      "http://127.0.0.1:5500",
    ],
    methods: ["GET", "POST"],
  },
});

// Middlewares
app.use(
  cors({
    origin: [
      process.env.CLIENT_URL || "http://localhost:3000",
      "http://127.0.0.1:5500",
    ],
    credentials: true, // importante para que funcione la sesión
  })
);

app.use(express.json());

// 🔐 Express session (requerido por Passport)
app.use(
  session({
    secret: "oauth2secret", // puedes moverlo al .env si quieres
    resave: false,
    saveUninitialized: false,
  })
);

// 🔐 Passport middlewares
app.use(passport.initialize());
app.use(passport.session());

// 🔗 Rutas
app.use("/api/auth", authRoutes);

// 🧠 Conectar base de datos
connectDatabase();

// 🔌 WebSockets
initializeWebSockets(io);

// ✅ Ruta de salud
app.get("/health", (req, res) => {
  res.json({ status: "OK", message: "Chat server is running" });
});

// ❌ Ruta no encontrada
app.use((req, res) => {
  res.status(404).json({ error: "Ruta no encontrada" });
});

// 🔥 Errores globales
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: "Algo salió mal!" });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Servidor corriendo en puerto ${PORT}`);
});

module.exports = app;
