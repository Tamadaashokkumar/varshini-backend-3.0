import mongoose from "mongoose";
import bcrypt from "bcryptjs";

/**
 * Admin Schema
 * Stores admin user information with authentication credentials
 * Updated to support extended profile and notification settings
 */
const adminSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Admin name is required"],
      trim: true,
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
        "Please provide a valid email",
      ],
    },
    // Frontend లో అదనంగా యాడ్ చేసిన ఫీల్డ్స్
    avatar: {
      type: String, // ఇమేజ్ URL ని స్టోర్ చేస్తుంది (Cloudinary/S3 నుండి)
      default: "",
    },
    phone: {
      type: String,
      trim: true,
      default: "",
    },
    bio: {
      type: String,
      trim: true,
      maxlength: [500, "Bio cannot be more than 500 characters"],
      default: "",
    },
    // నోటిఫికేషన్ సెట్టింగ్స్ కోసం నెస్టెడ్ ఆబ్జెక్ట్
    notifications: {
      emailAlerts: {
        type: Boolean,
        default: true,
      },
      securityAlerts: {
        type: Boolean,
        default: true,
      },
      marketingEmails: {
        type: Boolean,
        default: false,
      },
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [6, "Password must be at least 6 characters"],
      select: false, // Don't return password in queries by default
    },
    role: {
      type: String,
      default: "admin",
      enum: ["admin", "superadmin"],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    lastLogin: {
      type: Date,
    },
    refreshToken: {
      type: String,
      select: false,
    },
    isAutoReplyEnabled: {
      type: Boolean,
      default: false, // Default ga OFF lo untundi
    },
  },
  {
    timestamps: true, // createdAt, updatedAt ఆటోమేటిక్ గా వస్తాయి
  },
);

/**
 * Hash password before saving
 * Only hash if password is modified
 */
adminSchema.pre("save", async function (next) {
  if (!this.isModified("password")) {
    return next();
  }

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

/**
 * Compare password method
 * @param {string} candidatePassword - Password to compare
 * @returns {boolean} - True if passwords match
 */
adminSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

/**
 * Remove sensitive data from JSON output
 */
adminSchema.methods.toJSON = function () {
  const admin = this.toObject();
  delete admin.password;
  delete admin.refreshToken;
  return admin;
};

const Admin = mongoose.model("Admin", adminSchema);

export default Admin;
