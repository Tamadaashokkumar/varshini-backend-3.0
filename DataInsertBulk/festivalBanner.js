const carouselData = [
  {
    title: "Genuine Brake Pads",
    subtitle: "Safety First, Always.",
    discount: "Flat 20% OFF",
    description:
      "High-performance ceramic brake pads for Creta, Venue & i20. Maximum stopping power with zero noise.",
    buttonText: "Explore Brakes",
    link: "/category/Brakes",
    image:
      "https://res.cloudinary.com/demo/image/upload/v1680000000/brake-pads-hero.png", // Replace with your Cloudinary URL

    // 🔥 Design: Red Theme (Performance/Danger)
    bgClass:
      "bg-gradient-to-br from-red-600 via-red-700 to-rose-900 dark:from-red-950 dark:via-red-900 dark:to-black",
    textClass: "text-white",
    buttonClass: "bg-white text-red-700 hover:bg-red-50 font-bold",

    isActive: true,
    order: 1,
  },
  {
    title: "Synthetic Engine Oil",
    subtitle: "Engine Health Matters",
    discount: "Buy 2 Get 1",
    description:
      "Premium fully synthetic oil for superior engine protection and mileage improvement.",
    buttonText: "Shop Fluids",
    link: "/category/Fluids",
    image:
      "https://res.cloudinary.com/demo/image/upload/v1680000000/engine-oil-hero.png", // Replace with your Cloudinary URL

    // 🔥 Design: Blue/Cyan Theme (Cooling/Liquids)
    bgClass:
      "bg-gradient-to-r from-cyan-500 to-blue-600 dark:from-blue-900 dark:to-cyan-900",
    textClass: "text-white",
    buttonClass:
      "bg-gray-900 text-white hover:bg-black font-bold border border-white/20",

    isActive: true,
    order: 2,
  },
  {
    title: "LED Headlights Kit",
    subtitle: "Brighter Vision at Night",
    discount: "Save ₹1500",
    description:
      "Upgrade your Verna or Alcazar with genuine Hyundai LED lighting kits. 2-year warranty included.",
    buttonText: "Upgrade Now",
    link: "/category/Electrical",
    image:
      "https://res.cloudinary.com/demo/image/upload/v1680000000/headlight-hero.png", // Replace with your Cloudinary URL

    // 🔥 Design: Dark/Night Theme (Premium)
    bgClass: "bg-gradient-to-br from-gray-900 via-gray-800 to-black",
    textClass: "text-gray-100",
    buttonClass: "bg-cyan-500 text-black hover:bg-cyan-400 font-bold",

    isActive: true,
    order: 3,
  },
  {
    title: "Suspension Kit Sale",
    subtitle: "Smooth Rides Ahead",
    discount: "Up to 30% OFF",
    description:
      "Complete suspension overhaul kits for older models like Santro and Eon.",
    buttonText: "Check Parts",
    link: "/category/Suspension",
    image:
      "https://res.cloudinary.com/demo/image/upload/v1680000000/suspension-hero.png", // Replace with your Cloudinary URL

    // 🔥 Design: Green/Teal Theme (Stability)
    bgClass:
      "bg-gradient-to-bl from-emerald-500 to-teal-700 dark:from-teal-900 dark:to-emerald-950",
    textClass: "text-white",
    buttonClass: "bg-white text-teal-800 hover:bg-gray-100 font-bold",

    isActive: true,
    order: 4,
  },
];

import Carousel from "../models/Carousel.js"; // Path check cheskondi

const seedCarousel = async () => {
  try {
    await Carousel.deleteMany(); // పాత డేటా క్లియర్ చేస్తుంది
    await Carousel.insertMany(carouselData); // కొత్త డేటా యాడ్ చేస్తుంది
    console.log("✅ Carousel Data Imported Successfully!");
    process.exit();
  } catch (error) {
    console.error("❌ Error Importing Data:", error);
    process.exit(1);
  }
};

export default seedCarousel;
