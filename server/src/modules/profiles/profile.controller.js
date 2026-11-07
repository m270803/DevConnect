
const ProfessionalProfile = require("./professionalProfile.model");
const { profileSchema } = require("./profile.validation");

async function createOrUpdateProfile(req, res, next) {
  try {
    const result = profileSchema.safeParse(req.body);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: "Invalid profile data",
        errors: result.error.issues.map((issue) => ({
          field: issue.path.join("."),
          message: issue.message,
        })),
      });
    }

    const profile = await ProfessionalProfile.findOneAndUpdate(
      { userId: req.user._id },
      {
        $set: result.data,
        $setOnInsert: { userId: req.user._id },
      },
      {
        new: true,
        upsert: true,
        runValidators: true,
        setDefaultsOnInsert: true,
      }
    );

    return res.status(200).json({
      success: true,
      message: "Professional profile saved successfully",
      data: profile,
    });
  } catch (error) {
    next(error);
  }
}

async function getMyProfile(req, res, next) {
  try {
    const profile = await ProfessionalProfile.findOne({
      userId: req.user._id,
    });

    if (!profile) {
      return res.status(404).json({
        success: false,
        message: "Professional profile not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: profile,
    });
  } catch (error) {
    next(error);
  }
}

async function getPublicProfile(req, res, next) {
  try {
    const profile = await ProfessionalProfile.findOne({
      userId: req.params.userId,
      profileVisibility: "public",
    }).populate("userId", "name username avatar");

    if (!profile) {
      return res.status(404).json({
        success: false,
        message: "Professional profile not found",
      });
    }

    if (!profile.userId || profile.userId.status !== "active") {
      return res.status(404).json({
        success: false,
        message: "Professional profile not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: profile,
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  createOrUpdateProfile,
  getMyProfile,
  getPublicProfile,
};
