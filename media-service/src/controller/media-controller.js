const logger = require("../utils/logger");
const { uploadMediaToCloudinary } = require("../utils/cloudinary");
const Media = require("../model/media");
const media = require("../model/media");
const { get } = require("mongoose");

const uploadMedia = async (req, res) => {
  logger.info("Starting media upload");

  try {
    if (!req.file) {
      logger.error("No file found, Please add a file and try again!!");
      res.status(400).json({
        success: false,
        message: "No file found, Please add a file and try again!!",
      });
    }
    const { originalname, mimetype, buffer } = req.file;
    const userId = req.user.userId;

    logger.info(`File details: name= ${originalname} , type=${mimetype}`);
    logger.info("Uploading to cloudinary starting.....");

    const cloudinaryUploadResult = await uploadMediaToCloudinary(req.file);
    logger.info(
      "Cloudinary upload successfully. Public id - ",
      cloudinaryUploadResult.public_id
    );

    const newlyCreatedMedia = new Media({
      publicId: cloudinaryUploadResult.public_id,
      originalName: originalname,
      mimeType: mimetype,
      url: cloudinaryUploadResult.secure_url,
      userId,
    });

    await newlyCreatedMedia.save();
    res.status(201).json({
      success: true,
      mediaId: newlyCreatedMedia._id,
      url: newlyCreatedMedia.url,
      message: "Media upload is successful",
    });
  } catch (error) {
    logger.error("error occured", error);
    res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

const getAllMedias = async (req, res) => {
  try {
    const result = await Media.find({});
    res.status(200).json({
      success: true,
      result,
    });
  } catch (error) {
    logger.error("error occured", error);
    res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

module.exports = {
  uploadMedia,
  getAllMedias,
};
