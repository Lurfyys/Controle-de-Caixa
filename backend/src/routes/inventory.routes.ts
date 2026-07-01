import { Router } from "express";
import { prisma } from "../lib/prisma";
import { authMiddleware } from "../middleware/auth";
import fs from "fs";
import path from "path";
const router = Router();

router.use(authMiddleware);

// GET /inventory
router.get("/", async (req, res) => {
  try {
    const userId = (req as any).user.userId;

    const inventory = await prisma.inventory.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });

    return res.json({ inventory });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Erro ao buscar estoque.",
    });
  }
});

// POST /inventory
router.post("/", async (req, res) => {
  try {
    const userId = (req as any).user.userId;

    const {
      name,
      category,
      weight,
      goldType,
      gem,
      costPrice,
      sellPrice,
      quantity,
      status,
      description,
      imageUrl,
    } = req.body;

    if (!name || !category) {
      return res.status(400).json({
        message: "Nome e categoria são obrigatórios.",
      });
    }

    const item = await prisma.inventory.create({
      data: {
        userId,
        name,
        category,
        weight: Number(weight) || 0,
        goldType: goldType || "",
        gem: gem || "",
        costPrice: Number(costPrice) || 0,
        sellPrice: Number(sellPrice) || 0,
        quantity: Number(quantity) || 1,
        status: status || "Disponível",
        description: description || "",
        imageUrl: imageUrl || "",
      },
    });

    return res.status(201).json({
      message: "Item cadastrado com sucesso.",
      item,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Erro ao cadastrar item.",
    });
  }
});

// PUT /inventory/:id
router.put("/:id", async (req, res) => {
  try {
    const userId = (req as any).user.userId;
    const { id } = req.params;

    const exists = await prisma.inventory.findFirst({
      where: { id, userId },
    });

    if (!exists) {
      return res.status(404).json({
        message: "Item não encontrado.",
      });
    }

    const item = await prisma.inventory.update({
      where: { id },
      data: {
        name: req.body.name,
        category: req.body.category,
        weight: req.body.weight !== undefined ? Number(req.body.weight) : undefined,
        goldType: req.body.goldType,
        gem: req.body.gem,
        costPrice: req.body.costPrice !== undefined ? Number(req.body.costPrice) : undefined,
        sellPrice: req.body.sellPrice !== undefined ? Number(req.body.sellPrice) : undefined,
        quantity: req.body.quantity !== undefined ? Number(req.body.quantity) : undefined,
        status: req.body.status,
        description: req.body.description,
        imageUrl: req.body.imageUrl,
      },
    });

    return res.json({
      message: "Item atualizado com sucesso.",
      item,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Erro ao atualizar item.",
    });
  }
});

// DELETE /inventory/:id
router.delete("/:id", async (req, res) => {
  try {
    const userId = (req as any).user.userId;
    const { id } = req.params;

    const item = await prisma.inventory.findFirst({
      where: { id, userId },
    });

    if (!item) {
      return res.status(404).json({
        message: "Item não encontrado.",
      });
    }

    if (item.imageUrl && item.imageUrl.startsWith("/uploads/inventory/")) {
      const fileName = path.basename(item.imageUrl);
      const filePath = path.join(process.cwd(), "uploads", "inventory", fileName);

      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }

    await prisma.inventory.delete({
      where: { id },
    });

    return res.json({
      message: "Item excluído com sucesso.",
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      message: "Erro ao excluir item.",
    });
  }
});

export default router;