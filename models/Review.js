import mongoose from "mongoose";

const reviewSchema = new mongoose.Schema(
  {
    review: {
      type: String,
      required: [true, "Review cannot be empty!"],
      trim: true,
    },
    rating: {
      type: Number,
      min: 1,
      max: 5,
      required: [true, "Rating is required"],
    },
    product: {
      type: mongoose.Schema.ObjectId,
      ref: "Product",
      required: [true, "Review must belong to a product."],
    },
    user: {
      type: mongoose.Schema.ObjectId,
      ref: "User", // మీ User Model పేరు ఇక్కడ ఇవ్వండి
      required: [true, "Review must belong to a user."],
    },
    // Optional: రివ్యూలో ఫోటోలు పెట్టాలనుకుంటే
    images: [
      {
        url: String,
        publicId: String,
      },
    ],
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

// 1. UNIQUE INDEX: ఒక యూజర్ ఒక ప్రొడక్ట్‌కి ఒక రివ్యూ మాత్రమే ఇవ్వగలడు.
reviewSchema.index({ product: 1, user: 1 }, { unique: true });

// 2. STATIC METHOD: Average Rating ని Calculate చేయడానికి
reviewSchema.statics.calcAverageRatings = async function (productId) {
  // Aggregation Pipeline
  const stats = await this.aggregate([
    {
      $match: { product: productId },
    },
    {
      $group: {
        _id: "$product",
        nRating: { $sum: 1 }, // Total Reviews Count
        avgRating: { $avg: "$rating" }, // Average Calculation
      },
    },
  ]);

  // Product Model ని అప్‌డేట్ చేయడం
  if (stats.length > 0) {
    await mongoose.model("Product").findByIdAndUpdate(productId, {
      totalReviews: stats[0].nRating,
      averageRating: Math.round(stats[0].avgRating * 10) / 10, // 4.5
    });
  } else {
    // రివ్యూలు అన్నీ డిలీట్ అయితే డీఫాల్ట్ విాల్యూస్
    await mongoose.model("Product").findByIdAndUpdate(productId, {
      totalReviews: 0,
      averageRating: 0, // 0 (Default)
    });
  }
};

// 3. POST SAVE HOOK: రివ్యూ సేవ్ అయిన తర్వాత లెక్కించడం
reviewSchema.post("save", function () {
  // 'this.constructor' అంటే Review Model
  this.constructor.calcAverageRatings(this.product);
});

// 4. PRE HOOK for DELETE/UPDATE: అప్‌డేట్ లేదా డిలీట్ చేసేటప్పుడు కూడా లెక్క మారాలి
// రివ్యూని findOneAnd... ద్వారా డిలీట్ చేసినప్పుడు ఇది ట్రిగ్గర్ అవుతుంది.
reviewSchema.post(/^findOneAnd/, async function (doc) {
  if (doc) {
    await doc.constructor.calcAverageRatings(doc.product);
  }
});

const Review = mongoose.model("Review", reviewSchema);

export default Review;
