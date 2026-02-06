import mongoose from "mongoose";

const activityLogSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null, // లాగిన్ అవ్వని వారి కోసం null ఉంటుంది
    },
    guestId: { type: String }, // గెస్ట్ యూజర్స్ ని ట్రాక్ చేయడానికి
    userName: { type: String, default: "Guest" },
    action: {
      type: String,
      required: true,
      // ఏమేమి ట్రాక్ చేయాలి?
      enum: [
        "PAGE_VIEW",
        "ADD_TO_CART",
        "ORDER_PLACED",
        "LOGIN",
        "SEARCH",
        "CHECKOUT_START",
        "TAB_CHANGE", // ✅ Add This
        "EXIT_INTENT",
        "CLICK",
      ],
    },
    details: { type: Object, default: {} }, // ఉదా: ఏ ప్రొడక్ట్ చూశారు? URL ఏంటి?
    ipAddress: { type: String },
  },
  { timestamps: true },
);

// అడ్మిన్ లేటెస్ట్ డేటా అడిగినప్పుడు ఫాస్ట్ గా రావడానికి Index
activityLogSchema.index({ createdAt: -1 });

const ActivityLog = mongoose.model("ActivityLog", activityLogSchema);
export default ActivityLog;
