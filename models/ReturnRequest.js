import mongoose from 'mongoose';

const returnRequestSchema = new mongoose.Schema(
  {
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
      required: true
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    // ఏ ప్రొడక్ట్ రిటర్న్ చేస్తున్నారు? (ఒక ఆర్డర్లో మల్టిపుల్ ఐటమ్స్ ఉండొచ్చు)
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true
    },
    reason: {
      type: String,
      required: true,
      enum: [
        'Damaged Product',
        'Wrong Item Received',
        'Not fitting (Compatibility Issue)',
        'Defective/Not Working',
        'Other'
      ]
    },
    description: {
      type: String, // కస్టమర్ రాసే వివరణ
      required: true
    },
    // కస్టమర్ అప్‌లోడ్ చేసే డ్యామేజ్ ఫోటోలు
    images: [
      {
        url: { type: String, required: true },
        publicId: String
      }
    ],
    status: {
      type: String,
      enum: ['Pending', 'Approved', 'Rejected', 'Pickup Scheduled', 'Picked Up', 'Refunded'],
      default: 'Pending'
    },
    // అడ్మిన్ రిజెక్ట్ చేస్తే కారణం ఇక్కడ రాయొచ్చు
    adminComment: {
      type: String
    },
    refundAmount: {
      type: Number,
      required: true
    },
    // పికప్ అడ్రస్ (ఆర్డర్ అడ్రస్ కంటే వేరుగా ఉంటే)
    pickupAddress: {
      street: String,
      city: String,
      state: String,
      pincode: String,
      phone: String
    }
  },
  { timestamps: true }
);

const ReturnRequest = mongoose.model('ReturnRequest', returnRequestSchema);
export default ReturnRequest;