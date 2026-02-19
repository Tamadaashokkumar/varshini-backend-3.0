import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import crypto from "crypto";

const vehicleSchema = new mongoose.Schema({
  make: { type: String, default: "Hyundai" }, // Default ga Hyundai untundi
  model: { type: String, required: true }, // e.g., Creta
  year: { type: String, required: true }, // e.g., 2022
  variant: { type: String, required: true }, // e.g., SX (O)
  fuelType: { type: String, required: true }, // e.g., Diesel
  isPrimary: { type: Boolean, default: false }, // Default car ga pettukovadaniki
});

/**
 * User Schema
 * Stores customer information with authentication and profile details
 */
const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
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
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [6, "Password must be at least 6 characters"],
      select: false,
    },
    phone: {
      type: String,
      required: [true, "Phone number is required"],
      match: [/^[0-9]{10}$/, "Please provide a valid 10-digit phone number"],
    },
    profilePic: {
      type: String,
      default: "", // గూగుల్ ఇమేజ్ లేదా క్లౌడినరీ లింక్ ఇక్కడ స్టోర్ అవుతుంది
    },
    addresses: [
      {
        addressType: {
          type: String,
          enum: ["Home", "Work", "Other"],
          default: "Home",
        },
        street: {
          type: String,
          required: true,
        },
        city: {
          type: String,
          required: true,
        },
        state: {
          type: String,
          required: true,
        },
        pincode: {
          type: String,
          required: true,
          match: [/^[0-9]{6}$/, "Please provide a valid 6-digit pincode"],
        },
        isDefault: {
          type: Boolean,
          default: false,
        },
      },
    ],
    role: {
      type: String,
      default: "customer",
      enum: ["customer"],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    isEmailVerified: {
      type: Boolean,
      default: false,
    },
    lastLogin: {
      type: Date,
    },
    refreshToken: {
      type: String,
      select: false,
    },
    garage: [vehicleSchema],
    passwordResetToken: String,
    passwordResetExpires: Date,
    emailVerificationToken: String,
    emailVerificationExpires: Date,
  },
  {
    timestamps: true,
  },
);

/**
 * Hash password before saving
 */
userSchema.pre("save", async function (next) {
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
 * Ensure only one default address per user
 */
userSchema.pre("save", function (next) {
  if (this.addresses && this.addresses.length > 0) {
    const defaultAddresses = this.addresses.filter((addr) => addr.isDefault);

    if (defaultAddresses.length > 1) {
      // Keep only the first default address
      this.addresses.forEach((addr, index) => {
        if (index > 0 && addr.isDefault) {
          addr.isDefault = false;
        }
      });
    }
  }
  next();
});

/**
 * Compare password method
 */
userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

/**
 * Remove sensitive data from JSON output
 */
userSchema.methods.toJSON = function () {
  const user = this.toObject();
  delete user.password;
  delete user.refreshToken;
  return user;
};

// పాస్‌వర్డ్ రీసెట్ టోకెన్ జనరేట్ చేసే మెథడ్
userSchema.methods.createPasswordResetToken = function () {
  // 1. రండమ్ గా 32 అక్షరాల స్ట్రింగ్ ని క్రియేట్ చేస్తాం (Raw Token)
  const resetToken = crypto.randomBytes(32).toString("hex");

  // 2. ఆ టోకెన్ ని HASH (సెక్యూరిటీ కోసం మార్చి) చేసి డేటాబేస్ లో స్టోర్ చేస్తాం
  this.passwordResetToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");

  // 3. టోకెన్ టైమ్ లిమిట్ సెట్ చేస్తాం (10 నిమిషాలు)
  this.passwordResetExpires = Date.now() + 10 * 60 * 1000;

  // 4. ఇమెయిల్ లో పంపడానికి "Raw Token" ని రిటర్న్ చేస్తాం
  return resetToken;
};

// 🔥 NEW: ఈమెయిల్ వెరిఫికేషన్ టోకెన్ జనరేట్ చేసే మెథడ్
userSchema.methods.createEmailVerificationToken = function () {
  // 1. రండమ్ గా 32 అక్షరాల స్ట్రింగ్ ని క్రియేట్ చేస్తాం
  const verificationToken = crypto.randomBytes(32).toString("hex");

  // 2. దాన్ని హ్యాష్ చేసి డేటాబేస్ లో సేవ్ చేస్తాం
  this.emailVerificationToken = crypto
    .createHash("sha256")
    .update(verificationToken)
    .digest("hex");

  // 3. 24 గంటలు (24 hours) వాలిడిటీ ఇస్తున్నాం
  this.emailVerificationExpires = Date.now() + 24 * 60 * 60 * 1000;

  // 4. ఇమెయిల్ లింక్‌లో పంపడానికి రా టోకెన్ రిటర్న్ చేస్తాం
  return verificationToken;
};

const User = mongoose.model("User", userSchema);

export default User;
