import Carousel from "../models/Carousel.js";
// మీ cloudinary config ఫైల్ పాత్ సరిగ్గా ఇవ్వండి (ఉదా: ../utils/cloudinary.js)
import { deleteFromCloudinary } from "../config/cloudinary.js";

// Helper Function: URL నుండి Public ID ని బయటకు తీయడానికి
// (ఎందుకంటే మనం DB లో కేవలం URL మాత్రమే సేవ్ చేస్తున్నాం, డిలీట్ చేయడానికి ID కావాలి)
const getPublicIdFromUrl = (url) => {
  if (!url) return null;
  try {
    // Example: https://res.cloudinary.com/.../upload/v1234/hyundai-spares/others/image.jpg
    const parts = url.split("/");
    const lastPart = parts[parts.length - 1]; // image.jpg
    const fileName = lastPart.split(".")[0]; // image
    // గమనిక: మీ ఫోల్డర్ స్ట్రక్చర్ బట్టి ఇది మారుతుంది.
    // "hyundai-spares/others/filename" అని రావాలంటే కొంచెం కాంప్లెక్స్ Regex వాడాలి.
    // కానీ సింపుల్ గా 'deleteFromCloudinary' కి మనం సేవ్ చేసిన filename పంపిస్తే చాలు.

    // SAFE WAY: మనం DB లో పాత ఇమేజ్ ని డిలీట్ చేసేటప్పుడు జాగ్రత్తగా ఉండాలి.
    // Cloudinary URL లో ఫోల్డర్ పేరు కూడా ఉంటుంది కాబట్టి, Regex వాడుదాం.
    const regex = /\/([^/]+)\/([^/]+)\.[^.]+$/; // Matches folder/filename.ext
    const match = url.match(regex);
    if (match) {
      return `${match[1]}/${match[2]}`; // Returns "folder/filename"
    }
    return null;
  } catch (error) {
    console.error("Error extracting public ID:", error);
    return null;
  }
};

// 1. Get All Carousels (Public)
export const getCarousels = async (req, res) => {
  try {
    const slides = await Carousel.find({ isActive: true }).sort({ order: 1 });
    res.status(200).json({ success: true, data: slides });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server Error", error });
  }
};

// 2. Add New Slide (Admin Only - With Image Upload)
export const addCarousel = async (req, res) => {
  try {
    // Multer Cloudinary Storage వాడినప్పుడు:
    // req.file.path = Cloudinary URL
    // req.file.filename = Public ID (folder/filename)

    const image = req.file ? req.file.path : "";

    const newSlide = new Carousel({
      ...req.body,
      image: image, // URL ని సేవ్ చేస్తున్నాం
    });

    await newSlide.save();

    res.status(201).json({
      success: true,
      message: "Slide Added Successfully",
      data: newSlide,
    });
  } catch (error) {
    console.error("Error adding slide:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to add slide", error });
  }
};

// 3. Update Slide (Admin Only - With Image Replace)
export const updateCarousel = async (req, res) => {
  try {
    const { id } = req.params;
    let updateData = { ...req.body };

    const slide = await Carousel.findById(id);
    if (!slide) {
      return res
        .status(404)
        .json({ success: false, message: "Slide not found" });
    }

    // 🔥 కొత్త ఇమేజ్ అప్‌లోడ్ అయితే పాతది డిలీట్ చేయాలి
    if (req.file) {
      // 1. పాత ఇమేజ్ ఉంటే క్లౌడినరీ నుండి డిలీట్ చేయడం
      if (slide.image) {
        // మీ Cloudinary Config లో ఫోల్డర్ "hyundai-spares/others" అని ఉంది కదా
        // మనం PublicID ని URL నుండి కాకుండా, మనం సేవ్ చేసేటప్పుడే PublicID కూడా సేవ్ చేసి ఉంటే బెటర్.
        // ప్రస్తుతానికి URL నుండి ట్రై చేద్దాం లేదా "hyundai-spares/others/" + filename అనుకుందాం.

        // పైన రాసిన Helper Function తో ID తీద్దాం
        const publicId = getPublicIdFromUrl(slide.image);
        if (publicId) {
          // మీ ఫోల్డర్ స్ట్రక్చర్ బట్టి ఇది "hyundai-spares/others/filename" అయి ఉండాలి
          // Regex పని చేయకపోతే, Hardcode folder check:
          const nameOnly = slide.image.split("/").pop().split(".")[0];
          await deleteFromCloudinary(`hyundai-spares/others/${nameOnly}`);
        }
      }

      // 2. కొత్త ఇమేజ్ URL సెట్ చేయడం
      updateData.image = req.file.path;
    }

    const updatedSlide = await Carousel.findByIdAndUpdate(id, updateData, {
      new: true,
    });

    res
      .status(200)
      .json({ success: true, message: "Slide Updated", data: updatedSlide });
  } catch (error) {
    console.error("Error updating slide:", error);
    res.status(500).json({ success: false, message: "Update Failed", error });
  }
};

// 4. Delete Slide (Admin Only - With Image Delete)
export const deleteCarousel = async (req, res) => {
  try {
    const slide = await Carousel.findById(req.params.id);
    if (!slide) {
      return res
        .status(404)
        .json({ success: false, message: "Slide not found" });
    }

    // ఇమేజ్ ఉంటే క్లౌడినరీ నుండి డిలీట్ చేయడం
    if (slide.image) {
      const nameOnly = slide.image.split("/").pop().split(".")[0];
      // మీ config లో "hyundai-spares/others" ఫోల్డర్ ఉంది కాబట్టి:
      await deleteFromCloudinary(`hyundai-spares/others/${nameOnly}`);
    }

    await Carousel.findByIdAndDelete(req.params.id);
    res.status(200).json({ success: true, message: "Slide Deleted" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Delete Failed", error });
  }
};

// 5. Get All for Admin
export const getAllAdminCarousels = async (req, res) => {
  try {
    const slides = await Carousel.find().sort({ order: 1 });
    res.status(200).json({ success: true, data: slides });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server Error", error });
  }
};
