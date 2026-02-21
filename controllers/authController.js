import { asyncHandler, AppError } from "../utils/errorHandler.js";
import { generateTokenPair, verifyRefreshToken } from "../utils/jwt.js";
import { sendSuccess } from "../utils/response.js";
import User from "../models/User.js";
import crypto from "crypto";
import { OAuth2Client } from "google-auth-library";
// పాత ఇంపోర్ట్ పక్కనే దీన్ని కూడా చేర్చండి
import sendEmail, {
  generateVerificationEmailTemplate,
  generatePasswordResetEmailTemplate,
} from "../utils/email.js";

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// 🔥 CONFIGURATION: Cookie Options (Professional Setup)
const getCookieOptions = (type) => {
  const isProduction = process.env.NODE_ENV === "production";

  const options = {
    // httpOnly: true, // JS cannot read this (Security)
    // secure: isProduction, // HTTPS only in production
    // sameSite: isProduction ? "strict" : "lax",
    // path: "/", // CSRF protection

    httpOnly: true,
    path: "/",

    // 👇 Render (Backend) & Vercel (Frontend) వేరు కాబట్టి ఇది తప్పనిసరి
    secure: true,

    // 👇 Strict ఉంటే పనిచేయదు. 'none' ఉంటేనే కుకీ వెళ్తుంది.
    sameSite: "none",
  };

  if (type === "access") {
    // Access Token: Short Lived (e.g., 15 Mins)
    return { ...options, maxAge: 15 * 60 * 1000 };
  }

  if (type === "refresh") {
    // Refresh Token: Long Lived (e.g., 7 Days)
    return { ...options, maxAge: 7 * 24 * 60 * 60 * 1000 };
  }

  return options;
};

/**
 * 🔥 HELPER: Handle Token Generation & Response
 * Code Duplication ni tagginchadaniki common function
 */
const sendTokenResponse = async (user, statusCode, res, message) => {
  // Generate tokens
  const { accessToken, refreshToken } = generateTokenPair({
    id: user._id,
    email: user.email,
    role: user.role,
  });

  // Save refresh token to DB
  user.refreshToken = refreshToken;

  // Login aithe lastLogin update chey
  if (
    message.toLowerCase().includes("login") ||
    message.toLowerCase().includes("refresh")
  ) {
    user.lastLogin = new Date();
  }

  await user.save({ validateBeforeSave: false });

  // 🔥 Set Cookies (Both Access & Refresh)
  res.cookie("access_token", accessToken, getCookieOptions("access"));
  res.cookie("refresh_token", refreshToken, getCookieOptions("refresh"));

  // Send Response (No tokens in body)
  res.status(statusCode).json({
    success: true,
    message,
    data: {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        profilePic: user.profilePic || "",
        garage: user.garage, // Fast UI load kosam garage data
        addresses: user.addresses, // Address data
      },
      isAuthenticated: true,
    },
  });
};

/* ==========================================================================
   AUTHENTICATION CONTROLLERS
   ========================================================================== */
/**
 * @desc    User Registration with Email Verification
 * @route   POST /api/auth/register
 */
export const registerUser = asyncHandler(async (req, res) => {
  const { name, email, password, phone } = req.body;

  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw new AppError("User with this email already exists", 400);
  }

  // 1. Create User Instance (డేటాబేస్ లో ఇంకా సేవ్ అవ్వలేదు, కేవలం మెమరీలో ఉంది)
  const user = new User({
    name,
    email,
    password,
    phone,
    isEmailVerified: false,
  });

  // 2. Generate Verification Token
  const verificationToken = user.createEmailVerificationToken();

  // 3. Setup Email
  const verifyURL = `${process.env.FRONTEND_URL}/verify-email/${verificationToken}`;
  const message = `Welcome to Varshini Hyundai Spares, ${user.name}!\n\nPlease verify your email address by clicking on the link below:\n\n${verifyURL}\n\nThis link is valid for 24 hours.`;

  try {
    // 🔥 NEW: HTML జనరేట్ చేస్తున్నాం
    const htmlContent = generateVerificationEmailTemplate(user.name, verifyURL);

    await sendEmail({
      email: user.email,
      subject: "Action Required: Verify Your Email - Varshini Hyundai Spares",
      message, // ఫాల్ బ్యాక్ కోసం పాత టెక్స్ట్ అలాగే ఉంచుతున్నాం
      html: htmlContent, // ఇక్కడ html పాస్ చేస్తున్నాం
    });

    await user.save();
  } catch (err) {
    console.error("❌ EMAIL ERROR IN REGISTER:", err);

    // మెయిల్ వెళ్ళలేదు కాబట్టి DB లో అసలు యూజర్ సేవ్ అవ్వడు.
    throw new AppError(
      "Email could not be sent. Please check your internet connection or try again later.",
      500,
    );
  }

  // 5. Send response
  res.status(201).json({
    success: true,
    message:
      "Registration successful. Please check your email to verify your account before logging in.",
  });
});

/**
 * @desc    Verify User Email
 * @route   GET /api/auth/verify-email/:token
 */
export const verifyEmail = asyncHandler(async (req, res) => {
  const hashedToken = crypto
    .createHash("sha256")
    .update(req.params.token)
    .digest("hex");

  const user = await User.findOne({
    emailVerificationToken: hashedToken,
    emailVerificationExpires: { $gt: Date.now() },
  });

  if (!user) {
    throw new AppError("Verification link is invalid or has expired.", 400);
  }

  user.isEmailVerified = true;
  user.emailVerificationToken = undefined;
  user.emailVerificationExpires = undefined;
  await user.save({ validateBeforeSave: false });

  sendSuccess(res, 200, "Email verified successfully! Welcome to the family.");
});

/**
 * @desc    Resend Email Verification Link
 * @route   POST /api/auth/resend-verification
 */
export const resendVerificationEmail = asyncHandler(async (req, res) => {
  const { email } = req.body;

  if (!email) {
    throw new AppError("Please provide an email address", 400);
  }

  const user = await User.findOne({ email });

  if (!user) {
    throw new AppError("No user found with this email", 404);
  }

  if (user.isEmailVerified) {
    throw new AppError("This email is already verified. Please login.", 400);
  }

  // కొత్త టోకెన్ జనరేట్ చేయండి (ఇంకా సేవ్ చేయొద్దు)
  const verificationToken = user.createEmailVerificationToken();

  const verifyURL = `${process.env.FRONTEND_URL}/verify-email/${verificationToken}`;
  const message = `Here is your new verification link:\n\n${verifyURL}\n\nValid for 24 hours.`;

  try {
    const htmlContent = generateVerificationEmailTemplate(user.name, verifyURL);

    await sendEmail({
      email: user.email,
      subject: "New Verification Link - Varshini Hyundai Spares",
      message,
      html: htmlContent,
    });

    await user.save({ validateBeforeSave: false });
  } catch (err) {
    console.error("❌ EMAIL ERROR IN RESEND:", err);

    throw new AppError("Email could not be sent. Try again later.", 500);
  }
});

/**
 * @desc    User Login
 * @route   POST /api/auth/login
 */
export const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    throw new AppError("Please provide email and password", 400);
  }

  const user = await User.findOne({ email }).select("+password");

  if (!user || !(await user.comparePassword(password))) {
    throw new AppError("Invalid credentials", 401);
  }

  if (!user.isEmailVerified) {
    throw new AppError(
      "Please verify your email address to login. Check your inbox for the verification link.",
      403,
    );
  }

  if (!user.isActive) {
    throw new AppError("Account is deactivated", 403);
  }

  await sendTokenResponse(user, 200, res, "Login successful");
});

/**
 * @desc    Google Authentication
 * @route   POST /api/auth/google-login
 */
export const googleLogin = asyncHandler(async (req, res) => {
  const { token } = req.body;
  if (!token) throw new AppError("Google token is required", 400);

  try {
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const { email, name, picture } = ticket.getPayload();
    let user = await User.findOne({ email });

    if (!user) {
      const randomPassword = crypto.randomBytes(32).toString("hex");
      user = await User.create({
        name,
        email,
        password: randomPassword,
        phone: "0000000000",
        role: "customer",
        isEmailVerified: true,
        isActive: true,
        profilePic: picture,
      });
    }

    if (!user.isActive) {
      throw new AppError("Account is deactivated", 403);
    }

    await sendTokenResponse(user, 200, res, "Google login successful");
  } catch (error) {
    console.error("Google Auth Error:", error);
    throw new AppError("Google authentication failed", 401);
  }
});

/**
 * @desc    Refresh Access Token
 * @route   POST /api/auth/refresh-token
 */
export const refreshUserToken = asyncHandler(async (req, res) => {
  // Read Refresh Token from Cookie (Not Body)
  const refreshToken = req.cookies.refresh_token;

  if (!refreshToken) {
    throw new AppError("No session found, please login", 401);
  }

  try {
    const decoded = verifyRefreshToken(refreshToken);

    // Reuse Detection Logic
    const user = await User.findById(decoded.id).select("+refreshToken");

    if (!user || user.refreshToken !== refreshToken) {
      // Possible Token Theft: Clear everything
      res.clearCookie("access_token");
      res.clearCookie("refresh_token");
      throw new AppError("Session invalid, please login again", 401);
    }

    // Generate NEW Tokens & Set Cookies
    await sendTokenResponse(user, 200, res, "Token refreshed");
  } catch (error) {
    res.clearCookie("access_token");
    res.clearCookie("refresh_token");
    throw new AppError("Session expired", 401);
  }
});

/**
 * @desc    Check Session (For Initial App Load)
 * @route   GET /api/auth/check-session
 */
export const checkSession = asyncHandler(async (req, res) => {
  const refreshToken = req.cookies.refresh_token;

  // 1. Refresh Token లేకపోతే Session లేనట్లే
  if (!refreshToken) {
    return res.status(200).json({ success: false, isAuthenticated: false });
  }

  try {
    // 2. Token Verify చేయాలి
    const decoded = verifyRefreshToken(refreshToken);

    // 3. Database నుండి లేటెస్ట్ User Data తెచ్చుకోవాలి
    // గమనిక: .select("+refreshToken") వాడాము ఎందుకంటే టోకెన్ మ్యాచ్ చేయాలి కాబట్టి
    const user = await User.findById(decoded.id).select("+refreshToken");

    // 4. Token Match కాకపోతే లేదా User లేకపోతే Error
    if (!user || user.refreshToken !== refreshToken) {
      throw new Error("Invalid Token");
    }

    // 5. 🔥 FINAL FIX: Frontend కి కావాల్సిన పూర్తి డేటా (Addresses తో సహా) పంపాలి
    res.status(200).json({
      success: true,
      isAuthenticated: true,
      data: {
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          phone: user.phone || "",
          role: user.role,
          profilePic: user.profilePic || "",
          garage: user.garage, // ✅ Garage Data కూడా వెళ్తుంది
          addresses: user.addresses, // ✅ Address Data (ఇది మెయిన్ ఫిక్స్)
        },
      },
    });
  } catch (error) {
    // Session Expire అయితే Cookies క్లియర్ చేస్తున్నాం
    // Note: getCookieOptions పైన డిఫైన్ చేసి ఉండాలి
    res.clearCookie("access_token", getCookieOptions("access"));
    res.clearCookie("refresh_token", getCookieOptions("refresh"));

    return res.status(200).json({ success: false, isAuthenticated: false });
  }
});

/**
 * @desc    User Logout
 * @route   POST /api/auth/logout
 */
export const logoutUser = asyncHandler(async (req, res) => {
  if (req.user) {
    await User.findByIdAndUpdate(req.user._id, { refreshToken: null });
  }

  // Clear Cookies
  res.clearCookie("access_token", getCookieOptions("access"));
  res.clearCookie("refresh_token", getCookieOptions("refresh"));

  sendSuccess(res, 200, "Logout successful");
});

/* ==========================================================================
   PROFILE CONTROLLERS
   ========================================================================== */

export const getUserProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  sendSuccess(res, 200, "Profile retrieved", { user });
});

export const updateUserProfile = asyncHandler(async (req, res) => {
  const { name, phone } = req.body;
  const user = await User.findByIdAndUpdate(
    req.user._id,
    { name, phone },
    { new: true, runValidators: true },
  );
  sendSuccess(res, 200, "Profile updated", { user });
});

export const changeUserPassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const user = await User.findById(req.user._id).select("+password");

  if (!user || !(await user.comparePassword(currentPassword))) {
    throw new AppError("Current password is incorrect", 401);
  }

  user.password = newPassword;
  await user.save();
  sendSuccess(res, 200, "Password changed successfully");
});

/* ==========================================================================
   ADDRESS CONTROLLERS (RESTORED)
   ========================================================================== */

export const addAddress = asyncHandler(async (req, res) => {
  const { addressType, street, city, state, pincode, isDefault } = req.body;

  const user = await User.findById(req.user._id);
  if (!user) throw new AppError("User not found", 404);

  if (isDefault) {
    user.addresses.forEach((addr) => (addr.isDefault = false));
  }

  user.addresses.push({
    addressType,
    street,
    city,
    state,
    pincode,
    isDefault: isDefault || user.addresses.length === 0,
  });

  await user.save();
  sendSuccess(res, 201, "Address added successfully", {
    addresses: user.addresses,
  });
});

export const updateAddress = asyncHandler(async (req, res) => {
  const { addressId } = req.params;
  const { addressType, street, city, state, pincode, isDefault } = req.body;

  const user = await User.findById(req.user._id);
  if (!user) throw new AppError("User not found", 404);

  const address = user.addresses.id(addressId);
  if (!address) throw new AppError("Address not found", 404);

  if (addressType) address.addressType = addressType;
  if (street) address.street = street;
  if (city) address.city = city;
  if (state) address.state = state;
  if (pincode) address.pincode = pincode;

  if (isDefault) {
    user.addresses.forEach((addr) => (addr.isDefault = false));
    address.isDefault = true;
  }

  await user.save();
  sendSuccess(res, 200, "Address updated successfully", {
    addresses: user.addresses,
  });
});

export const deleteAddress = asyncHandler(async (req, res) => {
  const { addressId } = req.params;
  const user = await User.findById(req.user._id);
  if (!user) throw new AppError("User not found", 404);

  const address = user.addresses.id(addressId);
  if (!address) throw new AppError("Address not found", 404);

  address.deleteOne();

  if (
    user.addresses.length > 0 &&
    !user.addresses.some((addr) => addr.isDefault)
  ) {
    user.addresses[0].isDefault = true;
  }

  await user.save();
  sendSuccess(res, 200, "Address deleted successfully", {
    addresses: user.addresses,
  });
});

/* ==========================================================================
   GARAGE CONTROLLERS (RESTORED)
   ========================================================================== */

export const getGarage = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  if (user) {
    res.json(user.garage);
  } else {
    throw new Error("User not found");
  }
});

export const addVehicleToGarage = asyncHandler(async (req, res) => {
  const { model, year, variant, fuelType } = req.body;
  const user = await User.findById(req.user._id);

  if (user) {
    const isDuplicate = user.garage.find(
      (car) =>
        car.model === model &&
        car.year === year &&
        car.variant === variant &&
        car.fuelType === fuelType,
    );

    if (isDuplicate) {
      res.status(400);
      throw new Error("This vehicle is already in your garage");
    }

    const newVehicle = {
      model,
      year,
      variant,
      fuelType,
      isPrimary: user.garage.length === 0,
    };
    user.garage.push(newVehicle);

    await user.save();
    res.status(201).json(user.garage);
  } else {
    res.status(404);
    throw new Error("User not found");
  }
});

export const removeVehicleFromGarage = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  if (user) {
    user.garage = user.garage.filter(
      (car) => car._id.toString() !== req.params.vehicleId,
    );
    await user.save();
    res.json(user.garage);
  } else {
    res.status(404);
    throw new Error("User not found");
  }
});

// Sync Garage (Updated with cleaner logic)
export const syncGarage = asyncHandler(async (req, res) => {
  const { localGarage } = req.body;
  const user = await User.findById(req.user._id);

  if (!user) throw new AppError("User not found", 404);

  if (localGarage && Array.isArray(localGarage) && localGarage.length > 0) {
    const newCars = localGarage
      .filter(
        (localCar) =>
          !user.garage.some(
            (dbCar) =>
              dbCar.model === localCar.model &&
              dbCar.year === localCar.year &&
              dbCar.variant === localCar.variant,
          ),
      )
      .map((car) => ({
        ...car,
        fuelType: car.fuelType || "Petrol",
        isPrimary: user.garage.length === 0,
      }));

    if (newCars.length > 0) {
      user.garage.push(...newCars);
      await user.save();
    }
  }

  res.json({ success: true, garage: user.garage });
});

/* ==========================================================================
   PASSWORD RESET CONTROLLERS (RESTORED)
   ========================================================================== */

export const forgotPassword = async (req, res) => {
  try {
    const user = await User.findOne({ email: req.body.email });
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found with this email" });
    }

    const resetToken = user.createPasswordResetToken();
    await user.save({ validateBeforeSave: false });

    const resetURL = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;
    const message = `Forgot your password? Reset it here: \n\n ${resetURL} \n\nIf you didn't forget your password, please ignore this email!`;

    try {
      // 🔥 NEW: పాస్‌వర్డ్ రీసెట్ HTML జనరేట్ చేస్తున్నాం
      const htmlContent = generatePasswordResetEmailTemplate(
        user.name,
        resetURL,
      );

      await sendEmail({
        email: user.email,
        subject: "Password Reset Request - Varshini Hyundai Spares", // సబ్జెక్ట్ మార్చాం
        message,
        html: htmlContent, // ఇక్కడ html పాస్ చేస్తున్నాం
      });

      res.status(200).json({
        success: true,
        message: "Token sent to email!",
      });
    } catch (err) {
      user.passwordResetToken = undefined;
      user.passwordResetExpires = undefined;
      await user.save({ validateBeforeSave: false });

      return res.status(500).json({
        success: false,
        message: "Email could not be sent. Please try again later.",
      });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const resetPassword = async (req, res) => {
  try {
    const hashedToken = crypto
      .createHash("sha256")
      .update(req.params.token)
      .digest("hex");

    const user = await User.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res
        .status(400)
        .json({ success: false, message: "Token is invalid or has expired" });
    }

    user.password = req.body.password;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;

    await user.save();

    res.status(200).json({
      success: true,
      message: "Password changed successfully! You can now login.",
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
