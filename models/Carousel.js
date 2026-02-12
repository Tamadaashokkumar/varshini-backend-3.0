import mongoose from "mongoose";

const carouselSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    subtitle: { type: String, required: true },
    discount: { type: String, required: true },
    description: { type: String, required: true },
    buttonText: { type: String, default: "Shop Now" },
    link: { type: String, required: true },
    image: { type: String, default: "" },

    // Design Classes (Tailwind Classes stored as strings)
    bgClass: {
      type: String,
      default:
        "bg-gradient-to-br from-gray-100 via-gray-50 to-gray-200 dark:from-gray-900 dark:via-black dark:to-gray-800",
    },
    textClass: { type: String, default: "text-gray-800 dark:text-gray-300" },
    buttonClass: { type: String, default: "bg-black text-white" },

    isActive: { type: Boolean, default: true }, // స్లైడ్ చూపించాలా వద్దా
    order: { type: Number, default: 0 }, // ఏది ముందు రావాలి (Sorting)
  },
  { timestamps: true },
);

const Carousel = mongoose.model("Carousel", carouselSchema);
export default Carousel;
