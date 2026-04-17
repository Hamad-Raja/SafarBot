
import Fuse from "fuse.js";
import PAK_CITIES  from "../data/pakistanCities";

const ALIASES = {
  isb: "Islamabad",
  rwp: "Rawalpindi",
  lhr: "Lahore",
  khi: "Karachi",
  pesh: "Peshawar",
  fsd: "Faisalabad",
  guj: "Gujranwala",
  qta: "Quetta",
  skt: "Sialkot",
  hyd: "Hyderabad",
};


const fuse = new Fuse(PAK_CITIES, {
  includeScore: true,
  threshold: 0.35, 
});

export function normalizeCity(input) {
  if (!input) return "";

  const cleaned = input.trim().toLowerCase();

 
  if (ALIASES[cleaned]) return ALIASES[cleaned];


  const exact = PAK_CITIES.find((c) => c.toLowerCase() === cleaned);
  if (exact) return exact;

 
  const result = fuse.search(input);
  if (result.length && result[0].score <= 0.35) {
    return result[0].item;
  }

  
  return input.trim();
}
