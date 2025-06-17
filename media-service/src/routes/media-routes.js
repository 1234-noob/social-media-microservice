const express = require("express");
const router = express.Router();
const { authenticateRequest } = require("../middleware/authMiddleware");
const multer = require("multer");
const { uploadMedia, getAllMedias } = require("../controller/media-controller");
const logger = require("../utils/logger");

router.use(authenticateRequest);

//configure multer for file upload

const fileUpload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, //5mb file limit
  },
}).single("file");

router.post(
  "/upload",

  (req, res, next) => {
    fileUpload(req, res, function (err) {
      if (err instanceof multer.MulterError) {
        logger.error(`Multer error while uploading: ${err}`);
        return res.status(400).json({
          success: false,
          message: "Multer error while uploading",
          error: err.message,
          stack: err.stack,
        });
      } else if (err) {
        logger.error(`Unknown error while uploading: ${err}`);
        return res.status(500).json({
          success: false,
          message: "Unknown error while uploading",
          error: err.message,
          stack: err.stack,
        });
      }

      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: "No file found",
        });
      }
      next();
    });
  },
  uploadMedia
);

router.get("/get", getAllMedias);

module.exports = router;
