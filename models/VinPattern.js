import mongoose from "mongoose";

const vinPatternSchema = new mongoose.Schema({
  wmiCode: { type: String, required: true, index: true }, // Ex: MAL
  vdsPattern: { type: String, required: true, index: true }, // Ex: C181CL
  modelCode: { type: String }, // Ex: C1
  brand: { type: String, default: "Hyundai" },
  model: { type: String, required: true }, // Ex: Creta
  generation: { type: String },
  fuelType: {
    type: String,
    enum: ["Petrol", "Diesel", "CNG", "Electric"],
    required: true,
  },
  transmission: {
    type: String,
    enum: ["Manual", "Automatic", "DCT", "CVT", "iMT"],
  },
  engineCapacity: { type: String }, // Ex: 1.6L
  variant: { type: String }, // Ex: SX
  yearStart: { type: Number },
  yearEnd: { type: Number },
  priority: { type: Number, default: 50 }, // Higher checks first
  isActive: { type: Boolean, default: true },
});

const VinPattern = mongoose.model("VinPattern", vinPatternSchema);

export default VinPattern;
