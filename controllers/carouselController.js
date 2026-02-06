import Carousel from "../models/Carousel.js";

// 1. Get All Carousels (Public - For Website)
export const getCarousels = async (req, res) => {
  try {
    // isActive: true ఉన్నవి మాత్రమే తీసుకురావాలి, order ప్రకారం సార్ట్ చేయాలి
    const slides = await Carousel.find({ isActive: true }).sort({ order: 1 });
    res.status(200).json({ success: true, data: slides });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server Error", error });
  }
};

// 2. Add New Slide (Admin Only)
export const addCarousel = async (req, res) => {
  try {
    const newSlide = new Carousel(req.body);
    await newSlide.save();
    res
      .status(201)
      .json({
        success: true,
        message: "Slide Added Successfully",
        data: newSlide,
      });
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: "Failed to add slide", error });
  }
};

// 3. Update Slide (Admin Only)
export const updateCarousel = async (req, res) => {
  try {
    const updatedSlide = await Carousel.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true },
    );
    res
      .status(200)
      .json({ success: true, message: "Slide Updated", data: updatedSlide });
  } catch (error) {
    res.status(500).json({ success: false, message: "Update Failed", error });
  }
};

// 4. Delete Slide (Admin Only)
export const deleteCarousel = async (req, res) => {
  try {
    await Carousel.findByIdAndDelete(req.params.id);
    res.status(200).json({ success: true, message: "Slide Deleted" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Delete Failed", error });
  }
};

// 5. Get All for Admin (Includes Inactive)
export const getAllAdminCarousels = async (req, res) => {
  try {
    const slides = await Carousel.find().sort({ order: 1 });
    res.status(200).json({ success: true, data: slides });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server Error", error });
  }
};
