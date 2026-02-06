// 1. Hyundai India Model Logic (Based on 4th Character)
// Note: 4th Character indicates the "Model Family"
const hyundaiModelMap = {
  // A-Series: Small Cars (Santro, i10, Xcent)
  A: "Grand i10 / Nios / Xcent",

  // B-Series: Hatchbacks (i20 Family)
  B: "Elite i20 / i20 N Line",

  // C-Series: Sedans & SUVs (Creta, Verna)
  C: "Creta / Verna",

  // D-Series: Premium Sedans (Elantra)
  D: "Elantra",

  // Q-Series: Compact SUVs
  Q: "Venue",

  // J-Series: Premium SUVs
  J: "Tucson",

  // K-Series: EVs
  K: "Kona EV / Ioniq 5",

  // R-Series
  R: "Venue / Palisade",
};

// 2. Year Codes (10th Character of VIN) - 100% Standard
const yearCodes = {
  A: 2010,
  B: 2011,
  C: 2012,
  D: 2013,
  E: 2014,
  F: 2015,
  G: 2016,
  H: 2017,
  J: 2018, // Note: "I" is skipped
  K: 2019,
  L: 2020,
  M: 2021,
  N: 2022,
  P: 2023, // Note: "O" is skipped
  R: 2024, // Note: "Q" is skipped
  S: 2025,
  T: 2026, // Future Proofing
};

module.exports = { hyundaiModelMap, yearCodes };
