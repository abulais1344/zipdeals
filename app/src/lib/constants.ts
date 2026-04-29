export const CATEGORIES = [
  "Electronics & Gadgets",
  "Clothing & Apparel",
  "Footwear",
  "Home & Furniture",
  "Kitchen & Appliances",
  "Food & FMCG",
  "Books & Stationery",
  "Sports & Fitness",
  "Toys & Kids",
  "Other",
] as const;

export const CITIES = [
  "Mumbai",
  "Delhi",
  "Bengaluru",
  "Hyderabad",
  "Chennai",
  "Pune",
  "Ahmedabad",
  "Kolkata",
  "Jaipur",
  "Surat",
  "Nanded",
  "Aurangabad",
  "Parbhani",
  "Hingoli",
  "Yavatmal",
  "Amravati",
] as const;

// Talukas (subdivisions) for specific cities
export const TALUKAS: Record<string, string[]> = {
  Nanded: [
    "Ardhapur",
    "Bhokar",
    "Himayatnagar",
    "Nanded",
    "Parli Vaijnath",
    "Biloli",
    "Hadgaon",
    "Kandhar",
    "Mudkhed",
    "Naigaon",
  ],
  Aurangabad: [
    "Aurangabad",
    "Paithan",
    "Sillod",
    "Vaijapur",
    "Pattan",
    "Jafrabad",
  ],
  Parbhani: [
    "Parbhani",
    "Parli Vaijnath",
    "Manwath",
    "Jintur",
    "Ashti",
    "Gangakhed",
  ],
  Hingoli: [
    "Hingoli",
    "Basmat",
    "Salegaon",
  ],
  Yavatmal: [
    "Yavatmal",
    "Umarkhed",
    "Pandharkawada",
    "Mangrulgurad",
    "Darwha",
    "Pusad",
    "Ner",
  ],
  Amravati: [
    "Amravati",
    "Achalpur",
    "Morshi",
    "Dhamangaon",
    "Anjangaon",
    "Warud",
    "Teosa",
  ],
};

export type Category = (typeof CATEGORIES)[number];
export type City = (typeof CITIES)[number];
export type Taluka = string;

export const LISTING_EXPIRY_DAYS = 30;
export const MAX_IMAGES = 5;
export const MAX_IMAGE_SIZE_MB = 5;
