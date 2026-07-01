import { Router } from "express";
import { prisma } from "../lib/prisma";
import { authMiddleware } from "../middleware/auth";

const router = Router();

router.use(authMiddleware);

// GET /cash
router.get("/", async (req, res) => {
  try {
    const userId = (req as any).user.userId;

    const cash = await prisma.cashTransaction.findMany({
      where: { userId },
      orderBy: { date: "desc" },
    });

    return res.json({ cash });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Erro ao buscar movimentações do caixa.",
    });
  }
});

// POST /cash
router.post("/", async (req, res) => {
  try {
    const userId = (req as any).user.userId;

    const { type, category, subcategory, amount, description, date } = req.body;

    if (!type || !category || amount === undefined) {
      return res.status(400).json({
        message: "Tipo, categoria e valor são obrigatórios.",
      });
    }

    const transaction = await prisma.cashTransaction.create({
      data: {
        userId,
        type,
        category,
        subcategory: subcategory || null,
        amount: Number(amount),
        description: description || null,
        date: date ? new Date(date) : new Date(),
      },
    });

    return res.status(201).json({
      message: "Movimentação cadastrada com sucesso.",
      transaction,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Erro ao cadastrar movimentação.",
    });
  }
});

// PUT /cash/:id
router.put("/:id", async (req, res) => {
  try {
    const userId = (req as any).user.userId;
    const { id } = req.params;

    const exists = await prisma.cashTransaction.findFirst({
      where: { id, userId },
    });

    if (!exists) {
      return res.status(404).json({
        message: "Movimentação não encontrada.",
      });
    }

    const transaction = await prisma.cashTransaction.update({
      where: { id },
      data: {
        type: req.body.type,
        category: req.body.category,
        subcategory: req.body.subcategory,
        amount: req.body.amount !== undefined ? Number(req.body.amount) : undefined,
        description: req.body.description,
        date: req.body.date ? new Date(req.body.date) : undefined,
      },
    });

    return res.json({
      message: "Movimentação atualizada com sucesso.",
      transaction,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Erro ao atualizar movimentação.",
    });
  }
});

// DELETE /cash/:id
router.delete("/:id", async (req, res) => {
  try {
    const userId = (req as any).user.userId;
    const { id } = req.params;

    const exists = await prisma.cashTransaction.findFirst({
      where: { id, userId },
    });

    if (!exists) {
      return res.status(404).json({
        message: "Movimentação não encontrada.",
      });
    }

    await prisma.cashTransaction.delete({
      where: { id },
    });

    return res.json({
      message: "Movimentação excluída com sucesso.",
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Erro ao excluir movimentação.",
    });
  }
});

export default router;