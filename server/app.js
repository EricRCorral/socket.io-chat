import express from "express";
import { createConnection } from "mysql2/promise";
import { config } from "dotenv";
import { Server } from "socket.io";
import { createServer } from "node:http";

config();

const PORT = process.env.PORT ?? "3000";
const DEFAULT_CONFIG = {
  host: "localhost",
  user: "root",
  port: 3306,
  password: "password",
  database: "chat_db",
};

const APP = express();
const SERVER = createServer(APP);

const IO = new Server(SERVER);

const CONNECTION = await createConnection(
  process.env.DATABASE_URL ?? DEFAULT_CONFIG
);

await CONNECTION.query(`CREATE TABLE IF NOT EXISTS chat (
    id INT PRIMARY KEY AUTO_INCREMENT,
    message TEXT,
    username VARCHAR(128),
    avatar TEXT,
    created_at TIMESTAMP DEFAULT NOW()
    );`);

IO.on("connection", async (socket) => {
  const { username } = socket.handshake.auth;

  console.log(`User ${username} has been connected`);

  socket.on("disconnect", () => {
    console.log(`User ${username} has been disconnected`);
  });

  if (!socket.recovered) {
    const [messages] = await CONNECTION.query(`SELECT * FROM chat`);

    messages.forEach((message) => socket.emit("message", message));
  }

  socket.on("message", async ({ username, avatar, message }) => {
    const NOW = new Date().toISOString();

    CONNECTION.query(
      `INSERT INTO chat (message, username, avatar) VALUES
        (? , ? , ?)`,
      [message, username, avatar]
    );

    IO.emit("message", { username, avatar, message, created_at: NOW });
  });
});

APP.use(express.static("client"));

APP.get("/", (_, res) => {
  res.sendFile(process.cwd() + "/client/index.html");
});

SERVER.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
