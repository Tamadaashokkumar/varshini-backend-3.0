import VinPattern from "../models/VinPattern.js";

// ✅ 1. YEAR CODES (From Team-BHP Data)
const getYearFromCode = (code) => {
  const yearMap = {
    A: 2010,
    B: 2011,
    C: 2012,
    D: 2013,
    E: 2014,
    F: 2015,
    G: 2016,
    H: 2017,
    J: 2018,
    K: 2019,
    L: 2020,
    M: 2021,
    N: 2022,
    P: 2023,
    R: 2024,
    S: 2025,
    T: 2026,
    V: 2027,
    W: 2028,
    X: 2029,
    Y: 2030,
  };
  return yearMap[code.toUpperCase()] || null;
};

// ✅ 2. MONTH CODES (Only if 19 chars are provided)
const getMonthFromCode = (code) => {
  const monthMap = {
    A: "January",
    B: "February",
    C: "March",
    D: "April",
    E: "May",
    F: "June",
    G: "July",
    H: "August",
    J: "September",
    K: "October",
    L: "November",
    M: "December",
  };
  return monthMap[code.toUpperCase()] || null;
};

export const decodeVIN = async (vinInput) => {
  // Clean the input (Remove spaces)
  const vin = vinInput.trim().toUpperCase();

  // ✅ VALIDATION: Allow both 17 (Standard) and 19 (Sticker) formats
  if (vin.length !== 17 && vin.length !== 19) {
    throw new Error(
      "Invalid VIN. Please enter 17 characters (from RC) or 19 characters (from Car Body).",
    );
  }

  // --- DECODING LOGIC ---

  // 1. Common Parts (First 17 chars are same in both)
  const wmi = vin.substring(0, 3); // MAL (Manufacturer)
  const vds = vin.substring(3, 9); // Pattern (Model Info)
  const yearCode = vin.charAt(9); // 10th Character is ALWAYS Year

  const manufacturingYear = getYearFromCode(yearCode) || "Unknown Year";

  // 2. Month Logic (Only if user gave 19 chars)
  let manufacturingMonth = "Unknown Month";
  if (vin.length === 19) {
    const monthCode = vin.charAt(18); // 19th Character
    manufacturingMonth = getMonthFromCode(monthCode) || "Unknown";
  }

  // 3. DATABASE PATTERN SEARCH
  // మనం 17 అక్షరాల స్టాండర్డ్ ప్యాటర్న్ తోనే వెతకాలి
  const pattern = await VinPattern.findOne({
    wmiCode: wmi,
    vdsPattern: { $regex: `^${vds.substring(0, 4)}` },
  });

  if (pattern) {
    // Description లో ఇయర్ మరియు మంత్ రెండూ చూపిద్దాం
    let desc = `${pattern.brand} ${pattern.model} ${pattern.variant} (${manufacturingYear})`;

    if (manufacturingMonth !== "Unknown Month") {
      desc += ` - Mfg: ${manufacturingMonth} ${manufacturingYear}`;
    }

    return {
      brand: pattern.brand,
      model: pattern.model,
      year: manufacturingYear,
      month: manufacturingMonth, // Extra Info
      variant: pattern.variant,
      fuelType: pattern.fuelType,
      transmission: pattern.transmission,
      fullDescription: desc,
    };
  }

  // ఏదీ మ్యాచ్ కాకపోతే
  throw new Error(
    `Vehicle not found for VIN: ${vin}. Try manually selecting the model.`,
  );
};
