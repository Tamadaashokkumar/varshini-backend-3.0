const dummyProducts = [
  {
    name: "Front Bumper Assembly",
    partNumber: "86511-C9009",
    description:
      "Premium quality front bumper providing excellent impact absorption and aesthetic appeal. Comes primed and ready to paint.",
    category: "Body",
    subcategory: "Bumpers",
    compatibleModels: [
      { modelName: "Creta", yearFrom: 2018, yearTo: 2020, variant: "SX" },
    ],
    price: 4500,
    stock: 10,
    lowStockThreshold: 2,
    images: [
      {
        url: "https://example.com/images/bumper-creta.jpg",
        publicId: "spares/bumper-creta",
      },
    ],
    specifications: {
      Material: "ABS Plastic",
      Color: "Unpainted (Black Primer)",
      Position: "Front",
    },
    warrantyPeriod: "No Warranty",
    tags: ["body part", "bumper", "creta"],
    isActive: true,
  },
  {
    name: "LED Headlight Assembly (Right)",
    partNumber: "92102-C9001",
    description:
      "High-intensity LED headlight assembly ensuring clear visibility during night driving. Includes DRLs.",
    category: "Electrical",
    subcategory: "Lighting",
    compatibleModels: [
      {
        modelName: "Creta",
        yearFrom: 2020,
        yearTo: null,
        variant: "Top Model",
      },
    ],
    price: 12500,
    discountPrice: 11000,
    stock: 25,
    lowStockThreshold: 5,
    images: [
      {
        url: "https://example.com/images/headlight-right.jpg",
        publicId: "spares/headlight-right",
      },
    ],
    specifications: {
      "Bulb Type": "LED",
      Voltage: "12V",
      Waterproof: "IP67",
    },
    warrantyPeriod: "1 Year",
    tags: ["light", "headlamp", "electrical"],
    isActive: true,
  },
  {
    name: "Front Brake Pad Set",
    partNumber: "58101-M0A02",
    description:
      "Ceramic brake pads designed for noiseless braking and reduced dust. Includes wear sensors.",
    category: "Brake",
    subcategory: "Brake Pads",
    compatibleModels: [
      { modelName: "Alcazar", yearFrom: 2021, yearTo: null, variant: "All" },
      { modelName: "Creta", yearFrom: 2020, yearTo: null, variant: "All" },
    ],
    price: 2800,
    stock: 60,
    lowStockThreshold: 10,
    images: [
      {
        url: "https://example.com/images/brake-pads.jpg",
        publicId: "spares/brake-pads",
      },
    ],
    specifications: {
      Material: "Ceramic Composite",
      Set: "4 Pads (Left + Right)",
      Position: "Front Wheels",
    },
    warrantyPeriod: "No Warranty",
    tags: ["brakes", "safety", "pads"],
    isActive: true,
  },
  {
    name: "Rear Shock Absorber",
    partNumber: "55311-A0003",
    description:
      "Gas-charged rear shock absorber for smooth ride quality and stability on rough roads.",
    category: "Suspension",
    subcategory: "Shock Absorbers",
    compatibleModels: [
      { modelName: "Grand i10", yearFrom: 2013, yearTo: 2019, variant: "All" },
    ],
    price: 1850,
    stock: 40,
    lowStockThreshold: 8,
    images: [
      {
        url: "https://example.com/images/shock-absorber.jpg",
        publicId: "spares/shock-absorber",
      },
    ],
    specifications: {
      Type: "Gas Charged",
      Position: "Rear Left/Right",
      Length: "450mm",
    },
    warrantyPeriod: "6 Months",
    tags: ["suspension", "shocker", "comfort"],
    isActive: true,
  },
  {
    name: "Clutch Plate Kit",
    partNumber: "41100-02504",
    description:
      "Complete clutch kit including clutch plate and pressure plate. Ensures smooth gear shifting.",
    category: "Transmission",
    subcategory: "Clutch",
    compatibleModels: [
      { modelName: "Santro", yearFrom: 2008, yearTo: 2014, variant: "Xing" },
      { modelName: "i10", yearFrom: 2009, yearTo: 2013, variant: "1.1L" },
    ],
    price: 3500,
    discountPrice: 3200,
    stock: 15,
    lowStockThreshold: 3,
    images: [
      {
        url: "https://example.com/images/clutch-kit.jpg",
        publicId: "spares/clutch-kit",
      },
    ],
    specifications: {
      Diameter: "180mm",
      Material: "Organic Friction Material",
      Includes: "Plate + Cover",
    },
    warrantyPeriod: "No Warranty",
    tags: ["clutch", "gears", "transmission"],
    isActive: true,
  },
  {
    name: "Premium 7D Floor Mats",
    partNumber: "ACC-MAT-001",
    description:
      "Luxury 7D floor mats with anti-skid bottom and diamond stitching. Custom fit for specific models.",
    category: "Accessories",
    subcategory: "Interior Accessories",
    compatibleModels: [
      { modelName: "Tucson", yearFrom: 2022, yearTo: null, variant: "All" },
    ],
    price: 6500,
    discountPrice: 5999,
    stock: 20,
    lowStockThreshold: 5,
    images: [
      {
        url: "https://example.com/images/mats-tucson.jpg",
        publicId: "spares/mats-tucson",
      },
    ],
    specifications: {
      Color: "Black & Beige",
      Material: "PU Leather",
      Washable: "Yes",
    },
    warrantyPeriod: "1 Year",
    tags: ["mats", "interior", "luxury"],
    isActive: true,
  },
  {
    name: "Cabin Air Filter (AC Filter)",
    partNumber: "97133-D1005",
    description:
      "Activated carbon cabin filter that blocks dust, pollen, and bad odors from entering the car interior.",
    category: "Service Parts",
    subcategory: "AC Parts",
    compatibleModels: [
      { modelName: "i20", yearFrom: 2015, yearTo: 2020, variant: "Elite" },
      { modelName: "Creta", yearFrom: 2015, yearTo: 2020, variant: "Gen 1" },
    ],
    price: 650,
    stock: 200,
    lowStockThreshold: 30,
    images: [
      {
        url: "https://example.com/images/ac-filter.jpg",
        publicId: "spares/ac-filter",
      },
    ],
    specifications: {
      Type: "Activated Carbon",
      Dimensions: "20x18x2 cm",
    },
    warrantyPeriod: "No Warranty",
    tags: ["ac", "filter", "air"],
    isActive: true,
  },
  {
    name: "Side Mirror Assembly (Left)",
    partNumber: "87610-1S006",
    description:
      "Electric adjustable side mirror with integrated turn indicator. Color matched body cover sold separately.",
    category: "Exterior",
    subcategory: "Mirrors",
    compatibleModels: [
      { modelName: "i20", yearFrom: 2012, yearTo: 2014, variant: "Sportz" },
    ],
    price: 2200,
    stock: 12,
    lowStockThreshold: 4,
    images: [
      {
        url: "https://example.com/images/mirror-left.jpg",
        publicId: "spares/mirror-left",
      },
    ],
    specifications: {
      Adjustment: "Electric",
      Foldable: "Manual",
      Indicator: "Yes",
    },
    warrantyPeriod: "6 Months",
    tags: ["mirror", "exterior", "glass"],
    isActive: true,
  },
  {
    name: "Spark Plug Set (4 pcs)",
    partNumber: "18855-10067",
    description:
      "Genuine Iridium spark plugs for better ignition and fuel efficiency.",
    category: "Engine",
    subcategory: "Ignition",
    compatibleModels: [
      {
        modelName: "Grand i10",
        yearFrom: 2014,
        yearTo: 2019,
        variant: "Petrol",
      },
      { modelName: "Xcent", yearFrom: 2014, yearTo: 2019, variant: "Petrol" },
    ],
    price: 1400,
    discountPrice: 1250,
    stock: 80,
    lowStockThreshold: 15,
    images: [
      {
        url: "https://example.com/images/spark-plugs.jpg",
        publicId: "spares/spark-plugs",
      },
    ],
    specifications: {
      Type: "Iridium",
      Gap: "1.1mm",
      Quantity: "Pack of 4",
    },
    warrantyPeriod: "No Warranty",
    tags: ["engine", "ignition", "spark plug"],
    isActive: true,
  },
];

export default dummyProducts;
