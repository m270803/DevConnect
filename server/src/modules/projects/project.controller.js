
const mongoose = require("mongoose");
const Project = require("./project.model");

const {
  projectSchema,
  updateProjectSchema,
} = require("./project.validation");

function sendValidationError(res, error) {
  return res.status(400).json({
    success: false,
    message: "Validation failed",
    errors: error.issues,
  });
}

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// Create a project
async function createProject(req, res, next) {
  try {
    const result = projectSchema.safeParse(req.body);

    if (!result.success) {
      return sendValidationError(res, result.error);
    }

    const data = result.data;

    const project = await Project.create({
      ...data,
      clientId: req.user._id,
      deadline: data.deadline ?? null,
    });

    return res.status(201).json({
      success: true,
      message: "Project created successfully",
      project,
    });
  } catch (error) {
    next(error);
  }
}

// Get projects created by the logged-in client
async function getMyProjects(req, res, next) {
  try {
    const projects = await Project.find({
      clientId: req.user._id,
    }).sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: projects.length,
      projects,
    });
  } catch (error) {
    next(error);
  }
}

// Browse open projects
async function getProjects(req, res, next) {
  try {
    const page = Math.max(
      1,
      Number.parseInt(req.query.page, 10) || 1
    );

    const limit = Math.min(
      50,
      Math.max(1, Number.parseInt(req.query.limit, 10) || 10)
    );

    const filter = { status: "open" };

    if (req.query.category) {
      filter.category = {
        $regex: escapeRegex(String(req.query.category)),
        $options: "i",
      };
    }

    if (req.query.skill) {
      filter.requiredSkills = {
        $regex: escapeRegex(String(req.query.skill)),
        $options: "i",
      };
    }

    if (req.query.budgetType) {
      if (!["fixed", "hourly"].includes(req.query.budgetType)) {
        return res.status(400).json({
          success: false,
          message: "budgetType must be fixed or hourly",
        });
      }

      filter.budgetType = req.query.budgetType;
    }

    const [projects, total] = await Promise.all([
      Project.find(filter)
        .populate("clientId", "name username avatar")
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),

      Project.countDocuments(filter),
    ]);

    return res.status(200).json({
      success: true,
      count: projects.length,
      total,
      page,
      totalPages: Math.ceil(total / limit),
      projects,
    });
  } catch (error) {
    next(error);
  }
}

// Publicly view open projects; clients may also view their own projects in any status.
async function getProjectById(req, res, next) {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid project ID",
      });
    }

    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found",
      });
    }

    const isOwner = req.user && project.clientId.equals(req.user._id);
    if (project.status !== "open" && !isOwner) {
      return res.status(404).json({
        success: false,
        message: "Project not found",
      });
    }

    await project.populate("clientId", "name username avatar");

    return res.status(200).json({
      success: true,
      project,
    });
  } catch (error) {
    next(error);
  }
}

// Update a project owned by the logged-in client
async function updateProject(req, res, next) {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid project ID",
      });
    }

    const result = updateProjectSchema.safeParse(req.body);

    if (!result.success) {
      return sendValidationError(res, result.error);
    }

    const project = await Project.findOne({
      _id: req.params.id,
      clientId: req.user._id,
    });

    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found or you do not own it",
      });
    }

    const updates = result.data;

    const nextMin = updates.budgetMin ?? project.budgetMin;
    const nextMax = updates.budgetMax ?? project.budgetMax;

    if (nextMax < nextMin) {
      return res.status(400).json({
        success: false,
        message: "Maximum budget must be greater than or equal to minimum budget",
      });
    }

    Object.assign(project, updates);
    await project.save();

    return res.status(200).json({
      success: true,
      message: "Project updated successfully",
      project,
    });
  } catch (error) {
    next(error);
  }
}

// Delete a project owned by the logged-in client
async function deleteProject(req, res, next) {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid project ID",
      });
    }

    const project = await Project.findOneAndDelete({
      _id: req.params.id,
      clientId: req.user._id,
    });

    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found or you do not own it",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Project deleted successfully",
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  createProject,
  getMyProjects,
  getProjects,
  getProjectById,
  updateProject,
  deleteProject,
};
