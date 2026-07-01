import { Router } from "express";
import multer from "multer";
import { authMiddleware } from "../middleware/auth";
import cloudinary from "../lib/cloudinary";

const router = Router();

const upload = multer({
  storage: multer.memoryStorage(),
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

router.post("/inventory", authMiddleware, upload.single("image"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        message: "Nenhuma imagem enviada.",
      });
    }

    const base64Image = `data:${req.file.mimetype};base64,${req.file.buffer.toString(
      "base64"
    )}`;

    const result = await cloudinary.uploader.upload(base64Image, {
      folder: "blackstone/inventory",
      resource_type: "image",
    });

    return res.status(201).json({
      message: "Imagem enviada com sucesso.",
      imageUrl: result.secure_url,
    });
  } catch (error) {
    console.error("Erro no upload Cloudinary:", error);

    return res.status(500).json({
      message: "Erro ao enviar imagem.",
    });
  }
});

export default router;