import React, { useEffect, useMemo, useRef, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { ComposableMap, Geographies, Geography, ZoomableGroup } from "react-simple-maps";
import { geoCentroid } from "d3-geo";
import { motion } from "framer-motion";
import {
  BarChart3,
  BookOpen,
  CheckCircle2,
  ChefHat,
  ChevronRight,
  Globe2,
  MapPin,
  Plus,
  Search,
  Star,
  Trash2,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";


const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = SUPABASE_URL && SUPABASE_ANON_KEY ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY) : null;
const APP_STATE_ID = "weltkochen-global-state";
const ONLINE_STORAGE_ENABLED = Boolean(supabase);

const geoUrl = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";
const DEFAULT_REQUIRED_RECIPES_PER_COUNTRY = 2;
const DEFAULT_MIN_AVERAGE_RATING_FOR_COMPLETION = 4;
const COLOR_SELECTED = "#1e3a8a";
const COLOR_HOVER = "#8b5e3c";
const COLOR_SUGGESTION = "#fde047";
const COLOR_COMPLETED = "#86cc8a";
const COLOR_DEFAULT = "#e8c9a1";
const recipeCategories = ["Vorspeise", "Hauptgericht", "Dessert", "Beilage", "Snack", "Getränk", "Suppe", "Salat", "Gebäck", "Sonstiges"];

const countries = [
  "Afghanistan", "Albanien", "Algerien", "Andorra", "Angola", "Antigua und Barbuda", "Argentinien", "Armenien", "Australien", "Aserbaidschan",
  "Bahamas", "Bahrain", "Bangladesch", "Barbados", "Belarus", "Belgien", "Belize", "Benin", "Bhutan", "Bolivien", "Bosnien und Herzegowina", "Botswana", "Brasilien", "Brunei", "Bulgarien", "Burkina Faso", "Burundi",
  "Cabo Verde", "Chile", "China", "Costa Rica", "Côte d’Ivoire", "Dänemark", "Deutschland", "Dominica", "Dominikanische Republik", "Dschibuti",
  "Ecuador", "El Salvador", "Eritrea", "Estland", "Eswatini", "Fidschi", "Finnland", "Frankreich", "Gabun", "Gambia", "Georgien", "Ghana", "Grenada", "Griechenland", "Guatemala", "Guinea", "Guinea-Bissau", "Guyana",
  "Haiti", "Honduras", "Indien", "Indonesien", "Irak", "Iran", "Irland", "Island", "Israel", "Italien", "Jamaika", "Japan", "Jemen", "Jordanien", "Kambodscha", "Kamerun", "Kanada", "Kasachstan", "Katar", "Kenia", "Kirgisistan", "Kiribati", "Kolumbien", "Komoren", "Kongo", "Kroatien", "Kuba", "Kuwait",
  "Laos", "Lesotho", "Lettland", "Libanon", "Liberia", "Libyen", "Liechtenstein", "Litauen", "Luxemburg", "Madagaskar", "Malawi", "Malaysia", "Malediven", "Mali", "Malta", "Marokko", "Marshallinseln", "Mauretanien", "Mauritius", "Mexiko", "Mikronesien", "Moldau", "Monaco", "Mongolei", "Montenegro", "Mosambik", "Myanmar",
  "Namibia", "Nauru", "Nepal", "Neuseeland", "Nicaragua", "Niederlande", "Niger", "Nigeria", "Nordkorea", "Nordmazedonien", "Norwegen", "Oman", "Österreich", "Pakistan", "Palau", "Panama", "Papua-Neuguinea", "Paraguay", "Peru", "Philippinen", "Polen", "Portugal", "Ruanda", "Rumänien", "Russland",
  "Salomonen", "Sambia", "Samoa", "San Marino", "São Tomé und Príncipe", "Saudi-Arabien", "Schweden", "Schweiz", "Senegal", "Serbien", "Seychellen", "Sierra Leone", "Simbabwe", "Singapur", "Slowakei", "Slowenien", "Somalia", "Spanien", "Sri Lanka", "St. Kitts und Nevis", "St. Lucia", "St. Vincent und die Grenadinen", "Südafrika", "Sudan", "Südkorea", "Südsudan", "Suriname", "Syrien",
  "Tadschikistan", "Tansania", "Thailand", "Timor-Leste", "Togo", "Tonga", "Trinidad und Tobago", "Tschad", "Tschechien", "Tunesien", "Türkei", "Turkmenistan", "Tuvalu", "Uganda", "Ukraine", "Ungarn", "Uruguay", "Usbekistan", "Vanuatu", "Vatikanstadt", "Venezuela", "Vereinigte Arabische Emirate", "Vereinigtes Königreich", "Vereinigte Staaten", "Vietnam", "Zentralafrikanische Republik", "Zypern",
];

const regionRows = [
  { name: "Nordamerika", countries: ["Kanada", "Vereinigte Staaten", "Mexiko"] },
  { name: "Karibik & Mittelamerika", countries: ["Bahamas", "Kuba", "Jamaika", "Haiti", "Dominikanische Republik", "Costa Rica", "Panama", "Guatemala", "Honduras", "Belize", "El Salvador", "Nicaragua", "Antigua und Barbuda", "Barbados", "Dominica", "Grenada", "St. Kitts und Nevis", "St. Lucia", "St. Vincent und die Grenadinen", "Trinidad und Tobago"] },
  { name: "Südamerika", countries: ["Kolumbien", "Venezuela", "Ecuador", "Peru", "Bolivien", "Brasilien", "Paraguay", "Chile", "Argentinien", "Uruguay", "Guyana", "Suriname"] },
  { name: "Europa", countries: ["Island", "Irland", "Vereinigtes Königreich", "Norwegen", "Schweden", "Finnland", "Dänemark", "Niederlande", "Belgien", "Luxemburg", "Frankreich", "Spanien", "Portugal", "Deutschland", "Schweiz", "Österreich", "Liechtenstein", "Italien", "Malta", "San Marino", "Vatikanstadt", "Monaco", "Andorra", "Polen", "Tschechien", "Slowakei", "Ungarn", "Slowenien", "Kroatien", "Bosnien und Herzegowina", "Serbien", "Montenegro", "Albanien", "Nordmazedonien", "Griechenland", "Moldau", "Ukraine", "Belarus", "Litauen", "Lettland", "Estland", "Rumänien", "Bulgarien", "Zypern"] },
  { name: "Afrika", countries: ["Marokko", "Algerien", "Tunesien", "Libyen", "Mauretanien", "Mali", "Niger", "Tschad", "Sudan", "Südsudan", "Senegal", "Gambia", "Guinea", "Guinea-Bissau", "Sierra Leone", "Liberia", "Côte d’Ivoire", "Ghana", "Togo", "Benin", "Burkina Faso", "Nigeria", "Kamerun", "Zentralafrikanische Republik", "Gabun", "Kongo", "Ruanda", "Burundi", "Uganda", "Kenia", "Tansania", "Angola", "Sambia", "Simbabwe", "Botswana", "Namibia", "Südafrika", "Lesotho", "Eswatini", "Mosambik", "Malawi", "Madagaskar", "Komoren", "Mauritius", "Seychellen", "Cabo Verde", "São Tomé und Príncipe", "Eritrea", "Dschibuti", "Somalia"] },
  { name: "Asien", countries: ["Russland", "Türkei", "Georgien", "Armenien", "Aserbaidschan", "Kasachstan", "Usbekistan", "Turkmenistan", "Kirgisistan", "Tadschikistan", "Iran", "Irak", "Syrien", "Libanon", "Israel", "Jordanien", "Saudi-Arabien", "Jemen", "Oman", "Vereinigte Arabische Emirate", "Katar", "Kuwait", "Bahrain", "Afghanistan", "Pakistan", "Indien", "Nepal", "Bhutan", "Bangladesch", "Sri Lanka", "Malediven", "China", "Mongolei", "Nordkorea", "Südkorea", "Japan", "Myanmar", "Thailand", "Laos", "Kambodscha", "Vietnam", "Malaysia", "Singapur", "Indonesien", "Philippinen", "Brunei", "Timor-Leste"] },
  { name: "Ozeanien", countries: ["Australien", "Neuseeland", "Papua-Neuguinea", "Fidschi", "Samoa", "Tonga", "Vanuatu", "Kiribati", "Tuvalu", "Nauru", "Palau", "Marshallinseln", "Mikronesien", "Salomonen"] },
];

const geoNameToGerman = {
  Germany: "Deutschland",
  Austria: "Österreich",
  Switzerland: "Schweiz",
  Italy: "Italien",
  France: "Frankreich",
  Spain: "Spanien",
  Portugal: "Portugal",
  Poland: "Polen",
  Netherlands: "Niederlande",
  Belgium: "Belgien",
  Denmark: "Dänemark",
  Sweden: "Schweden",
  Norway: "Norwegen",
  Finland: "Finnland",
  Ireland: "Irland",
  Iceland: "Island",
  Greece: "Griechenland",
  Turkey: "Türkei",
  Ukraine: "Ukraine",
  Russia: "Russland",
  China: "China",
  Japan: "Japan",
  India: "Indien",
  Thailand: "Thailand",
  Vietnam: "Vietnam",
  Mexico: "Mexiko",
  Canada: "Kanada",
  Brazil: "Brasilien",
  Argentina: "Argentinien",
  Chile: "Chile",
  Colombia: "Kolumbien",
  Peru: "Peru",
  Morocco: "Marokko",
  Algeria: "Algerien",
  Tunisia: "Tunesien",
  Nigeria: "Nigeria",
  Kenya: "Kenia",
  Australia: "Australien",
  "New Zealand": "Neuseeland",
  "United States of America": "Vereinigte Staaten",
  "United Kingdom": "Vereinigtes Königreich",
  "South Africa": "Südafrika",
  "South Korea": "Südkorea",
  "North Korea": "Nordkorea",
  "Saudi Arabia": "Saudi-Arabien",
  "United Arab Emirates": "Vereinigte Arabische Emirate",
};

const countryZooms = {
  Deutschland: { center: [10, 51], zoom: 4.6 },
  Österreich: { center: [14, 47.6], zoom: 5.8 },
  Schweiz: { center: [8.3, 46.8], zoom: 6.2 },
  Italien: { center: [12.5, 42.5], zoom: 4.5 },
  Frankreich: { center: [2, 46], zoom: 4.3 },
  Spanien: { center: [-3.5, 40.3], zoom: 4.3 },
  Portugal: { center: [-8, 39.5], zoom: 4.8 },
  "Vereinigte Staaten": { center: [-98, 39], zoom: 2.5 },
  Kanada: { center: [-106, 57], zoom: 2.4 },
  Mexiko: { center: [-102, 23], zoom: 3.2 },
  Brasilien: { center: [-53, -10], zoom: 2.5 },
  Argentinien: { center: [-64, -35], zoom: 2.8 },
  Russland: { center: [90, 60], zoom: 1.8 },
  China: { center: [104, 35], zoom: 2.8 },
  Japan: { center: [138, 37], zoom: 4.4 },
  Australien: { center: [134, -25], zoom: 2.4 },
  Indien: { center: [78, 22], zoom: 3.2 },
  Türkei: { center: [35, 39], zoom: 4.1 },
  Südafrika: { center: [24, -29], zoom: 3.5 },
};

const countryHints = {
  Deutschland: "Sauerbraten, Käsespätzle oder Königsberger Klopse",
  Italien: "Carbonara, Risotto alla Milanese oder Tiramisu",
  Japan: "Ramen, Okonomiyaki oder Curry Rice",
  Mexiko: "Tacos al pastor, Mole oder Chilaquiles",
  Indien: "Butter Chicken, Dal oder Masala Dosa",
  Frankreich: "Boeuf Bourguignon, Ratatouille oder Crêpes",
  Thailand: "Pad Thai, Tom Kha Gai oder Grünes Curry",
  Brasilien: "Feijoada, Moqueca oder Pão de queijo",
  Türkei: "İmam bayıldı, Lahmacun oder Mantı",
  Marokko: "Tajine, Couscous oder Harira",
  Österreich: "Wiener Schnitzel, Kaiserschmarrn oder Tafelspitz",
  Schweiz: "Rösti, Fondue oder Zürcher Geschnetzeltes",
};

const starterRecipes = {
  Italien: [
    { id: "starter-it", dish: "Spaghetti Carbonara", category: "Hauptgericht", recipe: "Pasta, Guanciale, Ei, Pecorino, Pfeffer", notes: "Klassiker für den Start", image: "", createdBy: "demo", createdByName: "Demo", createdAt: "2026-01-01", ratings: { demo: 5 } },
  ],
  Japan: [
    { id: "starter-jp", dish: "Ramen", category: "Hauptgericht", recipe: "Brühe, Nudeln, Topping nach Wahl", notes: "Perfekt für einen Kochabend", image: "", createdBy: "demo", createdByName: "Demo", createdAt: "2026-01-01", ratings: { demo: 4 } },
  ],
  Mexiko: [
    { id: "starter-mx", dish: "Tacos al Pastor", category: "Hauptgericht", recipe: "Tortillas, mariniertes Fleisch, Ananas, Salsa", notes: "Sehr gesellig", image: "", createdBy: "demo", createdByName: "Demo", createdAt: "2026-01-01", ratings: { demo: 5 } },
  ],
};

const starterSuggestions = {
  Deutschland: ["Käsespätzle", "Sauerbraten"],
  Österreich: ["Kaiserschmarrn"],
  Schweiz: ["Rösti"],
};

const defaultSettings = {
  requiredRecipesPerCountry: DEFAULT_REQUIRED_RECIPES_PER_COUNTRY,
  minAverageRatingForCompletion: DEFAULT_MIN_AVERAGE_RATING_FOR_COMPLETION,
  allowRegistration: true,
  inviteCodes: [],
};

function normalizeCloudState(raw = {}) {
  return {
    settings: { ...defaultSettings, ...(raw.settings || {}) },
    recipes: Object.keys(raw.recipes || {}).length ? migrateRecipes(raw.recipes, "demo", "Demo") : starterRecipes,
    suggestions: Object.keys(raw.suggestions || {}).length ? raw.suggestions : starterSuggestions,
  };
}

async function loadCloudState() {
  if (!ONLINE_STORAGE_ENABLED) return null;
  const { data, error } = await supabase
    .from("weltkochen_state")
    .select("data")
    .eq("id", APP_STATE_ID)
    .maybeSingle();
  if (error) throw error;
  return normalizeCloudState(data?.data || {});
}

async function saveCloudState(state) {
  if (!ONLINE_STORAGE_ENABLED) return;
  const { error } = await supabase
    .from("weltkochen_state")
    .upsert({ id: APP_STATE_ID, data: state, updated_at: new Date().toISOString() });
  if (error) throw error;
}

async function getMyProfile() {
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError) throw userError;
  if (!user) return null;

  let { data, error } = await supabase
    .from("weltkochen_profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  if (error) throw error;

  // Nach der E-Mail-Bestätigung existiert der Auth-Benutzer bereits,
  // das Profil wird aber erst beim ersten erfolgreichen Login angelegt.
  if (!data) {
    const metadata = user.user_metadata || {};
    const username = String(metadata.weltkochen_username || "").trim();
    const displayName = String(metadata.weltkochen_display_name || "").trim();
    const inviteCode = String(metadata.weltkochen_invite_code || "").trim();

    if (username && inviteCode) {
      const { error: claimError } = await supabase.rpc("weltkochen_claim_profile", {
        p_username: username.toLowerCase(),
        p_display_name: displayName || username,
        p_invite_code: inviteCode.toUpperCase(),
      });
      if (claimError) throw claimError;

      const profileResult = await supabase
        .from("weltkochen_profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (profileResult.error) throw profileResult.error;
      data = profileResult.data;
    } else {
      throw new Error("Dein Profil ist noch nicht vollständig eingerichtet. Öffne „Benutzer anlegen“, fülle alle Felder inklusive Einladungscode aus und sende erneut ab.");
    }
  }

  if (data.blocked) {
    await supabase.auth.signOut();
    throw new Error("Dieser Benutzer ist gesperrt.");
  }

  return {
    id: data.id,
    email: data.email,
    username: data.username,
    displayName: data.display_name,
    role: data.role,
  };
}

function toGermanCountryName(name) {
  return geoNameToGerman[name] || name;
}

function loadSettings() {
  try {
    const saved = JSON.parse(localStorage.getItem("weltkochen-settings") || "{}");
    return { ...defaultSettings, ...saved };
  } catch {
    return defaultSettings;
  }
}

function saveSettings(settings) {
  localStorage.setItem("weltkochen-settings", JSON.stringify(settings));
}

function generateInviteCode() {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "KOCH-";
  for (let index = 0; index < 8; index += 1) {
    code += alphabet[Math.floor(Math.random() * alphabet.length)];
    if (index === 3) code += "-";
  }
  return code;
}

function normalizeInviteCode(code) {
  return String(code || "").trim().toUpperCase();
}

function findValidInviteCode(settings, rawCode) {
  const code = normalizeInviteCode(rawCode);
  return (settings.inviteCodes || []).find((item) => item.code === code && !item.usedBy);
}

function getRecipeAverageNumber(recipe) {
  const values = Object.values(recipe?.ratings || {}).map(Number).filter(Boolean);
  return values.length ? values.reduce((a, b) => a + b, 0) / values.length : 0;
}

function getQualifiedRecipesCount(list, minAverageRating = DEFAULT_MIN_AVERAGE_RATING_FOR_COMPLETION) {
  return Array.isArray(list)
    ? list.filter((recipe) => recipe?.dish?.trim() && getRecipeAverageNumber(recipe) > minAverageRating).length
    : 0;
}

function isCountryCompleted(list, requiredRecipes = DEFAULT_REQUIRED_RECIPES_PER_COUNTRY, minAverageRating = DEFAULT_MIN_AVERAGE_RATING_FOR_COMPLETION) {
  return getQualifiedRecipesCount(list, minAverageRating) >= requiredRecipes;
}

function migrateRecipes(rawRecipes, username = "demo", displayName = "Demo") {
  const migrated = {};
  Object.entries(rawRecipes || {}).forEach(([country, value]) => {
    if (Array.isArray(value)) {
      migrated[country] = value.map((recipe) => ({
        id: recipe.id || `${country}-${Date.now()}-${Math.random().toString(16).slice(2)}`,
        dish: recipe.dish || "",
        category: recipe.category || "Hauptgericht",
        servings: Number(recipe.servings) || 4,
        ingredients: Array.isArray(recipe.ingredients) ? recipe.ingredients : [],
        recipe: recipe.recipe || "",
        notes: recipe.notes || "",
        image: recipe.image || "",
        createdBy: recipe.createdBy || username,
        createdByName: recipe.createdByName || displayName,
        createdAt: recipe.createdAt || new Date().toISOString(),
        ratings: recipe.ratings || (recipe.rating ? { [username]: recipe.rating } : {}),
      }));
    } else if (value?.dish) {
      migrated[country] = [
        {
          id: `${country}-${Date.now()}-${Math.random().toString(16).slice(2)}`,
          dish: value.dish,
          category: value.category || "Hauptgericht",
          servings: Number(value.servings) || 4,
          ingredients: Array.isArray(value.ingredients) ? value.ingredients : [],
          recipe: value.recipe || "",
          notes: value.notes || "",
          image: value.image || "",
          createdBy: value.createdBy || username,
          createdByName: value.createdByName || displayName,
          createdAt: value.createdAt || new Date().toISOString(),
          ratings: value.rating ? { [username]: value.rating } : {},
        },
      ];
    }
  });
  return migrated;
}

function loadRecipes(username, displayName) {
  try {
    if (!username) return starterRecipes;
    const saved = JSON.parse(localStorage.getItem(`weltkochen-recipes-${username}`) || "{}");
    return Object.keys(saved).length ? migrateRecipes(saved, username, displayName) : starterRecipes;
  } catch {
    return starterRecipes;
  }
}

function saveRecipes(username, recipes) {
  if (username) localStorage.setItem(`weltkochen-recipes-${username}`, JSON.stringify(recipes));
}

function loadSuggestions(username) {
  try {
    if (!username) return starterSuggestions;
    const saved = JSON.parse(localStorage.getItem(`weltkochen-suggestions-${username}`) || "{}");
    return Object.keys(saved).length ? saved : starterSuggestions;
  } catch {
    return starterSuggestions;
  }
}

function saveSuggestions(username, suggestions) {
  if (username) localStorage.setItem(`weltkochen-suggestions-${username}`, JSON.stringify(suggestions));
}

function hasSuggestions(list) {
  return Array.isArray(list) && list.some((suggestion) => String(suggestion).trim());
}

function readImageFileAsDataUrl(file, maxSize = 900, quality = 0.78) {
  return new Promise((resolve, reject) => {
    if (!file) {
      resolve("");
      return;
    }
    if (!file.type.startsWith("image/")) {
      reject(new Error("Bitte eine Bilddatei auswählen."));
      return;
    }

    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Bild konnte nicht gelesen werden."));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error("Bild konnte nicht verarbeitet werden."));
      img.onload = () => {
        const scale = Math.min(1, maxSize / Math.max(img.width, img.height));
        const width = Math.max(1, Math.round(img.width * scale));
        const height = Math.max(1, Math.round(img.height * scale));
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const context = canvas.getContext("2d");
        if (!context) {
          reject(new Error("Bild konnte nicht vorbereitet werden."));
          return;
        }
        context.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL("image/jpeg", quality));
      };
      img.src = String(reader.result || "");
    };
    reader.readAsDataURL(file);
  });
}

function getRecipeAverage(recipe) {
  const average = getRecipeAverageNumber(recipe);
  return average ? average.toFixed(1) : "–";
}

function getUserRating(recipe, username) {
  return Number((recipe?.ratings || {})[username] || 0);
}

function filterRecipesForTable(recipeEntries, query, activeCountry) {
  if (query.trim()) {
    return recipeEntries.filter(([country, recipe]) =>
      `${country} ${recipe.dish} ${recipe.category || ""} ${recipe.createdByName}`.toLowerCase().includes(query.toLowerCase()),
    );
  }
  return recipeEntries.filter(([country]) => country === activeCountry);
}

function runDeveloperTests() {
  console.assert(countries.includes("Österreich"), "Österreich muss existieren.");
  console.assert(countries.includes("Schweiz"), "Schweiz muss existieren.");
  console.assert(Array.isArray(starterRecipes.Italien), "Rezepte pro Land müssen Arrays sein.");
  console.assert(getRecipeAverage({ ratings: { a: 5, b: 3 } }) === "4.0", "Durchschnittsbewertung muss stimmen.");
  console.assert(getUserRating({ ratings: { jan: 4 } }, "jan") === 4, "Benutzerbewertung muss gefunden werden.");
  const testEntries = [["Italien", { dish: "Pasta", createdByName: "Jan", category: "Hauptgericht" }], ["Japan", { dish: "Ramen", createdByName: "Mia", category: "Suppe" }]];
  console.assert(filterRecipesForTable(testEntries, "", "Japan").length === 1, "Ohne Suche muss nach aktivem Land gefiltert werden.");
  console.assert(filterRecipesForTable(testEntries, "pasta", "Japan").length === 1, "Mit Suche muss nach Suchtext gefiltert werden.");
  console.assert(filterRecipesForTable(testEntries, "suppe", "Japan").length === 1, "Suche muss Kategorien finden.");
  console.assert(countryZooms?.Deutschland?.zoom >= 4, "Deutschland muss einen passenden Zoomwert besitzen.");
  console.assert(countryZooms?.["Vereinigte Staaten"]?.zoom === 2.5, "Vereinigte Staaten muss als gültiger Objekt-Schlüssel definiert sein.");
  console.assert(isCountryCompleted([{ dish: "A", ratings: { a: 5 } }, { dish: "B", ratings: { a: 5 } }], 2, 4) === true, "Ein Land braucht mindestens zwei gut bewertete Rezepte.");
  console.assert(isCountryCompleted([{ dish: "A", ratings: { a: 5 } }], 2, 4) === false, "Ein Land mit einem gut bewerteten Rezept ist nicht abgeschlossen.");
  console.assert(isCountryCompleted([{ dish: "A", ratings: { a: 4 } }, { dish: "B", ratings: { a: 5 } }], 2, 4) === false, "Rezepte mit genau 4 Sternen zählen bei über 4 nicht.");
  console.assert(hasSuggestions(["Rösti"]) === true, "Ein Vorschlag muss erkannt werden.");
  console.assert(hasSuggestions([]) === false, "Leere Vorschlagsliste darf nicht als Vorschlag zählen.");
  console.assert(recipeCategories.includes("Dessert"), "Dessert muss als Kategorie auswählbar sein.");
}

if (typeof window !== "undefined") runDeveloperTests();

function RatingStars({ value = 0, onChange, small = false }) {
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onChange?.(star)}
          className={`${onChange ? "cursor-pointer hover:scale-125" : "cursor-default"} transition`}
          aria-label={`${star} Sterne`}
        >
          <Star className={`${small ? "h-4 w-4" : "h-6 w-6"} ${star <= value ? "fill-amber-400 text-amber-500" : "text-stone-300"}`} />
        </button>
      ))}
    </div>
  );
}

function AuthScreen({ onLogin, storageError }) {
  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [busy, setBusy] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setSuccess("");
    setBusy(true);

    try {
      if (!supabase) throw new Error("Supabase ist nicht verbunden.");

      const cleanEmail = email.trim();
      const cleanUsername = username.trim().toLowerCase();
      const cleanDisplayName = displayName.trim();
      const cleanInviteCode = inviteCode.trim().toUpperCase();

      if (mode === "register") {
        if (!cleanDisplayName || !cleanUsername || !cleanInviteCode || !cleanEmail || !password) {
          throw new Error("Bitte fülle alle Felder aus.");
        }
        if (password.length < 8) {
          throw new Error("Das Passwort muss mindestens 8 Zeichen lang sein.");
        }

        // Wichtig: Erst Einladungscode prüfen, dann überhaupt eine Auth-E-Mail erzeugen.
        const { data: inviteValid, error: inviteError } = await supabase.rpc(
          "weltkochen_validate_invite_code",
          { p_code: cleanInviteCode },
        );
        if (inviteError) throw inviteError;
        if (!inviteValid) {
          throw new Error("Der Einladungscode ist ungültig oder wurde bereits verwendet.");
        }

        const { data, error: signUpError } = await supabase.auth.signUp({
          email: cleanEmail,
          password,
          options: {
            data: {
              weltkochen_username: cleanUsername,
              weltkochen_display_name: cleanDisplayName,
              weltkochen_invite_code: cleanInviteCode,
            },
          },
        });

        if (signUpError) {
          // Reparatur für Konten, die vorher schon ohne Einladungscode
          // angelegt und per E-Mail bestätigt wurden.
          const message = String(signUpError.message || "").toLowerCase();
          if (message.includes("already") || message.includes("registered") || message.includes("exists")) {
            const { error: loginExistingError } = await supabase.auth.signInWithPassword({
              email: cleanEmail,
              password,
            });
            if (loginExistingError) {
              throw new Error("Für diese E-Mail existiert bereits ein Konto. Verwende das zugehörige Passwort oder „Passwort vergessen?“.");
            }

            const { error: claimExistingError } = await supabase.rpc("weltkochen_claim_profile", {
              p_username: cleanUsername,
              p_display_name: cleanDisplayName,
              p_invite_code: cleanInviteCode,
            });
            if (claimExistingError) throw claimExistingError;

            onLogin(await getMyProfile());
            return;
          }
          throw signUpError;
        }

        if (data.session) {
          const { error: claimError } = await supabase.rpc("weltkochen_claim_profile", {
            p_username: cleanUsername,
            p_display_name: cleanDisplayName,
            p_invite_code: cleanInviteCode,
          });
          if (claimError) throw claimError;
          onLogin(await getMyProfile());
          return;
        }

        setSuccess("Fast fertig: Bitte bestätige jetzt die E-Mail. Danach kannst du dich mit E-Mail und Passwort anmelden.");
        setMode("login");
        setPassword("");
        return;
      }

      if (!cleanEmail || !password) {
        throw new Error("Bitte E-Mail und Passwort eingeben.");
      }

      const { error: loginError } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password,
      });
      if (loginError) throw loginError;

      onLogin(await getMyProfile());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Anmeldung fehlgeschlagen.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#f7edda] px-5 py-10 text-stone-900">
      <div className="mx-auto grid max-w-5xl gap-8 md:grid-cols-[1fr_.9fr] md:items-center">
        <section className="rounded-[2rem] border-2 border-stone-300 bg-[#fff8e9] p-8 shadow-sm">
          <div className="mb-6 inline-flex h-16 w-16 items-center justify-center rounded-full border-2 border-stone-900 bg-white"><ChefHat className="h-8 w-8" /></div>
          <h1 className="text-4xl font-black uppercase tracking-wide md:text-6xl">Koch dich um die Welt</h1>
          <p className="mt-4 text-lg text-stone-600">Sicherer Login über Supabase Auth.</p>
          {storageError && <p className="mt-4 rounded-2xl border border-red-200 bg-red-50 p-3 text-sm font-semibold text-red-700">{storageError}</p>}
        </section>
        <form onSubmit={handleSubmit} className="rounded-[2rem] border-2 border-stone-300 bg-[#fff8e9] p-6 shadow-sm">
          <div className="mb-5 flex rounded-2xl bg-stone-100 p-1">
            <button type="button" onClick={() => setMode("login")} className={`flex-1 rounded-xl px-4 py-3 font-bold ${mode === "login" ? "bg-white shadow-sm" : "text-stone-500"}`}>Anmelden</button>
            <button type="button" onClick={() => setMode("register")} className={`flex-1 rounded-xl px-4 py-3 font-bold ${mode === "register" ? "bg-white shadow-sm" : "text-stone-500"}`}>Benutzer anlegen</button>
          </div>
          <h2 className="text-2xl font-black">{mode === "login" ? "Einloggen" : "Neues Profil"}</h2>
          <div className="mt-5 space-y-4">
            {mode === "register" && <>
              <label className="block"><span className="mb-1 block text-sm font-semibold">Anzeigename</span><input required value={displayName} onChange={e=>setDisplayName(e.target.value)} autoComplete="name" className="w-full rounded-2xl border-2 border-stone-300 bg-white p-3" /></label>
              <label className="block"><span className="mb-1 block text-sm font-semibold">Benutzername</span><input required value={username} onChange={e=>setUsername(e.target.value)} autoComplete="username" className="w-full rounded-2xl border-2 border-stone-300 bg-white p-3" /></label>
              <label className="block"><span className="mb-1 block text-sm font-semibold">Einladungscode</span><input required value={inviteCode} onChange={e=>setInviteCode(e.target.value.toUpperCase())} autoComplete="off" className="w-full rounded-2xl border-2 border-stone-300 bg-white p-3 uppercase" /></label>
            </>}
            <label className="block"><span className="mb-1 block text-sm font-semibold">E-Mail</span><input required type="email" value={email} onChange={e=>setEmail(e.target.value)} autoComplete="email" className="w-full rounded-2xl border-2 border-stone-300 bg-white p-3" /></label>
            <label className="block"><span className="mb-1 block text-sm font-semibold">Passwort</span><input required type="password" minLength={8} value={password} onChange={e=>setPassword(e.target.value)} autoComplete={mode === "register" ? "new-password" : "current-password"} className="w-full rounded-2xl border-2 border-stone-300 bg-white p-3" /></label>
            {success && <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-3 text-sm font-semibold text-emerald-800">{success}</div>}
            {error && <div className="rounded-2xl border border-red-200 bg-red-50 p-3 text-sm font-semibold text-red-700">{error}</div>}
            <Button
              type="submit"
              disabled={
                busy ||
                (mode === "register" &&
                  (!displayName.trim() ||
                    !username.trim() ||
                    !inviteCode.trim() ||
                    !email.trim() ||
                    password.length < 8))
              }
              className="w-full rounded-2xl bg-stone-900 py-6 text-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              {busy ? "Bitte warten..." : mode === "login" ? "Anmelden" : "Benutzer erstellen"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

function WorldMap({ selected, hovered, setSelected, setHovered, recipes, suggestions, selectedRegion, requiredRecipes, minAverageRating }) {
  const [position, setPosition] = useState({ coordinates: [10, 20], zoom: 1 });

  const regionZooms = {
    "Alle Kontinente": { center: [10, 20], zoom: 0.9 },
    Nordamerika: { center: [-105, 45], zoom: 1.9 },
    "Karibik & Mittelamerika": { center: [-75, 18], zoom: 3.2 },
    Südamerika: { center: [-60, -18], zoom: 2.1 },
    Europa: { center: [15, 52], zoom: 3.2 },
    Afrika: { center: [18, 4], zoom: 2.2 },
    Asien: { center: [90, 34], zoom: 1.8 },
    Ozeanien: { center: [135, -25], zoom: 2.1 },
  };

  useEffect(() => {
    const config = regionZooms[selectedRegion] || regionZooms["Alle Kontinente"];
    setPosition({ coordinates: config.center, zoom: config.zoom });
  }, [selectedRegion]);

  function changeZoom(delta) {
    setPosition((pos) => ({ ...pos, zoom: Math.min(8, Math.max(0.9, pos.zoom + delta)) }));
  }

  function resetZoom() {
    setPosition({ coordinates: regionZooms["Alle Kontinente"].center, zoom: regionZooms["Alle Kontinente"].zoom });
  }

  function handleMouseDown(event) {
    if (event.button === 1) {
      event.preventDefault();
      resetZoom();
    }
  }

  function handleCountryClick(countryName, geo) {
    setSelected(countryName);
    const countryConfig = countryZooms[countryName];
    if (countryConfig) {
      setPosition({ coordinates: countryConfig.center, zoom: countryConfig.zoom });
      return;
    }
    setPosition((current) => ({ ...current, coordinates: geoCentroid(geo), zoom: Math.max(current.zoom, 3.2) }));
  }

  const recipeCountForHover = Array.isArray(recipes[hovered]) ? recipes[hovered].filter((recipe) => recipe?.dish?.trim()).length : 0;

  return (
    <div onMouseDown={handleMouseDown} onAuxClick={(event) => event.preventDefault()} className="relative overflow-hidden rounded-[2rem] border-2 border-stone-300 bg-[#f8efd9] shadow-inner">
      <div className="absolute left-8 top-8 z-10 rounded-2xl border-2 border-stone-300 bg-[#fff8e9]/90 p-5 text-center font-semibold text-stone-800 shadow-sm backdrop-blur">
        <h2 className="text-3xl font-black tracking-tight">{hovered || selected}</h2>
        <p className="mt-3 max-w-xs text-sm leading-relaxed">
          {hovered ? `${recipeCountForHover} Rezept${recipeCountForHover === 1 ? "" : "e"} eingetragen` : "Klicke ein Land an, um rechts die Rezepte anzuzeigen."}
        </p>
      </div>

      <ComposableMap projection="geoMercator" projectionConfig={{ scale: 190 }} className="h-[760px] w-full bg-[#dbeef2]">
        <ZoomableGroup zoom={position.zoom} center={position.coordinates} onMoveEnd={(pos) => setPosition(pos)}>
          <Geographies geography={geoUrl}>
            {({ geographies }) => geographies.map((geo) => {
              const countryName = toGermanCountryName(geo.properties.name);
              const isHovered = hovered === countryName;
              const isSelected = selected === countryName;
              const completed = isCountryCompleted(recipes[countryName], requiredRecipes, minAverageRating);
              const suggested = hasSuggestions(suggestions[countryName]);
              const fill = isHovered ? COLOR_HOVER : isSelected ? COLOR_SELECTED : completed ? COLOR_COMPLETED : suggested ? COLOR_SUGGESTION : COLOR_DEFAULT;
              return (
                <Geography
                  key={geo.rsmKey}
                  geography={geo}
                  onMouseEnter={() => setHovered(countryName)}
                  onMouseLeave={() => setHovered("")}
                  onClick={() => handleCountryClick(countryName, geo)}
                  style={{
                    default: { fill, stroke: "#2f2a23", strokeWidth: isSelected || isHovered ? 1.8 : 0.8, outline: "none" },
                    hover: { fill: COLOR_HOVER, stroke: "#1f1a14", strokeWidth: 1.8, outline: "none", cursor: "pointer" },
                    pressed: { fill: "#d97706", outline: "none" },
                  }}
                />
              );
            })}
          </Geographies>
        </ZoomableGroup>
      </ComposableMap>

      <div className="absolute bottom-6 left-6 flex flex-col gap-2 rounded-2xl border border-stone-300 bg-[#fff8e9]/95 p-3 shadow-lg">
        <button onClick={() => changeZoom(0.4)} className="rounded-xl border border-stone-300 bg-white px-4 py-2 text-2xl font-black hover:bg-stone-100">+</button>
        <button onClick={() => changeZoom(-0.4)} className="rounded-xl border border-stone-300 bg-white px-4 py-2 text-2xl font-black hover:bg-stone-100">−</button>
        <button onClick={resetZoom} className="rounded-xl border border-stone-300 bg-white px-3 py-2 text-xs font-bold hover:bg-stone-100">Reset</button>
      </div>
    </div>
  );
}

function RecipeModal({ openedRecipe, currentUser, setRating, onClose }) {
  if (!openedRecipe) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="max-h-[90vh] w-full max-w-3xl overflow-auto rounded-[2rem] border-2 border-stone-300 bg-[#fff8e9] p-6 shadow-2xl">
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <p className="text-sm uppercase tracking-wide text-amber-700">{openedRecipe.country}</p>
            <h2 className="text-4xl font-black">{openedRecipe.dish}</h2>
            {openedRecipe.image && <img src={openedRecipe.image} alt={openedRecipe.dish} className="mt-4 max-h-72 w-full rounded-2xl object-cover" />}
            <p className="mt-1 text-stone-500">{openedRecipe.category || "Hauptgericht"} · erstellt von {openedRecipe.createdByName || openedRecipe.createdBy}</p>
          </div>
          <Button onClick={onClose} variant="outline" className="rounded-2xl border-stone-300 bg-white hover:bg-stone-100">Schließen</Button>
        </div>

        <div className="grid gap-6 md:grid-cols-[1fr_.7fr]">
          <div className="space-y-5">
            <div className="rounded-2xl border border-stone-200 bg-white p-5">
              <h3 className="mb-3 text-xl font-black">Rezept</h3>
              <div className="whitespace-pre-wrap leading-relaxed text-stone-700">{openedRecipe.recipe || "Kein Rezept eingetragen."}</div>
            </div>
            <div className="rounded-2xl border border-stone-200 bg-white p-5">
              <h3 className="mb-3 text-xl font-black">Notizen</h3>
              <div className="whitespace-pre-wrap leading-relaxed text-stone-700">{openedRecipe.notes || "Keine Notizen vorhanden."}</div>
            </div>
          </div>

          <div className="space-y-5">
            <div className="rounded-2xl border border-stone-200 bg-white p-5">
              <h3 className="mb-3 text-xl font-black">Bewertungen</h3>
              <RatingStars value={getUserRating(openedRecipe, currentUser.username)} onChange={(rating) => setRating(openedRecipe.country, openedRecipe.id, rating)} />
              <p className="mt-3 text-sm text-stone-500">Deine Bewertung</p>
              <div className="mt-4 rounded-2xl bg-stone-100 p-4 text-sm">
                <p><b>Durchschnitt:</b> {getRecipeAverage(openedRecipe)} / 5</p>
                <p className="mt-2"><b>Anzahl Bewertungen:</b> {Object.keys(openedRecipe.ratings || {}).length}</p>
              </div>
            </div>

            <div className="rounded-2xl border border-stone-200 bg-white p-5">
              <h3 className="mb-3 text-xl font-black">Rezeptinformationen</h3>
              <div className="space-y-2 text-sm text-stone-700">
                <p><b>Land:</b> {openedRecipe.country}</p>
                <p><b>Kategorie:</b> {openedRecipe.category || "Hauptgericht"}</p>
                <p><b>Ersteller:</b> {openedRecipe.createdByName || openedRecipe.createdBy}</p>
                <p><b>Erstellt:</b> {new Date(openedRecipe.createdAt).toLocaleDateString()}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function RegionCountryPicker({ regionRows, collapsedRegions, toggleRegion, recipes, selected, setSelected, query, requiredRecipes, minAverageRating }) {
  return (
    <div className="rounded-[2rem] border-2 border-stone-200 bg-[#fffaf0] p-4">
      <div className="grid gap-3">
        {regionRows.map((region) => {
          const isCollapsed = collapsedRegions[region.name];
          const matchingCountries = region.countries.filter((country) => country.toLowerCase().includes(query.toLowerCase()));
          return (
            <div key={region.name} className="rounded-2xl border border-stone-200 bg-white/70 p-3">
              <button
                type="button"
                onClick={() => toggleRegion(region.name)}
                className="flex w-full items-center justify-between text-left text-sm font-black uppercase tracking-wide text-amber-700"
              >
                <span>{region.name}</span>
                <span className="rounded-full bg-stone-100 px-2 py-1 text-xs text-stone-600">{isCollapsed ? "öffnen" : "schließen"}</span>
              </button>
              {!isCollapsed && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {matchingCountries.map((country) => {
                    const completed = isCountryCompleted(recipes[country], requiredRecipes, minAverageRating);
                    const active = selected === country;
                    return (
                      <button
                        key={country}
                        onClick={() => setSelected(country)}
                        className={`rounded-full px-3 py-1.5 text-sm font-semibold transition hover:scale-105 ${active ? "bg-amber-400 text-stone-950" : completed ? "bg-emerald-300 text-stone-950" : "bg-stone-200 text-stone-800 hover:bg-stone-300"}`}
                      >
                        {completed && <CheckCircle2 className="mr-1 inline h-3.5 w-3.5" />}
                        {country}
                      </button>
                    );
                  })}
                  {!matchingCountries.length && <p className="text-sm text-stone-500">Keine Treffer in diesem Kontinent.</p>}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function AdminPanel({ settings, onUpdateSettings }) {
  const [requiredRecipes, setRequiredRecipes] = useState(String(settings.requiredRecipesPerCountry));
  const [minAverageRating, setMinAverageRating] = useState(String(settings.minAverageRatingForCompletion));
  const [inviteCodes, setInviteCodes] = useState([]);
  const [inviteLoading, setInviteLoading] = useState(true);
  const [inviteBusy, setInviteBusy] = useState(false);
  const [inviteMessage, setInviteMessage] = useState("");
  const [inviteError, setInviteError] = useState("");
  const [adminUsers, setAdminUsers] = useState([]);
  const [usersLoading, setUsersLoading] = useState(true);
  const [userActionId, setUserActionId] = useState("");
  const [userMessage, setUserMessage] = useState("");
  const [userError, setUserError] = useState("");
  const [myUserId, setMyUserId] = useState("");

  useEffect(() => {
    loadInviteCodes();
    loadAdminUsers();
  }, []);

  async function loadInviteCodes() {
    if (!supabase) return;
    setInviteLoading(true);
    setInviteError("");

    const { data, error } = await supabase
      .from("weltkochen_invite_codes")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      setInviteError(error.message);
      setInviteCodes([]);
    } else {
      setInviteCodes(data || []);
    }

    setInviteLoading(false);
  }

  async function loadAdminUsers() {
    if (!supabase) return;
    setUsersLoading(true);
    setUserError("");

    const { data: { user } } = await supabase.auth.getUser();
    setMyUserId(user?.id || "");

    const { data, error } = await supabase
      .from("weltkochen_profiles")
      .select("id,email,username,display_name,role,blocked,created_at")
      .order("created_at", { ascending: true });

    if (error) {
      setUserError(error.message);
      setAdminUsers([]);
    } else {
      setAdminUsers(data || []);
    }

    setUsersLoading(false);
  }

  async function setUserBlocked(userId, blocked) {
    if (!supabase || userActionId) return;

    setUserActionId(userId);
    setUserMessage("");
    setUserError("");

    const { error } = await supabase.rpc("weltkochen_set_user_blocked", {
      p_user_id: userId,
      p_blocked: blocked,
    });

    if (error) {
      setUserError(error.message);
    } else {
      setUserMessage(blocked ? "Benutzer wurde gesperrt." : "Benutzer wurde entsperrt.");
      await loadAdminUsers();
    }

    setUserActionId("");
  }

  async function createInviteCode() {
    if (!supabase || inviteBusy) return;

    setInviteBusy(true);
    setInviteMessage("");
    setInviteError("");

    const { data, error } = await supabase.rpc("weltkochen_create_invite_code");

    if (error) {
      setInviteError(error.message);
    } else {
      setInviteMessage(`Neuer Einladungscode: ${data}`);
      await loadInviteCodes();
    }

    setInviteBusy(false);
  }

  async function copyInviteCode(code) {
    try {
      await navigator.clipboard.writeText(code);
      setInviteMessage(`${code} wurde kopiert.`);
      setInviteError("");
    } catch {
      setInviteError("Der Code konnte nicht automatisch kopiert werden.");
    }
  }

  function saveRules() {
    onUpdateSettings({
      ...settings,
      requiredRecipesPerCountry: Math.max(1, Number(requiredRecipes) || 2),
      minAverageRatingForCompletion: Math.max(0, Math.min(5, Number(minAverageRating) || 4)),
    });
  }

  return (
    <main className="mx-auto max-w-4xl px-5 py-8">
      <div className="space-y-6">
        <Card className="border-2 border-stone-300 bg-[#fff8e9]">
          <CardContent className="p-6">
            <h2 className="text-4xl font-black">Admin-Bereich</h2>
            <p className="mt-2 text-stone-600">
              Benutzer und Passwörter werden sicher über Supabase Auth verwaltet.
            </p>

            <label className="mt-6 block">
              <span className="text-sm font-semibold">Benötigte Rezepte pro Land</span>
              <input
                type="number"
                min="1"
                value={requiredRecipes}
                onChange={(e) => setRequiredRecipes(e.target.value)}
                className="mt-1 w-full rounded-2xl border-2 border-stone-300 bg-white p-3"
              />
            </label>

            <label className="mt-4 block">
              <span className="text-sm font-semibold">Mindestbewertung</span>
              <input
                type="number"
                min="0"
                max="5"
                step=".1"
                value={minAverageRating}
                onChange={(e) => setMinAverageRating(e.target.value)}
                className="mt-1 w-full rounded-2xl border-2 border-stone-300 bg-white p-3"
              />
            </label>

            <Button
              onClick={saveRules}
              className="mt-5 rounded-2xl bg-amber-400 px-5 py-5 text-stone-950"
            >
              Speichern
            </Button>
          </CardContent>
        </Card>

        <Card className="border-2 border-stone-300 bg-[#fff8e9]">
          <CardContent className="p-6">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h3 className="text-2xl font-black">Benutzerverwaltung</h3>
                <p className="mt-1 text-sm text-stone-600">
                  Benutzer sperren oder wieder freigeben.
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                onClick={loadAdminUsers}
                disabled={usersLoading}
                className="rounded-xl border-stone-300 bg-white"
              >
                Aktualisieren
              </Button>
            </div>

            {userMessage && (
              <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-3 text-sm font-semibold text-emerald-800">
                {userMessage}
              </div>
            )}

            {userError && (
              <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 p-3 text-sm font-semibold text-red-700">
                {userError}
              </div>
            )}

            <div className="mt-5 overflow-hidden rounded-2xl border border-stone-200 bg-white">
              {usersLoading ? (
                <p className="p-4 text-stone-500">Benutzer werden geladen...</p>
              ) : adminUsers.length ? (
                <div className="divide-y divide-stone-200">
                  {adminUsers.map((user) => {
                    const isMe = user.id === myUserId;
                    const isBlocked = Boolean(user.blocked);
                    return (
                      <div key={user.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-black">{user.display_name || user.username || "Benutzer"}</span>
                            <span className={`rounded-full px-2 py-1 text-xs font-bold ${
                              isBlocked
                                ? "bg-red-100 text-red-700"
                                : "bg-emerald-100 text-emerald-700"
                            }`}>
                              {isBlocked ? "Gesperrt" : "Aktiv"}
                            </span>
                            {user.role === "admin" && (
                              <span className="rounded-full bg-amber-100 px-2 py-1 text-xs font-bold text-amber-800">
                                Admin
                              </span>
                            )}
                            {isMe && (
                              <span className="rounded-full bg-stone-100 px-2 py-1 text-xs font-bold text-stone-600">
                                Du
                              </span>
                            )}
                          </div>
                          <div className="mt-1 break-all text-sm text-stone-500">
                            @{user.username || "—"} · {user.email || "Keine E-Mail"}
                          </div>
                        </div>

                        <Button
                          type="button"
                          variant={isBlocked ? "outline" : "destructive"}
                          disabled={isMe || userActionId === user.id}
                          onClick={() => setUserBlocked(user.id, !isBlocked)}
                          className={`rounded-xl ${
                            isBlocked
                              ? "border-emerald-300 bg-emerald-50 text-emerald-800 hover:bg-emerald-100"
                              : ""
                          }`}
                        >
                          {userActionId === user.id
                            ? "Bitte warten..."
                            : isMe
                              ? "Eigenes Konto"
                              : isBlocked
                                ? "Entsperren"
                                : "Sperren"}
                        </Button>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="p-4 text-stone-500">Keine Benutzer gefunden.</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="border-2 border-stone-300 bg-[#fff8e9]">
          <CardContent className="p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="text-2xl font-black">Einladungscodes</h3>
                <p className="mt-1 text-sm text-stone-600">
                  Neue Benutzer benötigen einen freien Einladungscode.
                </p>
              </div>

              <Button
                onClick={createInviteCode}
                disabled={inviteBusy}
                className="rounded-2xl bg-stone-900 px-5 py-5 text-white"
              >
                <Plus className="mr-2 h-4 w-4" />
                {inviteBusy ? "Erstelle..." : "Einladungscode erstellen"}
              </Button>
            </div>

            {inviteMessage && (
              <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-3 text-sm font-semibold text-emerald-800">
                {inviteMessage}
              </div>
            )}

            {inviteError && (
              <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 p-3 text-sm font-semibold text-red-700">
                {inviteError}
              </div>
            )}

            <div className="mt-5 overflow-hidden rounded-2xl border border-stone-200 bg-white">
              {inviteLoading ? (
                <p className="p-4 text-stone-500">Einladungscodes werden geladen...</p>
              ) : inviteCodes.length ? (
                <div className="divide-y divide-stone-200">
                  {inviteCodes.map((invite) => {
                    const used = Boolean(invite.used_by || invite.used_at);
                    return (
                      <div
                        key={invite.code}
                        className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between"
                      >
                        <div>
                          <div className="font-mono text-lg font-black">{invite.code}</div>
                          <div className="mt-1 text-sm text-stone-500">
                            {used ? "Benutzt" : "Frei"}
                            {invite.created_at
                              ? ` · erstellt ${new Date(invite.created_at).toLocaleDateString("de-DE")}`
                              : ""}
                          </div>
                        </div>

                        {!used && (
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => copyInviteCode(invite.code)}
                            className="rounded-xl border-stone-300 bg-white"
                          >
                            Kopieren
                          </Button>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="p-4 text-stone-500">
                  Noch keine Einladungscodes vorhanden.
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}

export default function WeltkochenApp() {
  const [currentUser, setCurrentUser] = useState(null);
  const [recipes, setRecipes] = useState(() => loadRecipes("global", "Demo"));
  const [settings, setSettings] = useState(loadSettings);
  const [suggestions, setSuggestions] = useState(() => loadSuggestions("global"));
  const [cloudLoaded, setCloudLoaded] = useState(!ONLINE_STORAGE_ENABLED);
  const [storageError, setStorageError] = useState("");
  const saveTimerRef = useRef(null);
  const [selected, setSelected] = useState("Italien");
  const [hovered, setHovered] = useState("");
  const [query, setQuery] = useState("");
  const [form, setForm] = useState({ dish: "", category: "Hauptgericht", recipe: "", notes: "", image: "" });
  const [suggestionText, setSuggestionText] = useState("");
  const [suggestionDialogOpen, setSuggestionDialogOpen] = useState(false);
  const [openedSuggestion, setOpenedSuggestion] = useState(null);
  const [editingRecipeId, setEditingRecipeId] = useState(null);
  const [openedRecipe, setOpenedRecipe] = useState(null);
  const [page, setPage] = useState("karte");
  const [selectedRegion, setSelectedRegion] = useState("Alle Kontinente");
  const [collapsedRegions, setCollapsedRegions] = useState({});
  const [imageError, setImageError] = useState("");

  useEffect(() => {
    let cancelled = false;
    async function boot() {
      try {
        const cloud = await loadCloudState();
        const { data: { session } } = await supabase.auth.getSession();
        if (session && !cancelled) setCurrentUser(await getMyProfile());
        if (!cancelled && cloud) {
          setSettings(cloud.settings);
          setRecipes(cloud.recipes);
          setSuggestions(cloud.suggestions);
        }
      } catch (error) {
        if (!cancelled) setStorageError(error instanceof Error ? error.message : "Online-Speicher konnte nicht geladen werden.");
      } finally {
        if (!cancelled) setCloudLoaded(true);
      }
    }
    boot();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    saveRecipes("global", recipes);
    saveSettings(settings);
    saveSuggestions("global", suggestions);
    if (!cloudLoaded || !ONLINE_STORAGE_ENABLED) return;
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      saveCloudState({ settings, recipes, suggestions }).catch((error) => {
        setStorageError(error instanceof Error ? error.message : "Online-Speichern fehlgeschlagen.");
      });
    }, 500);
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, [settings, recipes, suggestions, cloudLoaded]);

  useEffect(() => {
    setEditingRecipeId(null);
    setForm({ dish: "", category: "Hauptgericht", recipe: "", notes: "", image: "" });
    setImageError("");
  }, [selected]);

  const recipeEntries = useMemo(() => Object.entries(recipes).flatMap(([country, list]) => (
    Array.isArray(list) ? list : []
  ).filter((recipe) => recipe?.dish?.trim()).map((recipe) => [country, recipe])), [recipes]);

  const countriesWithRecipes = useMemo(() => Object.entries(recipes).filter(([, list]) => (
    isCountryCompleted(list, settings.requiredRecipesPerCountry, settings.minAverageRatingForCompletion)
  )), [recipes, settings.requiredRecipesPerCountry, settings.minAverageRatingForCompletion]);

  const doneCount = countriesWithRecipes.length;
  const progress = Math.round((doneCount / countries.length) * 100);
  const averageRating = recipeEntries.length ? (recipeEntries.reduce((sum, [, recipe]) => {
    const average = getRecipeAverage(recipe);
    return sum + (average === "–" ? 0 : Number(average));
  }, 0) / recipeEntries.length).toFixed(1) : "0.0";
  const filteredCountries = useMemo(() => countries.filter((country) => country.toLowerCase().includes(query.toLowerCase())), [query]);
  const activeCountry = selected;
  const activeRecipes = Array.isArray(recipes[activeCountry]) ? recipes[activeCountry] : [];
  const visibleRecipes = useMemo(() => filterRecipesForTable(recipeEntries, query, activeCountry), [recipeEntries, query, activeCountry]);

  if (!cloudLoaded) {
    return <div className="grid min-h-screen place-items-center bg-[#f7edda] p-6 text-center text-stone-800"><div><ChefHat className="mx-auto mb-4 h-12 w-12" /><h1 className="text-3xl font-black">Lade Online-Daten...</h1></div></div>;
  }

  if (!currentUser) return <AuthScreen onLogin={(user) => { setCurrentUser(user); setPage(user?.role === "admin" ? "admin" : "karte"); }} storageError={storageError} />;

  async function logout() {
    await supabase.auth.signOut();
    setCurrentUser(null);
    setPage("karte");
  }

  async function updateSettings(nextSettings) {
    setSettings(nextSettings);
    saveSettings(nextSettings);
    if (ONLINE_STORAGE_ENABLED) await saveCloudState({ settings: nextSettings, recipes, suggestions });
  }

  function openRecipe(recipe, country) {
    setOpenedRecipe({ ...recipe, country });
  }

  function closeRecipe() {
    setOpenedRecipe(null);
  }

  async function handleImageUpload(event) {
    const file = event.target.files?.[0];
    setImageError("");
    try {
      if (!file) return;
      if (!file.type.startsWith("image/")) {
        setImageError("Bitte wähle eine Bilddatei aus.");
        return;
      }
      const image = await readImageFileAsDataUrl(file);
      setForm((current) => ({ ...current, image }));
    } catch (error) {
      setImageError(error instanceof Error ? error.message : "Bild konnte nicht hochgeladen werden.");
    } finally {
      event.target.value = "";
    }
  }

  function removeImage() {
    setForm((current) => ({ ...current, image: "" }));
    setImageError("");
  }

  function saveRecipe() {
    if (!form.dish.trim()) return;
    setRecipes((prev) => {
      const list = Array.isArray(prev[selected]) ? prev[selected] : [];
      if (editingRecipeId) {
        return { ...prev, [selected]: list.map((recipe) => recipe.id === editingRecipeId ? { ...recipe, ...form, image: form.image || "" } : recipe) };
      }
      const newRecipe = {
        id: `${selected}-${Date.now()}-${Math.random().toString(16).slice(2)}`,
        dish: form.dish,
        category: form.category || "Hauptgericht",
        recipe: form.recipe,
        notes: form.notes,
        image: form.image || "",
        createdBy: currentUser.username,
        createdByName: currentUser.displayName,
        createdAt: new Date().toISOString(),
        ratings: {},
      };
      return { ...prev, [selected]: [...list, newRecipe] };
    });
    setForm({ dish: "", category: "Hauptgericht", recipe: "", notes: "", image: "" });
    setImageError("");
    setEditingRecipeId(null);
  }

  function clearRecipe() {
    if (!editingRecipeId) {
      setForm({ dish: "", category: "Hauptgericht", recipe: "", notes: "", image: "" });
      setImageError("");
      return;
    }
    setRecipes((prev) => {
      const nextList = (Array.isArray(prev[selected]) ? prev[selected] : []).filter((recipe) => recipe.id !== editingRecipeId);
      const copy = { ...prev, [selected]: nextList };
      if (!nextList.length) delete copy[selected];
      return copy;
    });
    setForm({ dish: "", category: "Hauptgericht", recipe: "", notes: "", image: "" });
    setImageError("");
    setEditingRecipeId(null);
  }

  function setRating(country, recipeId, rating) {
    setRecipes((prev) => {
      const list = Array.isArray(prev[country]) ? prev[country] : [];
      return {
        ...prev,
        [country]: list.map((recipe) => recipe.id === recipeId ? { ...recipe, ratings: { ...(recipe.ratings || {}), [currentUser.username]: rating } } : recipe),
      };
    });
    setOpenedRecipe((current) => current?.id === recipeId ? { ...current, ratings: { ...(current.ratings || {}), [currentUser.username]: rating } } : current);
  }

  function editRecipe(recipe) {
    setEditingRecipeId(recipe.id);
    setForm({ dish: recipe.dish || "", category: recipe.category || "Hauptgericht", recipe: recipe.recipe || "", notes: recipe.notes || "", image: recipe.image || "" });
    setImageError("");
    setPage("details");
  }

  function addSuggestion() {
    const clean = suggestionText.trim();
    if (!clean) return;
    setSuggestions((prev) => ({
      ...prev,
      [selected]: [...(Array.isArray(prev[selected]) ? prev[selected] : []), clean],
    }));
    setSuggestionText("");
    setSuggestionDialogOpen(false);
  }

  function removeSuggestion(country, indexToRemove) {
    setSuggestions((prev) => {
      const nextList = (Array.isArray(prev[country]) ? prev[country] : []).filter((_, index) => index !== indexToRemove);
      const copy = { ...prev, [country]: nextList };
      if (!nextList.length) delete copy[country];
      return copy;
    });
    setOpenedSuggestion(null);
  }

  function openSuggestion(country, suggestion, index) {
    setOpenedSuggestion({ country, suggestion, index });
  }

  function convertSuggestionToRecipe() {
    if (!openedSuggestion) return;
    setSelected(openedSuggestion.country);
    setForm({ dish: openedSuggestion.suggestion, category: "Hauptgericht", recipe: "", notes: "Aus Rezeptvorschlag übernommen.", image: "" });
    setImageError("");
    setEditingRecipeId(null);
    removeSuggestion(openedSuggestion.country, openedSuggestion.index);
    setPage("details");
  }

  function toggleRegion(regionName) {
    setCollapsedRegions((prev) => ({ ...prev, [regionName]: !prev[regionName] }));
  }

  // MOBILE: Land auswählen und direkt zum Formular springen
  function selectCountryAndJumpToForm(country) {
    setSelected(country);

    if (typeof window !== "undefined" && window.innerWidth < 1024) {
      window.setTimeout(() => {
        document
          .getElementById("recipe-entry-card")
          ?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 120);
    }
  }

  return (
    <div className="min-h-screen bg-[#f7edda] text-stone-900" style={{ fontFamily: "ui-rounded, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>
      <header className="border-b-2 border-stone-300 bg-[#fff8e9]/90 px-5 py-4 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <button onClick={() => setPage("karte")} className="flex items-center gap-4 text-left">
            <div className="grid h-16 w-16 place-items-center rounded-full border-2 border-stone-800 bg-white shadow-sm"><ChefHat className="h-8 w-8" /></div>
            <div>
              <h1 className="text-2xl font-black uppercase tracking-wide md:text-3xl">Koch dich um die Welt</h1>
              <p className="text-stone-600">Mehrere Rezepte pro Land · Bewertungen pro Benutzer</p>
            </div>
          </button>

          <nav className="flex flex-wrap items-center gap-2 md:gap-6">
            <button onClick={() => setPage("karte")} className={`flex items-center gap-2 border-b-2 px-3 py-2 font-semibold ${page === "karte" ? "border-stone-900" : "border-transparent"}`}><Globe2 size={20} /> Weltkarte</button>
            <button onClick={() => setPage("details")} className={`flex items-center gap-2 border-b-2 px-3 py-2 font-semibold ${page === "details" ? "border-stone-900" : "border-transparent"}`}><BookOpen size={20} /> Rezept eintragen</button>
            {currentUser.role === "admin" && <button onClick={() => setPage("admin")} className={`flex items-center gap-2 border-b-2 px-3 py-2 font-semibold ${page === "admin" ? "border-stone-900" : "border-transparent"}`}><BarChart3 size={20} /> Admin</button>}
            <span className="flex items-center gap-2 px-3 py-2 font-semibold text-stone-600"><BarChart3 size={20} /> {progress}%</span>
          </nav>

          <div className="flex items-center gap-3">
            <div className="hidden rounded-2xl border border-stone-300 bg-white px-4 py-2 text-sm font-semibold md:block">{currentUser.displayName}</div>
            <Button onClick={logout} variant="outline" className="rounded-2xl border-stone-300 bg-transparent px-4 py-6 text-stone-800 hover:bg-stone-100">Abmelden</Button>
          </div>
        </div>
      </header>

      {page === "admin" && currentUser.role === "admin" ? (
        <AdminPanel settings={settings} onUpdateSettings={updateSettings} />
      ) : page === "karte" ? (
        <main className="mx-auto grid max-w-[1600px] gap-6 px-5 py-8 lg:grid-cols-[1.65fr_.85fr]">
          <section className="space-y-5">
            <WorldMap selected={selected} hovered={hovered} setSelected={setSelected} setHovered={setHovered} recipes={recipes} suggestions={suggestions} selectedRegion={selectedRegion} requiredRecipes={settings.requiredRecipesPerCountry} minAverageRating={settings.minAverageRatingForCompletion} />
            <div className="grid gap-4 rounded-3xl border-2 border-stone-300 bg-[#fff8e9] p-4 shadow-sm md:grid-cols-3">
              <div className="flex items-center gap-3 border-stone-200 md:border-r"><Globe2 className="h-10 w-10" /><div><p className="text-sm text-stone-500">Abgeschlossene Länder</p><p className="text-2xl font-black">{doneCount} / {countries.length}</p></div></div>
              <div className="flex items-center gap-3 border-stone-200 md:border-r"><ChefHat className="h-10 w-10" /><div><p className="text-sm text-stone-500">Rezepte gesamt</p><p className="text-2xl font-black">{recipeEntries.length}</p></div></div>
              <div className="flex items-center gap-3"><Star className="h-10 w-10 fill-amber-400 text-amber-500" /><div><p className="text-sm text-stone-500">Durchschnitt</p><p className="text-2xl font-black">{averageRating} / 5</p></div></div>
            </div>
          </section>

          <aside className="space-y-5">
            <div className="grid gap-3 md:grid-cols-[1fr_auto]">
              <div className="relative"><Search className="absolute left-4 top-3.5 h-5 w-5 text-stone-500" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Land, Rezept, Kategorie oder Ersteller suchen..." className="w-full rounded-2xl border-2 border-stone-300 bg-[#fffaf0] py-3 pl-12 pr-4 outline-none focus:border-amber-500" /></div>
              <select value={selectedRegion} onChange={(event) => setSelectedRegion(event.target.value)} className="rounded-2xl border-2 border-stone-300 bg-[#fffaf0] px-4 py-3 outline-none focus:border-amber-500">
                <option>Alle Kontinente</option>
                {regionRows.map((region) => <option key={region.name}>{region.name}</option>)}
              </select>
            </div>

            <Card className="overflow-hidden rounded-[2rem] border-2 border-stone-300 bg-[#fff8e9] shadow-sm">
              <CardContent className="p-0">
                <div className="grid grid-cols-[1fr_1.3fr_1fr_36px] border-b-2 border-stone-300 bg-[#fbf0dd] px-4 py-4 font-black"><span>{query.trim() ? "Land" : activeCountry}</span><span>Rezept</span><span>Bewertung</span><span /></div>
                <div className="max-h-[560px] overflow-auto">
                  {visibleRecipes.map(([country, recipe]) => (
                    <button key={recipe.id} onMouseEnter={() => setHovered(country)} onMouseLeave={() => setHovered("")} onClick={() => { setSelected(country); openRecipe(recipe, country); }} className={`grid w-full grid-cols-[1fr_1.3fr_1fr_36px] items-center border-b border-stone-200 px-4 py-4 text-left transition hover:bg-amber-100 ${selected === country ? "bg-amber-100" : ""}`}>
                      <span className="font-semibold">{country}</span>
                      <span>{recipe.image && <img src={recipe.image} alt={recipe.dish} className="mb-2 h-16 w-24 rounded-lg object-cover" />}<b>{recipe.dish}</b><br /><small className="text-stone-500">{recipe.category || "Hauptgericht"} · von {recipe.createdByName || recipe.createdBy}</small></span>
                      <span onClick={(event) => event.stopPropagation()}><RatingStars value={getUserRating(recipe, currentUser.username)} onChange={(rating) => setRating(country, recipe.id, rating)} small /><small className="text-stone-500">Ø {getRecipeAverage(recipe)}</small></span>
                      <ChevronRight />
                    </button>
                  ))}
                  {!visibleRecipes.length && <p className="p-6 text-stone-500">Für dieses Land ist noch kein Rezept eingetragen.</p>}
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-[2rem] border-2 border-stone-300 bg-[#fff8e9] shadow-sm">
              <CardContent className="p-5">
                <p className="text-sm uppercase tracking-wide text-stone-500">Ausgewähltes Land</p>
                <h3 className="mt-1 text-2xl font-black">{activeCountry}</h3>
                <p className="mt-1 text-sm text-stone-500">{getQualifiedRecipesCount(activeRecipes, settings.minAverageRatingForCompletion)} / {settings.requiredRecipesPerCountry} Rezepte über {settings.minAverageRatingForCompletion} Sterne bis abgeschlossen</p>
                <div className="mt-4 rounded-2xl border border-stone-200 bg-white p-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <h4 className="font-black">Rezeptvorschläge</h4>
                    <Button
                      onClick={() => {
                        setSuggestionText("");
                        setSuggestionDialogOpen(true);
                      }}
                      className="rounded-xl bg-amber-300 text-stone-950 hover:bg-amber-200"
                    >
                      <Plus className="mr-2 h-4 w-4" /> Rezeptvorschlag hinzufügen
                    </Button>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {(Array.isArray(suggestions[activeCountry]) ? suggestions[activeCountry] : []).map((suggestion, index) => (
                      <button key={`${suggestion}-${index}`} onClick={() => openSuggestion(activeCountry, suggestion, index)} className="rounded-full bg-yellow-200 px-3 py-1 text-sm font-semibold text-stone-900 hover:bg-yellow-300" title="Vorschlag öffnen">
                        {suggestion}
                      </button>
                    ))}
                    {!hasSuggestions(suggestions[activeCountry]) && <p className="text-sm text-stone-500">Noch keine Vorschläge.</p>}
                  </div>
                </div>
                {activeRecipes.length ? (
                  <div className="mt-3 space-y-3">
                    {activeRecipes.slice(0, 4).map((recipe) => (
                      <button key={recipe.id} onClick={() => openRecipe(recipe, activeCountry)} className="w-full rounded-2xl border border-stone-200 bg-white p-3 text-left hover:bg-amber-50">
                        {recipe.image && <img src={recipe.image} alt={recipe.dish} className="mb-3 h-28 w-full rounded-xl object-cover" />}
                        <p><b>{recipe.dish}</b></p>
                        <p className="text-xs text-stone-500">{recipe.category || "Hauptgericht"} · erstellt von {recipe.createdByName || recipe.createdBy}</p>
                        <RatingStars value={getUserRating(recipe, currentUser.username)} onChange={(rating) => setRating(activeCountry, recipe.id, rating)} small />
                        <p className="text-xs text-stone-500">Deine Bewertung · Ø {getRecipeAverage(recipe)}</p>
                      </button>
                    ))}
                  </div>
                ) : <p className="mt-3 text-stone-600">Für dieses Land ist noch kein Rezept eingetragen.</p>}
              </CardContent>
            </Card>
          </aside>
        </main>
      ) : (
        <main className="mx-auto max-w-7xl px-5 py-8">
          <motion.section initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} className="mb-8 grid gap-6 rounded-[2rem] bg-gradient-to-br from-orange-400 via-rose-400 to-amber-500 p-8 text-white shadow-2xl md:grid-cols-[1.3fr_.7fr]">
            <div><div className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/20 px-4 py-2 text-sm backdrop-blur"><ChefHat size={18} /> Rezeptwerkstatt</div><h2 className="text-4xl font-black tracking-tight md:text-6xl">Mehrere Rezepte pro Land</h2><p className="mt-4 max-w-2xl text-lg text-white/90">Ein Land ist erst abgeschlossen, wenn genug Rezepte über der Mindestbewertung liegen.</p></div>
            <Card className="border-white/20 bg-white/20 text-white backdrop-blur-xl"><CardContent className="p-6"><div className="flex items-center gap-3"><Globe2 className="h-10 w-10" /><div><p className="text-sm text-white/75">Fortschritt</p><p className="text-4xl font-black">{progress}%</p></div></div><div className="mt-5 h-4 rounded-full bg-white/20"><div className="h-4 rounded-full bg-white transition-all" style={{ width: `${progress}%` }} /></div><p className="mt-3 text-sm text-white/85">{doneCount} von {countries.length} Ländern abgeschlossen</p></CardContent></Card>
          </motion.section>

          <div className="grid gap-6 lg:grid-cols-[1.1fr_.9fr]">
            <section className="space-y-6">
              <Card className="border-2 border-stone-300 bg-[#fff8e9] shadow-sm">
                <CardContent className="p-5">
                  <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between"><h2 className="flex items-center gap-2 text-2xl font-bold"><MapPin /> Länderauswahl</h2><div className="relative"><Search className="absolute left-3 top-2.5 h-4 w-4 text-stone-500" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Land suchen..." className="w-full rounded-2xl border-2 border-stone-300 bg-white py-2 pl-9 pr-4 outline-none focus:border-amber-500 md:w-64" /></div></div>
                  <RegionCountryPicker regionRows={regionRows} collapsedRegions={collapsedRegions} toggleRegion={toggleRegion} recipes={recipes} selected={selected} setSelected={selectCountryAndJumpToForm} query={query} requiredRecipes={settings.requiredRecipesPerCountry} minAverageRating={settings.minAverageRatingForCompletion} />
                  {query && <div className="mt-4 rounded-2xl bg-white p-4"><p className="mb-2 text-sm text-stone-500">Suchergebnisse:</p><div className="flex flex-wrap gap-2">{filteredCountries.slice(0, 30).map((country) => <button key={country} onClick={() => selectCountryAndJumpToForm(country)} className="rounded-full bg-stone-100 px-3 py-1 text-sm hover:bg-stone-200">{country}</button>)}</div></div>}
                </CardContent>
              </Card>
            </section>

            <aside id="recipe-entry-card" className="scroll-mt-4 lg:sticky lg:top-6 lg:self-start">
              <Card className="border-2 border-stone-300 bg-[#fff8e9] shadow-sm">
                <CardContent className="p-6">
                  <div className="mb-5 flex items-center justify-between gap-3"><div><p className="text-sm uppercase tracking-wide text-amber-700">Ausgewähltes Land</p><h2 className="text-3xl font-black">{selected}</h2><p className="text-sm text-stone-500">{getQualifiedRecipesCount(recipes[selected], settings.minAverageRatingForCompletion)} / {settings.requiredRecipesPerCountry} Rezepte über {settings.minAverageRatingForCompletion} Sterne</p></div>{isCountryCompleted(recipes[selected], settings.requiredRecipesPerCountry, settings.minAverageRatingForCompletion) && <CheckCircle2 className="h-9 w-9 text-emerald-500" />}</div>
                  <div className="space-y-4">
                    <label className="block"><span className="mb-1 block text-sm font-semibold text-stone-600">Gericht</span><input value={form.dish} onChange={(event) => setForm({ ...form, dish: event.target.value })} placeholder={countryHints[selected] || "z. B. Nationalgericht oder Lieblingsgericht"} className="w-full rounded-2xl border-2 border-stone-300 bg-white p-3 outline-none focus:border-amber-500" /></label>
                    <label className="block"><span className="mb-1 block text-sm font-semibold text-stone-600">Kategorie</span><select value={form.category || "Hauptgericht"} onChange={(event) => setForm({ ...form, category: event.target.value })} className="w-full rounded-2xl border-2 border-stone-300 bg-white p-3 outline-none focus:border-amber-500">{recipeCategories.map((category) => <option key={category}>{category}</option>)}</select></label>
                    <label className="block">
                      <span className="mb-1 block text-sm font-semibold text-stone-600">Bild</span>
                      <input type="file" accept="image/png,image/jpeg,image/webp,image/gif" onChange={handleImageUpload} className="w-full rounded-2xl border-2 border-stone-300 bg-white p-3 outline-none focus:border-amber-500" />
                      {imageError && <p className="mt-2 rounded-xl bg-red-50 px-3 py-2 text-sm font-semibold text-red-700">{imageError}</p>}
                      {form.image && <div className="mt-3 rounded-2xl border border-stone-200 bg-white p-3"><img src={form.image} alt="Rezeptvorschau" className="max-h-56 w-full rounded-xl object-cover" /><Button type="button" onClick={removeImage} variant="outline" className="mt-3 rounded-xl border-stone-300 bg-white text-stone-800 hover:bg-stone-100">Bild entfernen</Button></div>}
                    </label>
                    <label className="block"><span className="mb-1 block text-sm font-semibold text-stone-600">Rezept / Link / Zutaten</span><textarea value={form.recipe} onChange={(event) => setForm({ ...form, recipe: event.target.value })} placeholder="Zutaten, Zubereitung oder Rezept-Link eintragen..." rows={7} className="w-full resize-none rounded-2xl border-2 border-stone-300 bg-white p-3 outline-none focus:border-amber-500" /></label>
                    <div className="rounded-2xl border border-stone-200 bg-white p-3 text-sm text-stone-600">{editingRecipeId ? "Du bearbeitest ein bestehendes Rezept." : `Neues Rezept wird als erstellt von ${currentUser.displayName} gespeichert.`}</div>
                    <label className="block"><span className="mb-1 block text-sm font-semibold text-stone-600">Notizen</span><textarea value={form.notes} onChange={(event) => setForm({ ...form, notes: event.target.value })} placeholder="Wer hat gekocht? Was würdet ihr ändern?" rows={4} className="w-full resize-none rounded-2xl border-2 border-stone-300 bg-white p-3 outline-none focus:border-amber-500" /></label>
                    <div className="flex flex-wrap gap-3"><Button onClick={saveRecipe} className="rounded-2xl bg-amber-400 px-5 py-6 text-stone-950 hover:bg-amber-300"><Plus className="mr-2 h-4 w-4" /> {editingRecipeId ? "Änderungen speichern" : "Neues Rezept speichern"}</Button><Button onClick={clearRecipe} variant="outline" className="rounded-2xl border-stone-300 bg-transparent px-5 py-6 text-stone-800 hover:bg-stone-100"><Trash2 className="mr-2 h-4 w-4" /> {editingRecipeId ? "Rezept löschen" : "Zurücksetzen"}</Button></div>
                  </div>

                  <div className="mt-6 rounded-2xl border border-stone-200 bg-white p-4">
                    <h3 className="mb-3 text-lg font-black">Rezepte für {selected}</h3>
                    <div className="space-y-3">
                      {(Array.isArray(recipes[selected]) ? recipes[selected] : []).map((recipe) => (
                        <button key={recipe.id} onClick={() => openRecipe(recipe, selected)} className="w-full rounded-2xl border border-stone-200 bg-[#fffaf0] p-3 text-left transition hover:border-amber-400 hover:bg-amber-50">
                          {recipe.image && <img src={recipe.image} alt={recipe.dish} className="mb-3 h-28 w-full rounded-xl object-cover" />}
                          <div className="flex items-start justify-between gap-3"><div><p className="font-bold">{recipe.dish}</p><p className="text-xs text-stone-500">{recipe.category || "Hauptgericht"} · erstellt von {recipe.createdByName || recipe.createdBy}</p></div><Button type="button" onClick={(event) => { event.stopPropagation(); editRecipe(recipe); }} variant="outline" className="rounded-xl border-stone-300 bg-white px-3 py-2 text-xs text-stone-800 hover:bg-stone-100">Bearbeiten</Button></div>
                          <div className="mt-2 flex flex-wrap items-center gap-3"><RatingStars value={getUserRating(recipe, currentUser.username)} onChange={(rating) => setRating(selected, recipe.id, rating)} small /><span className="text-xs text-stone-500">Deine Bewertung · Ø {getRecipeAverage(recipe)}</span></div>
                        </button>
                      ))}
                      {!(Array.isArray(recipes[selected]) && recipes[selected].length) && <p className="text-sm text-stone-500">Noch keine Rezepte für dieses Land.</p>}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </aside>
          </div>
        </main>
      )}

      {suggestionDialogOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
          onClick={() => setSuggestionDialogOpen(false)}
        >
          <div
            className="w-full max-w-md rounded-[2rem] border-2 border-stone-300 bg-[#fff8e9] p-6 shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <p className="text-sm uppercase tracking-wide text-amber-700">Rezeptvorschlag für</p>
            <h2 className="mt-1 text-3xl font-black">{selected}</h2>
            <p className="mt-3 text-stone-600">
              Trage hier nur den Namen des Gerichts ein. Das eigentliche Rezept kannst du später daraus erstellen.
            </p>

            <label className="mt-5 block">
              <span className="mb-1 block text-sm font-semibold text-stone-600">Vorschlag</span>
              <input
                autoFocus
                value={suggestionText}
                onChange={(event) => setSuggestionText(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && suggestionText.trim()) addSuggestion();
                }}
                placeholder="z. B. Sauerbraten"
                className="w-full rounded-2xl border-2 border-stone-300 bg-white p-3 outline-none focus:border-amber-500"
              />
            </label>

            <div className="mt-6 grid grid-cols-2 gap-3">
              <Button
                onClick={addSuggestion}
                disabled={!suggestionText.trim()}
                className="rounded-2xl bg-amber-400 px-5 py-5 text-stone-950 hover:bg-amber-300 disabled:opacity-50"
              >
                <Plus className="mr-2 h-4 w-4" /> Hinzufügen
              </Button>
              <Button
                onClick={() => {
                  setSuggestionDialogOpen(false);
                  setSuggestionText("");
                }}
                variant="outline"
                className="rounded-2xl border-stone-300 bg-white px-5 py-5 text-stone-800 hover:bg-stone-100"
              >
                Abbrechen
              </Button>
            </div>
          </div>
        </div>
      )}

      {openedSuggestion && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-[2rem] border-2 border-stone-300 bg-[#fff8e9] p-6 shadow-2xl">
            <p className="text-sm uppercase tracking-wide text-amber-700">Rezeptvorschlag für {openedSuggestion.country}</p>
            <h2 className="mt-2 text-3xl font-black">{openedSuggestion.suggestion}</h2>
            <p className="mt-3 text-stone-600">Findest du den Vorschlag gut?</p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Button onClick={convertSuggestionToRecipe} className="rounded-2xl bg-amber-400 px-5 py-5 text-stone-950 hover:bg-amber-300">
                <Plus className="mr-2 h-4 w-4" /> In Rezept umwandeln
              </Button>
              <Button onClick={() => removeSuggestion(openedSuggestion.country, openedSuggestion.index)} variant="outline" className="rounded-2xl border-stone-300 bg-white px-5 py-5 text-stone-800 hover:bg-stone-100">
                <Trash2 className="mr-2 h-4 w-4" /> Löschen
              </Button>
              <Button onClick={() => setOpenedSuggestion(null)} variant="outline" className="rounded-2xl border-stone-300 bg-transparent px-5 py-5 text-stone-800 hover:bg-stone-100">
                Abbrechen
              </Button>
            </div>
          </div>
        </div>
      )}
      <RecipeModal openedRecipe={openedRecipe} currentUser={currentUser} setRating={setRating} onClose={closeRecipe} />
    </div>
  );
}
