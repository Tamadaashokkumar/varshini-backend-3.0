import { decodeVIN } from "../utils/vinService.js";

// @desc    Decode VIN to get Vehicle Details
// @route   POST /api/users/garage/decode-vin
// @access  Private/Public
export const decodeVinHandler = async (req, res) => {
  try {
    const { vin } = req.body;

    if (!vin) {
      return res
        .status(400)
        .json({ success: false, message: "VIN is required" });
    }

    const vehicleData = await decodeVIN(vin);

    res.status(200).json({
      success: true,
      data: vehicleData,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message || "Failed to decode VIN",
    });
  }
};
