import { Router } from "express";
import { prisma } from "../lib/prisma";
import { authMiddleware } from "../middleware/auth";

const router = Router();

router.use(authMiddleware);

// GET /notes
router.get("/", async (req, res) => {
  try {
    const userId = (req as any).user.userId;

    const notes = await prisma.note.findMany({
      where: { userId },
      orderBy: [
        { isPinned: "desc" },
        { updatedAt: "desc" },
      ],
    });

    return res.json({ notes });
  } catch (error: any) {
    console.error("ERRO AO BUSCAR NOTAS:", error);

    return res.status(500).json({
      message: error.message || "Erro ao buscar notas.",
    });
  }
});

// POST /notes
router.post("/", async (req, res) => {
  try {
    const userId = (req as any).user.userId;

    const {
      title,
      content,
      color,
      imageUrl,
      tags,
      isPinned,
      checklist,
    } = req.body;

    if (!title) {
      return res.status(400).json({
        message: "Título é obrigatório.",
      });
    }

    const note = await prisma.note.create({
      data: {
        userId,
        title,
        content: content || "",
        color: color || "gold",
        imageUrl: imageUrl || "",
        tags: Array.isArray(tags) && tags.length > 0 ? tags : ["Geral"],
        isPinned: Boolean(isPinned),
        checklist: checklist || [],
      },
    });

    return res.status(201).json({ note });
  } catch (error: any) {
    console.error("ERRO AO CRIAR NOTA:", error);

    return res.status(500).json({
      message: error.message || "Erro ao criar nota.",
    });
  }
});

// PUT /notes/:id
router.put("/:id", async (req, res) => {
  try {
    const userId = (req as any).user.userId;
    const { id } = req.params;

    const existing = await prisma.note.findFirst({
      where: { id, userId },
    });

    if (!existing) {
      return res.status(404).json({
        message: "Nota não encontrada.",
      });
    }

    const note = await prisma.note.update({
      where: { id },
      data: req.body,
    });

    return res.json({ note });
  } catch (error: any) {
    console.error("ERRO AO ATUALIZAR NOTA:", error);

    return res.status(500).json({
      message: error.message || "Erro ao atualizar nota.",
    });
  }
});

// DELETE /notes/:id
router.delete("/:id", async (req, res) => {
  try {
    const userId = (req as any).user.userId;
    const { id } = req.params;

    const existing = await prisma.note.findFirst({
      where: { id, userId },
    });

    if (!existing) {
      return res.status(404).json({
        message: "Nota não encontrada.",
      });
    }

    await prisma.note.delete({
      where: { id },
    });

    return res.json({
      message: "Nota excluída com sucesso.",
    });
  } catch (error: any) {
    console.error("ERRO AO EXCLUIR NOTA:", error);

    return res.status(500).json({
      message: error.message || "Erro ao excluir nota.",
    });
  }
});

export default router;