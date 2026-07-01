import { Router } from "express";
import { prisma } from "../lib/prisma";
import { authMiddleware } from "../middleware/auth";

const router = Router();

router.use(authMiddleware);

function toPrismaDate(date?: string) {
  if (!date) return null;
  return new Date(`${date.split("T")[0]}T00:00:00`);
}

// GET /kanban
router.get("/", async (req, res) => {
  try {
    const userId = (req as any).user.userId;

    const tasks = await prisma.kanbanTask.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });

    return res.json({ tasks });
  } catch (error: any) {
    console.error("ERRO AO BUSCAR KANBAN:", error);

    return res.status(500).json({
      message: error.message || "Erro ao buscar tarefas.",
    });
  }
});

// POST /kanban
router.post("/", async (req, res) => {
  try {
    const userId = (req as any).user.userId;

    const {
      title,
      description,
      status,
      priority,
      dueDate,
      color,
    } = req.body;

    if (!title) {
      return res.status(400).json({
        message: "Título é obrigatório.",
      });
    }

    const task = await prisma.kanbanTask.create({
      data: {
        userId,
        title,
        description: description || "",
        status: status || "A Fazer",
        priority: priority || "media",
        dueDate: toPrismaDate(dueDate),
        color: color || "#D4AF37",
      },
    });

    return res.status(201).json({ task });
  } catch (error: any) {
    console.error("ERRO AO CRIAR TAREFA:", error);

    return res.status(500).json({
      message: error.message || "Erro ao criar tarefa.",
    });
  }
});

// PUT /kanban/:id
router.put("/:id", async (req, res) => {
  try {
    const userId = (req as any).user.userId;
    const { id } = req.params;

    const existing = await prisma.kanbanTask.findFirst({
      where: { id, userId },
    });

    if (!existing) {
      return res.status(404).json({
        message: "Tarefa não encontrada.",
      });
    }

    const { notes, ...bodyWithoutNotes } = req.body;

    const updateData = {
      ...bodyWithoutNotes,
      ...(req.body.dueDate !== undefined
        ? { dueDate: req.body.dueDate ? toPrismaDate(req.body.dueDate) : null }
        : {}),
    };

    const task = await prisma.kanbanTask.update({
      where: { id },
      data: updateData,
    });

    return res.json({ task });
  } catch (error: any) {
    console.error("ERRO AO ATUALIZAR TAREFA:", error);

    return res.status(500).json({
      message: error.message || "Erro ao atualizar tarefa.",
    });
  }
});

// DELETE /kanban/:id
router.delete("/:id", async (req, res) => {
  try {
    const userId = (req as any).user.userId;
    const { id } = req.params;

    const existing = await prisma.kanbanTask.findFirst({
      where: { id, userId },
    });

    if (!existing) {
      return res.status(404).json({
        message: "Tarefa não encontrada.",
      });
    }

    await prisma.kanbanTask.delete({
      where: { id },
    });

    return res.json({
      message: "Tarefa excluída com sucesso.",
    });
  } catch (error: any) {
    console.error("ERRO AO EXCLUIR TAREFA:", error);

    return res.status(500).json({
      message: error.message || "Erro ao excluir tarefa.",
    });
  }
});

export default router;