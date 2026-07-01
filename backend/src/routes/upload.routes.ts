import { Router } from "express";
import multer from "multer";
import path from "path";
import { authMiddleware } from "../middleware/auth";

const router = Router();

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/inventory");
  },
  filename: (req, file, cb) => {
    const uniqueName =
      Date.now() +
      "-" +
      Math.round(Math.random() * 1e9) +
      path.extname(file.originalname);

    cb(null, uniqueName);
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];

    if (!allowedTypes.includes(file.mimetype)) {
      return cb(new Error("Formato inválido. Use JPG, PNG ou WEBP."));
    }

    cb(null, true);
  },
});

router.post("/inventory", authMiddleware, upload.single("image"), (req, res) => {
  if (!req.file) {
    return res.status(400).json({
      message: "Nenhuma imagem enviada.",
    });
  }

  const imageUrl = `/uploads/inventory/${req.file.filename}`;

  return res.status(201).json({
    message: "Imagem enviada com sucesso.",
    imageUrl,
  });
});

export default router;