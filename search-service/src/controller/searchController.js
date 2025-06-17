const logger = require("../utils/logger");
const Search = require("../models/search");
const searchPostController = async (req, res) => {
  logger.info("Search Endpoint hit");
  try {
    const { query } = req.query;
    const result = await Search.find(
      {
        $text: {
          $search: query,
        },
      },
      {
        score: {
          $meta: "textScore",
        },
      }
    )
      .sort({
        score: {
          $meta: "textScore",
        },
      })
      .limit(10);
    res.status(200).json({
      success: true,
      result,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
    logger.error("Error while searching post", error);
  }
};

module.exports = {
  searchPostController,
};
