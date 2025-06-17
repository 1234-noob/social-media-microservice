const logger = require("../utils/logger");
const Media = require("../model/media");
const { deleteMediaFromCloudinary } = require("../utils/cloudinary");

const handlePostDeleted = async (event) => {
  const { postId, mediaIds } = event;
  try {
    const mediaToDelete = await Media.find({
      _id: { $in: mediaIds },
    });

    for (const media of mediaToDelete) {
      await deleteMediaFromCloudinary(media.publicId);
      await Media.findById(media._id);

      logger.info("Deleted media", media._id);
    }
    logger.info(`Processed deletion of media for post id ${postId}`);
  } catch (error) {
    logger.error("Error while deleting media", error);
  }
};

module.exports = { handlePostDeleted };
