
const mongoose = require("mongoose");
const Service = require("./service.model");
const User = require("../users/user.model");

const {
  serviceSchema,
  updateServiceSchema,
} = require("./service.validation");

function sendValidationError(res, error) {
  return res.status(400).json({
    success: false,
    message: "Validation failed",
    errors: error.issues,
  });
}

// Create a service
async function createService(req, res, next) {
  try {
    const result = serviceSchema.safeParse(req.body);

    if (!result.success) {
      return sendValidationError(res, result.error);
    }

    const service = await Service.create({
      ...result.data,
      professionalId: req.user._id,
    });

    return res.status(201).json({
      success: true,
      message: "Service created successfully",
      service,
    });
  } catch (error) {
    next(error);
  }
}

// Get services owned by the logged-in professional
async function getMyServices(req, res, next) {
  try {
    const services = await Service.find({
      professionalId: req.user._id,
    }).sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: services.length,
      services,
    });
  } catch (error) {
    next(error);
  }
}

// Browse published services
async function getServices(req, res, next) {
  try {
    const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1);
    const limit = Math.min(
      50,
      Math.max(1, Number.parseInt(req.query.limit, 10) || 10)
    );

    const filter = { status: "published" };

    if (req.query.category) {
      filter.category = {
        $regex: req.query.category.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
        $options: "i",
      };
    }

    if (req.query.skill) {
      filter.skills = {
        $regex: req.query.skill.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
        $options: "i",
      };
    }

    const [services, total] = await Promise.all([
      Service.find(filter)
        .populate("professionalId", "name username avatar")
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),

      Service.countDocuments(filter),
    ]);

    return res.status(200).json({
      success: true,
      count: services.length,
      total,
      page,
      totalPages: Math.ceil(total / limit),
      services,
    });
  } catch (error) {
    next(error);
  }
}

// Get one published service
async function getServiceById(req, res, next) {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid service ID",
      });
    }

    const service = await Service.findOne({
      _id: req.params.id,
      status: "published",
    }).populate("professionalId", "name username avatar");

    if (!service) {
      return res.status(404).json({
        success: false,
        message: "Service not found",
      });
    }

    return res.status(200).json({
      success: true,
      service,
    });
  } catch (error) {
    next(error);
  }
}

// Update a service owned by the logged-in professional
async function updateService(req, res, next) {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid service ID",
      });
    }

    const result = updateServiceSchema.safeParse(req.body);

    if (!result.success) {
      return sendValidationError(res, result.error);
    }

    const service = await Service.findOneAndUpdate(
      {
        _id: req.params.id,
        professionalId: req.user._id,
      },
      { $set: result.data },
      {
        new: true,
        runValidators: true,
      }
    );

    if (!service) {
      return res.status(404).json({
        success: false,
        message: "Service not found or you do not own it",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Service updated successfully",
      service,
    });
  } catch (error) {
    next(error);
  }
}

// Delete a service owned by the logged-in professional
async function deleteService(req, res, next) {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid service ID",
      });
    }

    const service = await Service.findOneAndDelete({
      _id: req.params.id,
      professionalId: req.user._id,
    });

    if (!service) {
      return res.status(404).json({
        success: false,
        message: "Service not found or you do not own it",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Service deleted successfully",
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  createService,
  getMyServices,
  getServices,
  getServiceById,
  updateService,
  deleteService,
};
