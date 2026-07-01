import { Router } from "express";
import { prisma } from "../lib/prisma";
import { authMiddleware } from "../middleware/auth";

const router = Router();

router.use(authMiddleware);

function toPrismaDate(date: string) {
  return new Date(`${date.split("T")[0]}T00:00:00`);
}

// GET /calendar
router.get("/", async (req, res) => {
  try {
    const userId = (req as any).user.userId;

    const events = await prisma.calendarEvent.findMany({
      where: { userId },
      orderBy: [{ date: "asc" }, { time: "asc" }],
    });

    return res.json({ events });
  } catch (error: any) {
    console.error("ERRO AO BUSCAR EVENTOS:", error);

    return res.status(500).json({
      message: error.message || "Erro ao buscar agenda.",
    });
  }
});

// POST /calendar
router.post("/", async (req, res) => {
  try {
    const userId = (req as any).user.userId;

    const {
      title,
      description,
      date,
      time,
      location,
      priority,
      status,
      color,
    } = req.body;

    if (!title || !date) {
      return res.status(400).json({
        message: "Título e data são obrigatórios.",
      });
    }

    const event = await prisma.calendarEvent.create({
      data: {
        userId,
        title,
        description: description || "",
        date: toPrismaDate(date),
        time: time || "",
        location: location || "",
        priority: priority || "media",
        status: status || "pendente",
        color: color || "#D4AF37",
      },
    });

    return res.status(201).json({ event });
  } catch (error: any) {
    console.error("ERRO AO CRIAR EVENTO:", error);

    return res.status(500).json({
      message: error.message || "Erro ao criar evento.",
    });
  }
});

// PUT /calendar/:id
router.put("/:id", async (req, res) => {
  try {
    const userId = (req as any).user.userId;
    const { id } = req.params;

    const existing = await prisma.calendarEvent.findFirst({
      where: { id, userId },
    });

    if (!existing) {
      return res.status(404).json({
        message: "Evento não encontrado.",
      });
    }

    const { notes, ...bodyWithoutNotes } = req.body;

    const updateData = {
      ...bodyWithoutNotes,
      ...(req.body.date ? { date: toPrismaDate(req.body.date) } : {}),
    };

    const event = await prisma.calendarEvent.update({
      where: { id },
      data: updateData,
    });

    return res.json({ event });
  } catch (error: any) {
    console.error("ERRO AO ATUALIZAR EVENTO:", error);

    return res.status(500).json({
      message: error.message || "Erro ao atualizar evento.",
    });
  }
});

// DELETE /calendar/:id
router.delete("/:id", async (req, res) => {
  try {
    const userId = (req as any).user.userId;
    const { id } = req.params;

    const existing = await prisma.calendarEvent.findFirst({
      where: { id, userId },
    });

    if (!existing) {
      return res.status(404).json({
        message: "Evento não encontrado.",
      });
    }

    await prisma.calendarEvent.delete({
      where: { id },
    });

    return res.json({
      message: "Evento excluído com sucesso.",
    });
  } catch (error: any) {
    console.error("ERRO AO EXCLUIR EVENTO:", error);

    return res.status(500).json({
      message: error.message || "Erro ao excluir evento.",
    });
  }
});

export default router;