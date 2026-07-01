import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import authRoutes from "./routes/auth.routes";
import inventoryRoutes from "./routes/inventory.routes";
import path from "path";
import uploadRoutes from "./routes/upload.routes";
import cashRoutes from "./routes/cash.routes";
import calendarRoutes from "./routes/calendar.routes";
import kanbanRoutes from "./routes/kanban.routes";
import notesRoutes from "./routes/notes.routes";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

app.get("/", (req, res) => {
  res.json({
    message: "Backend BlackStone rodando",
  });
});

// Rotas
app.use("/auth", authRoutes);
app.use("/inventory", inventoryRoutes);
app.use("/upload", uploadRoutes);
app.use("/cash", cashRoutes);
app.use("/calendar", calendarRoutes);
app.use("/kanban", kanbanRoutes);
app.use("/notes", notesRoutes);

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
});