import React, { useEffect, useMemo, useRef, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { ComposableMap, Geographies, Geography, Graticule, ZoomableGroup } from "react-simple-maps";
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
  Link2,
  ExternalLink,
  Heart,
  ShoppingCart,
  Navigation,
  CalendarDays,
  Activity,
  Plus,
  Search,
  Star,
  Trash2,
  Mail,
  LockKeyhole,
  UserRound,
  KeyRound,
  Eye,
  EyeOff,
  Sparkles,
  UtensilsCrossed,
  Plane,
  Compass,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";


const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = SUPABASE_URL && SUPABASE_ANON_KEY ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY) : null;
const APP_STATE_ID = "weltkochen-global-state";
const ONLINE_STORAGE_ENABLED = Boolean(supabase);

const geoUrl = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-50m.json";
const DEFAULT_REQUIRED_RECIPES_PER_COUNTRY = 2;
const DEFAULT_MIN_AVERAGE_RATING_FOR_COMPLETION = 4;
const COLOR_SELECTED = "#1e3a8a";
const COLOR_HOVER = "#8b5e3c";
const COLOR_SUGGESTION = "#fde047";
const COLOR_COMPLETED = "#86cc8a";
const COLOR_DEFAULT = "#e8c9a1";
const recipeCategories = ["Vorspeise", "Hauptgericht", "Dessert", "Beilage", "Snack", "Getränk", "Suppe", "Salat", "Gebäck", "Sonstiges"];

const EMPTY_RECIPE_FORM = {
  dish: "",
  category: "Hauptgericht",
  sourceUrl: "",
  servings: 4,
  ingredients: [{ amount: "", unit: "", name: "" }],
  recipe: "",
  notes: "",
  image: "",
};

function recipeFormSignature(form) {
  return JSON.stringify({
    dish: String(form?.dish || ""),
    category: String(form?.category || "Hauptgericht"),
    sourceUrl: String(form?.sourceUrl || ""),
    servings: Number(form?.servings) || 4,
    ingredients: (Array.isArray(form?.ingredients) ? form.ingredients : []).map((item) => ({
      amount: item?.amount === "" ? "" : Number(item?.amount),
      unit: String(item?.unit || ""),
      name: String(item?.name || ""),
    })),
    recipe: String(form?.recipe || ""),
    notes: String(form?.notes || ""),
    image: String(form?.image || ""),
  });
}

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
  Bahamas: { center: [-76.5, 24.3], zoom: 6.2 },
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

async function loadNormalizedContent() {
  const [{ data: recipeRows, error: recipeError }, { data: ingredientRows, error: ingredientError }, { data: ratingRows, error: ratingError }, { data: suggestionRows, error: suggestionError }] = await Promise.all([
    supabase.from("weltkochen_recipes").select("*").is("deleted_at", null).order("created_at", { ascending: true }),
    supabase.from("weltkochen_ingredients").select("*").order("position", { ascending: true }),
    supabase.from("weltkochen_ratings").select("recipe_id,user_id,rating"),
    supabase.from("weltkochen_suggestions").select("id,country,suggestion,creator_id,created_at").order("created_at", { ascending: true }),
  ]);
  if (recipeError) throw recipeError;
  if (ingredientError) throw ingredientError;
  if (ratingError) throw ratingError;
  if (suggestionError) throw suggestionError;

  const profileIds = [...new Set((ratingRows || []).map((row) => row.user_id).filter(Boolean))];
  let usernamesById = {};
  if (profileIds.length) {
    const { data: profiles, error: profileError } = await supabase.from("weltkochen_profiles").select("id,username").in("id", profileIds);
    if (profileError) throw profileError;
    usernamesById = Object.fromEntries((profiles || []).map((profile) => [profile.id, profile.username]));
  }

  const ingredientsByRecipe = {};
  for (const row of ingredientRows || []) {
    (ingredientsByRecipe[row.recipe_id] ||= []).push({ amount: row.amount == null ? "" : Number(row.amount), unit: row.unit || "", name: row.name || "" });
  }
  const ratingsByRecipe = {};
  for (const row of ratingRows || []) {
    const username = usernamesById[row.user_id];
    if (username) (ratingsByRecipe[row.recipe_id] ||= {})[username] = Number(row.rating);
  }

  const recipes = {};
  for (const row of recipeRows || []) {
    (recipes[row.country] ||= []).push({
      id: row.id, dish: row.dish, category: row.category || "Hauptgericht", sourceUrl: row.source_url || "",
      servings: Number(row.servings) || 4, ingredients: ingredientsByRecipe[row.id] || [], recipe: row.instructions || "",
      notes: row.notes || "", image: row.image_url || "", createdBy: row.creator_username || "",
      createdByName: row.creator_name || row.creator_username || "", createdAt: row.created_at,
      creatorId: row.creator_id, ratings: ratingsByRecipe[row.id] || {},
    });
  }
  const suggestions = {};
  for (const row of suggestionRows || []) (suggestions[row.country] ||= []).push(row.suggestion);
  return { recipes, suggestions };
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

function ingredientAmountToNumber(value) {
  const raw = String(value ?? "").trim().replace(",", ".");
  if (!raw) return "";
  const unicode = { "¼": 0.25, "½": 0.5, "¾": 0.75, "⅓": 1 / 3, "⅔": 2 / 3, "⅛": 0.125, "⅜": 0.375, "⅝": 0.625, "⅞": 0.875 };
  if (unicode[raw] != null) return unicode[raw];
  if (raw.includes("/")) {
    const [a, b] = raw.split("/").map(Number);
    if (Number.isFinite(a) && Number.isFinite(b) && b !== 0) return a / b;
  }
  const num = Number(raw);
  return Number.isFinite(num) ? num : "";
}

function cleanIngredientRows(rows) {
  return (Array.isArray(rows) ? rows : [])
    .map((row) => ({
      amount: ingredientAmountToNumber(row?.amount),
      unit: String(row?.unit || "").trim(),
      name: String(row?.name || "").trim(),
    }))
    .filter((row) => row.name);
}


function ingredientCategory(name) {
  const value = String(name || "").toLocaleLowerCase("de-DE");
  const groups = [
    ["Gemüse & Obst", ["tomate","tomaten","zwiebel","knoblauch","paprika","karotte","möhre","kartoffel","salat","gurke","zucchini","aubergine","apfel","banane","zitrone","limette","pilz","champignon","sellerie","lauch"]],
    ["Fleisch & Fisch", ["hackfleisch","rind","schwein","hähnchen","huhn","pute","speck","schinken","wurst","lachs","fisch","garnelen","thunfisch"]],
    ["Milchprodukte & Eier", ["milch","sahne","käse","mozzarella","parmesan","joghurt","quark","butter","ei","eier","schmand","creme fraiche"]],
    ["Backen & Trockenwaren", ["mehl","zucker","reis","nudel","pasta","brot","paniermehl","haferflocken","hefe","stärke","couscous","bulgur"]],
    ["Gewürze & Vorrat", ["salz","pfeffer","öl","essig","paprikapulver","curry","brühe","senf","ketchup","tomatenmark","sojasauce","honig","zimt","muskat"]],
  ];
  for (const [label, words] of groups) {
    if (words.some((word) => value.includes(word))) return label;
  }
  return "Sonstiges";
}

function normalizeIngredientName(name) {
  return String(name || "")
    .trim()
    .toLocaleLowerCase("de-DE")
    .replace(/\s+/g, " ");
}

function unitFamily(unit) {
  const value = String(unit || "").trim().toLocaleLowerCase("de-DE");
  if (["kg", "kilogramm", "kilogram", "g", "gramm", "gram"].includes(value)) return "weight";
  if (["l", "liter", "dl", "cl", "ml", "milliliter"].includes(value)) return "volume";
  if (["stück", "stk", "st"].includes(value)) return "piece";
  return value || "none";
}

function convertToBaseUnit(amount, unit) {
  const numeric = Number(amount);
  if (!Number.isFinite(numeric)) return null;
  const value = String(unit || "").trim().toLocaleLowerCase("de-DE");

  if (["kg", "kilogramm", "kilogram"].includes(value)) return { amount: numeric * 1000, unit: "g" };
  if (["g", "gramm", "gram"].includes(value)) return { amount: numeric, unit: "g" };
  if (["l", "liter"].includes(value)) return { amount: numeric * 1000, unit: "ml" };
  if (value === "dl") return { amount: numeric * 100, unit: "ml" };
  if (value === "cl") return { amount: numeric * 10, unit: "ml" };
  if (["ml", "milliliter"].includes(value)) return { amount: numeric, unit: "ml" };
  if (["stück", "stk", "st"].includes(value)) return { amount: numeric, unit: "Stück" };

  return { amount: numeric, unit: String(unit || "").trim() };
}

function prettifyCombinedAmount(amount, unit) {
  const numeric = Number(amount);
  if (!Number.isFinite(numeric)) return { amount, unit };
  if (unit === "g" && numeric >= 1000) return { amount: numeric / 1000, unit: "kg" };
  if (unit === "ml" && numeric >= 1000) return { amount: numeric / 1000, unit: "l" };
  return { amount: numeric, unit };
}

function normalizeShoppingKey(item) {
  return `${normalizeIngredientName(item.name)}__${unitFamily(item.unit)}`;
}

function combineShoppingItems(items) {
  const map = new Map();

  for (const item of items) {
    const key = normalizeShoppingKey(item);
    const converted = item.amount === "" || item.amount == null
      ? null
      : convertToBaseUnit(item.amount, item.unit);

    if (!map.has(key)) {
      map.set(key, {
        ...item,
        amount: converted ? converted.amount : item.amount,
        unit: converted ? converted.unit : item.unit,
        ids: [item.id],
        recipeNames: item.recipeName ? [item.recipeName] : [],
        category: ingredientCategory(item.name),
      });
      continue;
    }

    const current = map.get(key);
    current.ids.push(item.id);
    if (item.recipeName && !current.recipeNames.includes(item.recipeName)) current.recipeNames.push(item.recipeName);

    if (converted && current.amount !== "" && current.amount != null) {
      current.amount = Number(current.amount) + Number(converted.amount);
      current.unit = converted.unit;
    } else if ((current.amount === "" || current.amount == null) && converted) {
      current.amount = converted.amount;
      current.unit = converted.unit;
    }

    current.checked = current.checked && item.checked;
  }

  return [...map.values()].map((item) => {
    const pretty = prettifyCombinedAmount(item.amount, item.unit);
    return { ...item, amount: pretty.amount, unit: pretty.unit };
  });
}

function formatIngredientAmount(value) {
  const num = Number(value);
  if (!Number.isFinite(num)) return "";
  return Number.isInteger(num) ? String(num) : String(Math.round(num * 100) / 100).replace(".", ",");
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
        sourceUrl: recipe.sourceUrl || "",
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
          sourceUrl: value.sourceUrl || "",
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
  const [showPassword, setShowPassword] = useState(false);

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
    <div className="relative min-h-screen overflow-hidden bg-stone-950 text-white">
      {/* Food-table hero background. Put login-food-world-bg.png in /public */}
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: "url('/login-food-world-bg.png')" }}
      />
      <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(12,10,8,.22)_0%,rgba(12,10,8,.12)_42%,rgba(12,10,8,.48)_100%)]" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-black/15" />

      <div className="relative mx-auto flex min-h-screen max-w-[1700px] items-center px-4 py-5 sm:px-6 lg:px-10">
        <div className="grid w-full gap-6 lg:grid-cols-[1.12fr_.88fr] lg:items-center xl:grid-cols-[1.18fr_.82fr]">
          <section className="flex min-h-[44vh] flex-col justify-between px-2 py-4 sm:px-4 lg:min-h-[86vh] lg:py-8">
            <div className="flex items-center gap-3">
              <div className="grid h-12 w-12 place-items-center rounded-2xl border border-amber-300/40 bg-stone-950/70 text-amber-300 shadow-xl backdrop-blur-md">
                <ChefHat className="h-6 w-6" />
              </div>
              <div className="drop-shadow-lg">
                <p className="text-lg font-black">Koch dich um die Welt</p>
                <p className="text-xs font-bold text-white/70">Die kulinarische Weltreise</p>
              </div>
            </div>

            <div className="max-w-2xl py-10 lg:py-4">
              <div className="inline-flex items-center gap-2 rounded-full border border-amber-300/30 bg-stone-950/65 px-3 py-1.5 text-xs font-black uppercase tracking-[.16em] text-amber-300 shadow-lg backdrop-blur-md">
                <Sparkles className="h-4 w-4" /> Eine Reise. Tausende Geschmäcker.
              </div>
              <h1 className="mt-5 text-5xl font-black leading-[.88] tracking-[-.055em] drop-shadow-[0_5px_18px_rgba(0,0,0,.65)] sm:text-6xl lg:text-7xl xl:text-8xl">
                Koch dich
                <span className="block text-amber-300">um die Welt.</span>
              </h1>
              <p className="mt-5 max-w-xl text-base font-semibold leading-7 text-white/90 drop-shadow-md sm:text-lg">
                Neue Länder. Neue Rezepte. Neue Lieblingsgerichte.
                Und garantiert mindestens eine Diskussion darüber, ob das wirklich 5 Sterne waren.
              </p>

              <div className="mt-6 flex flex-wrap gap-2">
                <span className="rounded-full border border-white/20 bg-black/55 px-3 py-2 text-xs font-black shadow-lg backdrop-blur-md">✈️ Kein Visum nötig</span>
                <span className="rounded-full border border-white/20 bg-black/55 px-3 py-2 text-xs font-black shadow-lg backdrop-blur-md">🍴 100 % Hunger</span>
                <span className="rounded-full border border-white/20 bg-black/55 px-3 py-2 text-xs font-black shadow-lg backdrop-blur-md">🌍 Über 190 Länder</span>
                <span className="rounded-full border border-amber-300/40 bg-amber-300 px-3 py-2 text-xs font-black text-stone-950 shadow-lg">⭐ 5 Sterne werden erkocht</span>
              </div>
            </div>

            <div className="hidden max-w-xl items-end justify-between gap-4 lg:flex">
              <div className="rotate-[-2deg] rounded-2xl border border-white/20 bg-[#f4e3bd]/95 px-4 py-3 text-stone-900 shadow-xl">
                <p className="text-[10px] font-black uppercase tracking-[.16em] text-stone-500">Heutige Reiseregel</p>
                <p className="mt-1 font-black">Irgendwo schmeckt immer gut. 😋</p>
              </div>
              <div className="rotate-[3deg] rounded-2xl border border-amber-300/30 bg-stone-950/75 px-4 py-3 shadow-xl backdrop-blur">
                <p className="text-[10px] font-black uppercase tracking-[.16em] text-amber-300">Boarding Pass</p>
                <p className="mt-1 text-sm font-black">HOME ✈ WORLD</p>
              </div>
            </div>
          </section>

          <section className="flex justify-center lg:justify-end">
            <form
              onSubmit={handleSubmit}
              className="relative w-full max-w-[560px] overflow-hidden rounded-[2rem] border border-amber-300/35 bg-[#121313]/92 p-5 text-white shadow-[0_35px_100px_rgba(0,0,0,.48)] backdrop-blur-xl sm:p-7 lg:p-8"
            >
              <div className="pointer-events-none absolute -right-20 -top-24 h-56 w-56 rounded-full bg-amber-400/10 blur-3xl" />

              <div className="relative">
                <div className="mb-6 text-center">
                  <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl border border-amber-300/30 bg-amber-300/10 text-amber-300">
                    <Globe2 className="h-6 w-6" />
                  </div>
                  <p className="mt-4 text-xs font-black uppercase tracking-[.18em] text-amber-300">
                    {mode === "login" ? "Willkommen zurück" : "Neue Reise"}
                  </p>
                  <h2 className="mt-1 text-3xl font-black tracking-tight sm:text-4xl">
                    {mode === "login" ? <>Weiter geht die <span className="text-amber-300">Weltreise.</span></> : <>Dein kulinarischer <span className="text-amber-300">Reisepass.</span></>}
                  </h2>
                </div>

                <div className="mb-6 grid grid-cols-2 rounded-2xl border border-white/10 bg-white/[0.05] p-1">
                  <button type="button" onClick={() => { setMode("login"); setError(""); }} className={`rounded-xl px-3 py-3 text-sm font-black transition ${mode === "login" ? "bg-white/10 text-amber-300 shadow-sm" : "text-stone-400 hover:text-white"}`}>
                    Anmelden
                  </button>
                  <button type="button" onClick={() => { setMode("register"); setError(""); }} className={`rounded-xl px-3 py-3 text-sm font-black transition ${mode === "register" ? "bg-white/10 text-amber-300 shadow-sm" : "text-stone-400 hover:text-white"}`}>
                    Neue Reise starten
                  </button>
                </div>

                <div className="space-y-3.5">
                  {mode === "register" && <>
                    <label className="block">
                      <span className="mb-1.5 block text-[11px] font-black uppercase tracking-wide text-stone-400">Anzeigename</span>
                      <div className="relative"><UserRound className="absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-stone-500" /><input required value={displayName} onChange={e=>setDisplayName(e.target.value)} autoComplete="name" placeholder="Wie sollen wir dich nennen?" className="w-full rounded-xl border border-white/15 bg-black/25 py-3.5 pl-11 pr-4 font-semibold text-white outline-none placeholder:text-stone-600 focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20" /></div>
                    </label>
                    <label className="block">
                      <span className="mb-1.5 block text-[11px] font-black uppercase tracking-wide text-stone-400">Benutzername</span>
                      <div className="relative"><Compass className="absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-stone-500" /><input required value={username} onChange={e=>setUsername(e.target.value)} autoComplete="username" placeholder="Dein Benutzername" className="w-full rounded-xl border border-white/15 bg-black/25 py-3.5 pl-11 pr-4 font-semibold text-white outline-none placeholder:text-stone-600 focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20" /></div>
                    </label>
                    <label className="block">
                      <span className="mb-1.5 block text-[11px] font-black uppercase tracking-wide text-stone-400">Einladungscode</span>
                      <div className="relative"><KeyRound className="absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-stone-500" /><input required value={inviteCode} onChange={e=>setInviteCode(e.target.value.toUpperCase())} autoComplete="off" placeholder="Dein Ticket zur Weltreise" className="w-full rounded-xl border border-white/15 bg-black/25 py-3.5 pl-11 pr-4 font-mono font-black uppercase tracking-widest text-white outline-none placeholder:font-sans placeholder:font-normal placeholder:normal-case placeholder:tracking-normal placeholder:text-stone-600 focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20" /></div>
                    </label>
                  </>}

                  <label className="block">
                    <span className="mb-1.5 block text-[11px] font-black uppercase tracking-wide text-stone-400">E-Mail</span>
                    <div className="relative"><Mail className="absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-stone-500" /><input required type="email" value={email} onChange={e=>setEmail(e.target.value)} autoComplete="email" placeholder="weltenbummler@foodie.de" className="w-full rounded-xl border border-white/15 bg-black/25 py-3.5 pl-11 pr-4 font-semibold text-white outline-none placeholder:text-stone-600 focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20" /></div>
                  </label>

                  <label className="block">
                    <span className="mb-1.5 block text-[11px] font-black uppercase tracking-wide text-stone-400">Passwort</span>
                    <div className="relative">
                      <LockKeyhole className="absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-stone-500" />
                      <input required type={showPassword ? "text" : "password"} minLength={8} value={password} onChange={e=>setPassword(e.target.value)} autoComplete={mode === "register" ? "new-password" : "current-password"} placeholder={mode === "register" ? "Mindestens 8 Zeichen" : "Dein geheimes Rezept"} className="w-full rounded-xl border border-white/15 bg-black/25 py-3.5 pl-11 pr-12 font-semibold text-white outline-none placeholder:text-stone-600 focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20" />
                      <button type="button" onClick={() => setShowPassword(v=>!v)} className="absolute right-2.5 top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-lg text-stone-500 hover:bg-white/5 hover:text-white" aria-label={showPassword ? "Passwort verbergen" : "Passwort anzeigen"}>
                        {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                      </button>
                    </div>
                  </label>

                  {success && <div className="rounded-xl border border-emerald-500/25 bg-emerald-500/10 p-3 text-sm font-semibold text-emerald-300">{success}</div>}
                  {error && <div className="rounded-xl border border-red-500/25 bg-red-500/10 p-3 text-sm font-semibold text-red-300">{error}</div>}
                  {storageError && <div className="rounded-xl border border-red-500/25 bg-red-500/10 p-3 text-sm font-semibold text-red-300">{storageError}</div>}

                  <Button type="submit" disabled={busy || (mode === "register" && (!displayName.trim() || !username.trim() || !inviteCode.trim() || !email.trim() || password.length < 8))} className="group mt-2 w-full rounded-xl bg-amber-400 py-6 text-base font-black text-stone-950 shadow-[0_12px_30px_rgba(245,158,11,.20)] hover:bg-amber-300 disabled:cursor-not-allowed disabled:opacity-50">
                    {busy ? <span className="flex items-center justify-center gap-2"><span className="h-4 w-4 animate-spin rounded-full border-2 border-stone-900/30 border-t-stone-900" />Bitte warten...</span> : mode === "login" ? <span className="flex items-center justify-center gap-2">✈️ AB INS ABENTEUER <ChevronRight className="h-5 w-5 transition group-hover:translate-x-1" /></span> : <span className="flex items-center justify-center gap-2">REISEPASS ERSTELLEN <ChevronRight className="h-5 w-5" /></span>}
                  </Button>

                  <div className="rounded-xl border border-dashed border-amber-300/30 bg-amber-300/[0.06] p-3.5">
                    <p className="text-xs font-black uppercase tracking-wide text-amber-300">⚠ Reisewarnung</p>
                    <p className="mt-1 text-xs leading-5 text-stone-400">Nach dem Login kann spontaner Hunger auf internationale Küche auftreten.</p>
                  </div>
                </div>

                <div className="mt-5 grid grid-cols-3 gap-2 border-t border-white/10 pt-4 text-center">
                  <div><p className="text-lg">🌍</p><p className="mt-1 text-[9px] font-black uppercase text-stone-500">Länder entdecken</p></div>
                  <div><p className="text-lg">🍲</p><p className="mt-1 text-[9px] font-black uppercase text-stone-500">Rezepte sammeln</p></div>
                  <div><p className="text-lg">⭐</p><p className="mt-1 text-[9px] font-black uppercase text-stone-500">Karte erkochen</p></div>
                </div>
              </div>
            </form>
          </section>
        </div>
      </div>
    </div>
  );
}

function WorldMap({ selected, hovered, setSelected, setHovered, recipes, suggestions, selectedRegion, requiredRecipes, minAverageRating, focusCountry }) {
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

  useEffect(() => {
    if (!focusCountry) return;
    const config = countryZooms[focusCountry];
    if (config) setPosition({ coordinates: config.center, zoom: config.zoom });
  }, [focusCountry]);

  function changeZoom(delta) {
    setPosition((pos) => ({ ...pos, zoom: Math.min(9, Math.max(0.9, pos.zoom + delta)) }));
  }

  function resetZoom() {
    const config = regionZooms[selectedRegion] || regionZooms["Alle Kontinente"];
    setPosition({ coordinates: config.center, zoom: config.zoom });
  }

  function centerSelectedCountry() {
    const config = countryZooms[selected];
    if (config) {
      setPosition({ coordinates: config.center, zoom: config.zoom });
      return;
    }
    const region = regionRows.find((item) => item.countries.includes(selected));
    const fallback = regionZooms[region?.name] || regionZooms["Alle Kontinente"];
    setPosition({ coordinates: fallback.center, zoom: Math.max(fallback.zoom, 2.4) });
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
    setPosition((current) => ({
      ...current,
      coordinates: geoCentroid(geo),
      zoom: Math.max(current.zoom, 3.4),
    }));
  }

  const displayCountry = hovered || selected;
  const displayRecipes = Array.isArray(recipes[displayCountry])
    ? recipes[displayCountry].filter((recipe) => recipe?.dish?.trim())
    : [];
  const displayCompleted = isCountryCompleted(
    recipes[displayCountry],
    requiredRecipes,
    minAverageRating
  );
  const displaySuggested = hasSuggestions(suggestions[displayCountry]);

  return (
    <div
      onMouseDown={handleMouseDown}
      onAuxClick={(event) => event.preventDefault()}
      className="relative overflow-hidden rounded-[1.75rem] border border-stone-300 bg-[#dceef1] shadow-sm"
    >
      <div className="pointer-events-none absolute inset-x-0 top-0 z-[1] h-28 bg-gradient-to-b from-white/20 to-transparent" />

      <div className="absolute left-4 top-4 z-20 max-w-[calc(100%-2rem)] rounded-2xl border border-white/70 bg-[#fffaf0]/95 px-4 py-3 shadow-md backdrop-blur md:left-6 md:top-6 md:px-5 md:py-4">
        <div className="flex items-start gap-3">
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-stone-200 bg-white">
            <MapPin className="h-5 w-5 text-stone-700" />
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="truncate text-xl font-black tracking-tight md:text-2xl">{displayCountry}</h2>
              {displayCompleted && (
                <span className="rounded-full bg-emerald-100 px-2 py-1 text-[11px] font-black text-emerald-800">
                  Abgeschlossen
                </span>
              )}
              {!displayCompleted && displaySuggested && (
                <span className="rounded-full bg-yellow-100 px-2 py-1 text-[11px] font-black text-yellow-800">
                  Vorschlag
                </span>
              )}
            </div>
            <p className="mt-1 text-xs font-medium text-stone-600 md:text-sm">
              {displayRecipes.length
                ? `${displayRecipes.length} Rezept${displayRecipes.length === 1 ? "" : "e"} eingetragen`
                : "Noch kein Rezept eingetragen"}
            </p>
          </div>
        </div>
      </div>

      <ComposableMap
        projection="geoMercator"
        projectionConfig={{ scale: 190 }}
        className="h-[520px] w-full bg-[#dceef1] md:h-[680px] xl:h-[760px]"
      >
        <Graticule stroke="#a9c7cd" strokeWidth={0.35} />
        <ZoomableGroup
          zoom={position.zoom}
          center={position.coordinates}
          translateExtent={[
            [-300, -220],
            [1100, 820],
          ]}
          onMoveEnd={(pos) => setPosition(pos)}
        >
          <Geographies geography={geoUrl}>
            {({ geographies }) =>
              geographies.map((geo) => {
                const countryName = toGermanCountryName(geo.properties.name);
                const isHovered = hovered === countryName;
                const isSelected = selected === countryName;
                const completed = isCountryCompleted(
                  recipes[countryName],
                  requiredRecipes,
                  minAverageRating
                );
                const suggested = hasSuggestions(suggestions[countryName]);
                const fill = isHovered
                  ? "#b98763"
                  : isSelected
                    ? "#355b88"
                    : completed
                      ? "#8ecb94"
                      : suggested
                        ? "#f4dc69"
                        : "#dfc29d";

                return (
                  <Geography
                    key={geo.rsmKey}
                    geography={geo}
                    onMouseEnter={() => setHovered(countryName)}
                    onMouseLeave={() => setHovered("")}
                    onClick={() => handleCountryClick(countryName, geo)}
                    style={{
                      default: {
                        fill,
                        stroke: isSelected ? "#203f61" : "#716554",
                        strokeWidth: isSelected ? 1.25 : 0.45,
                        outline: "none",
                        transition: "fill 140ms ease, stroke-width 140ms ease",
                      },
                      hover: {
                        fill: "#b98763",
                        stroke: "#3b332a",
                        strokeWidth: 1.05,
                        outline: "none",
                        cursor: "pointer",
                      },
                      pressed: {
                        fill: "#c67a3d",
                        stroke: "#3b332a",
                        strokeWidth: 1.1,
                        outline: "none",
                      },
                    }}
                  />
                );
              })
            }
          </Geographies>
        </ZoomableGroup>
      </ComposableMap>

      <div className="absolute bottom-4 left-4 z-20 flex items-center overflow-hidden rounded-2xl border border-stone-300 bg-[#fffaf0]/95 shadow-md backdrop-blur md:bottom-6 md:left-6">
        <button
          type="button"
          onClick={() => changeZoom(0.3)}
          className="grid h-11 w-11 place-items-center border-r border-stone-300 text-xl font-black hover:bg-white"
          aria-label="Karte vergrößern"
        >
          +
        </button>
        <button
          type="button"
          onClick={() => changeZoom(-0.3)}
          className="grid h-11 w-11 place-items-center border-r border-stone-300 text-xl font-black hover:bg-white"
          aria-label="Karte verkleinern"
        >
          −
        </button>
        <button
          type="button"
          onClick={resetZoom}
          className="h-11 px-3 text-xs font-black hover:bg-white"
        >
          Reset
        </button>
        <button
          type="button"
          onClick={centerSelectedCountry}
          className="grid h-11 w-11 place-items-center border-l border-stone-300 hover:bg-white"
          title="Zum ausgewählten Land"
          aria-label="Zum ausgewählten Land"
        >
          <Navigation className="h-4 w-4" />
        </button>
      </div>

      <div className="absolute bottom-4 right-4 z-20 hidden rounded-2xl border border-stone-300 bg-[#fffaf0]/95 px-3 py-2 shadow-md backdrop-blur md:block">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] font-bold text-stone-600">
          <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-[#355b88]" /> Ausgewählt</span>
          <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-[#8ecb94]" /> Abgeschlossen</span>
          <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-[#f4dc69]" /> Vorschlag</span>
        </div>
      </div>
    </div>
  );
}

function RecipeModal({ openedRecipe, currentUser, setRating, onClose, onEdit, isFavorite, onToggleFavorite, onAddToShoppingList, onPlanRecipe }) {
  const [viewServings, setViewServings] = useState(Number(openedRecipe?.servings) || 4);

  useEffect(() => {
    setViewServings(Number(openedRecipe?.servings) || 4);
  }, [openedRecipe?.id]);

  useEffect(() => {
    if (!openedRecipe) return;
    const handleKeyDown = (event) => {
      if (event.key === "Escape") onClose?.();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [openedRecipe, onClose]);

  if (!openedRecipe) return null;

  const baseServings = Number(openedRecipe.servings) || 4;
  const ingredientScale = viewServings / baseServings;
  const structuredIngredients = cleanIngredientRows(openedRecipe.ingredients);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="max-h-[90vh] w-full max-w-3xl overflow-auto rounded-[1.75rem] border border-stone-200 bg-[#fffaf0]/95 shadow-[0_12px_30px_rgba(76,54,28,.08)] p-6 shadow-2xl">
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <p className="text-sm uppercase tracking-wide text-amber-700">{openedRecipe.country}</p>
            <h2 className="text-3xl font-black tracking-tight md:text-4xl">{openedRecipe.dish}</h2>
            {openedRecipe.image && <img src={openedRecipe.image} alt={openedRecipe.dish} className="mt-4 max-h-72 w-full rounded-2xl object-cover" />}
            <p className="mt-1 text-stone-500">{openedRecipe.category || "Hauptgericht"} · erstellt von {openedRecipe.createdByName || openedRecipe.createdBy}</p>
          </div>
          <div className="flex shrink-0 flex-wrap justify-end gap-2">
            <Button
              type="button"
              onClick={() => onToggleFavorite?.(openedRecipe)}
              variant="outline"
              className={`rounded-2xl border-stone-300 ${isFavorite ? "bg-rose-50 text-rose-700" : "bg-white"}`}
              title={isFavorite ? "Aus Favoriten entfernen" : "Zu Favoriten hinzufügen"}
            >
              <Heart className={`h-4 w-4 ${isFavorite ? "fill-current" : ""}`} />
            </Button>
            <Button type="button" onClick={() => onEdit?.(openedRecipe)} className="rounded-2xl bg-stone-900 text-white">
              Bearbeiten
            </Button>
            <Button type="button" onClick={onClose} variant="outline" className="rounded-2xl border-stone-300 bg-white hover:bg-stone-100">
              Schließen
            </Button>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-[1fr_.7fr]">
          <div className="space-y-5">
            {structuredIngredients.length > 0 && (
              <div className="rounded-2xl border border-stone-200 bg-white p-5">
                <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                  <h3 className="text-xl font-black">Zutaten</h3>
                  <label className="flex items-center gap-2 text-sm font-semibold text-stone-600">
                    Personen
                    <input
                      type="number"
                      min="1"
                      max="100"
                      value={viewServings}
                      onChange={(event) => setViewServings(Math.max(1, Number(event.target.value) || 1))}
                      className="w-20 rounded-xl border border-stone-300 bg-[#fffaf0] px-3 py-2"
                    />
                  </label>
                </div>
                <div className="space-y-2">
                  {structuredIngredients.map((ingredient, index) => (
                    <div key={`${ingredient.name}-${index}`} className="grid grid-cols-[70px_70px_1fr] gap-2 rounded-xl bg-stone-50 px-3 py-2 text-sm">
                      <span className="font-bold">
                        {ingredient.amount === "" ? "" : formatIngredientAmount(Number(ingredient.amount) * ingredientScale)}
                      </span>
                      <span className="text-stone-500">{ingredient.unit}</span>
                      <span>{ingredient.name}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-4 grid gap-2 sm:grid-cols-2">
                  <Button
                    type="button"
                    onClick={() => onAddToShoppingList?.(openedRecipe, viewServings)}
                    className="w-full rounded-xl bg-stone-900 text-white"
                  >
                    <ShoppingCart className="mr-2 h-4 w-4" /> Einkaufsliste
                  </Button>
                  <Button
                    type="button"
                    onClick={() => onPlanRecipe?.(openedRecipe, viewServings)}
                    variant="outline"
                    className="w-full rounded-xl border-stone-300 bg-white"
                  >
                    <CalendarDays className="mr-2 h-4 w-4" /> Kochplan
                  </Button>
                </div>
              </div>
            )}
            <div className="rounded-2xl border border-stone-200 bg-white p-5">
              <h3 className="mb-3 text-xl font-black">Zubereitung</h3>
              <div className="whitespace-pre-wrap leading-relaxed text-stone-700">{openedRecipe.recipe || "Keine Zubereitung eingetragen."}</div>
              {openedRecipe.sourceUrl && (
                <a
                  href={openedRecipe.sourceUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-4 inline-flex items-center gap-2 rounded-xl bg-stone-900 px-4 py-3 font-bold text-white"
                >
                  <ExternalLink className="h-4 w-4" /> Originalrezept öffnen
                </a>
              )}
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
                <p><b>Grundmenge:</b> {baseServings} Personen</p>
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
    <div className="rounded-[1.75rem] border-2 border-stone-200 bg-[#fffaf0] p-4">
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

function AdminPanel({ settings, onUpdateSettings, onExportBackup, onTrashChanged }) {
  const [requiredRecipes, setRequiredRecipes] = useState(String(settings.requiredRecipesPerCountry));
  const [minAverageRating, setMinAverageRating] = useState(String(settings.minAverageRatingForCompletion));
  const [inviteCodes, setInviteCodes] = useState([]);
  const [inviteLoading, setInviteLoading] = useState(true);
  const [inviteBusy, setInviteBusy] = useState(false);
  const [inviteMessage, setInviteMessage] = useState("");
  const [inviteError, setInviteError] = useState("");
  const [inviteActionCode, setInviteActionCode] = useState("");
  const [adminUsers, setAdminUsers] = useState([]);
  const [usersLoading, setUsersLoading] = useState(true);
  const [userActionId, setUserActionId] = useState("");
  const [userMessage, setUserMessage] = useState("");
  const [userError, setUserError] = useState("");
  const [myUserId, setMyUserId] = useState("");
  const [deletedRecipes, setDeletedRecipes] = useState([]);
  const [trashLoading, setTrashLoading] = useState(true);
  const [trashActionId, setTrashActionId] = useState("");
  const [trashMessage, setTrashMessage] = useState("");
  const [trashError, setTrashError] = useState("");
  const [adminStats, setAdminStats] = useState({ users: 0, recipes: 0, deleted: 0, suggestions: 0 });
  const [activities, setActivities] = useState([]);
  const [activityLoading, setActivityLoading] = useState(true);
  const [activityUserFilter, setActivityUserFilter] = useState("all");
  const [activityActionFilter, setActivityActionFilter] = useState("all");
  const [adminUserSearch, setAdminUserSearch] = useState("");
  const [trashSearch, setTrashSearch] = useState("");

  useEffect(() => {
    loadInviteCodes();
    loadAdminUsers();
    loadDeletedRecipes();
    loadAdminStats();
    loadActivities();
  }, []);

  async function loadActivities() {
    if (!supabase) return;
    setActivityLoading(true);

    const { data: rows, error } = await supabase
      .from("weltkochen_activity_log")
      .select("id,user_id,action,recipe_id,details,created_at")
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) {
      setActivities([]);
      setActivityLoading(false);
      return;
    }

    const userIds = [...new Set((rows || []).map((row) => row.user_id).filter(Boolean))];
    let profilesById = {};
    if (userIds.length) {
      const { data: profiles } = await supabase
        .from("weltkochen_profiles")
        .select("id,username,display_name")
        .in("id", userIds);
      profilesById = Object.fromEntries((profiles || []).map((profile) => [
        profile.id,
        profile.display_name || profile.username || "Benutzer",
      ]));
    }

    setActivities((rows || []).map((row) => ({
      ...row,
      userName: profilesById[row.user_id] || "System/gelöschter Benutzer",
    })));
    setActivityLoading(false);
  }

  async function loadAdminStats() {
    if (!supabase) return;
    const [usersResult, recipesResult, deletedResult, suggestionsResult] = await Promise.all([
      supabase.from("weltkochen_profiles").select("id", { count: "exact", head: true }),
      supabase.from("weltkochen_recipes").select("id", { count: "exact", head: true }).is("deleted_at", null),
      supabase.from("weltkochen_recipes").select("id", { count: "exact", head: true }).not("deleted_at", "is", null),
      supabase.from("weltkochen_suggestions").select("id", { count: "exact", head: true }),
    ]);
    setAdminStats({
      users: usersResult.count || 0,
      recipes: recipesResult.count || 0,
      deleted: deletedResult.count || 0,
      suggestions: suggestionsResult.count || 0,
    });
  }

  async function loadInviteCodes() {
    if (!supabase) return;
    setInviteLoading(true);
    setInviteError("");

    const { data, error } = await supabase
      .from("weltkochen_invite_codes")
      .select("*")
      .is("used_by", null)
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

  async function deleteUser(user) {
    if (!supabase || userActionId || !user?.id) return;
    if (user.id === myUserId) return;

    const label = user.display_name || user.username || user.email || "diesen Benutzer";
    const confirmed = window.confirm(
      `Benutzer „${label}“ wirklich dauerhaft löschen?\n\nDer Login und die Bewertungen dieses Benutzers werden gelöscht. Bereits angelegte Rezepte bleiben erhalten.`
    );
    if (!confirmed) return;

    setUserActionId(user.id);
    setUserMessage("");
    setUserError("");

    const { error } = await supabase.rpc("weltkochen_delete_user", {
      p_user_id: user.id,
    });

    if (error) {
      setUserError(error.message);
    } else {
      setUserMessage(`Benutzer „${label}“ wurde dauerhaft gelöscht.`);
      await loadAdminUsers();
    }

    setUserActionId("");
  }

  async function loadDeletedRecipes() {
    if (!supabase) return;
    setTrashLoading(true);
    setTrashError("");

    const { data, error } = await supabase
      .from("weltkochen_recipes")
      .select("id,country,dish,creator_id,creator_username,creator_name,deleted_at,deleted_by")
      .not("deleted_at", "is", null)
      .order("deleted_at", { ascending: false });

    if (error) {
      setDeletedRecipes([]);
      setTrashError(error.message);
      setTrashLoading(false);
      return;
    }

    const deleterIds = [...new Set((data || []).map((recipe) => recipe.deleted_by).filter(Boolean))];
    let deleters = {};

    if (deleterIds.length) {
      const { data: profiles, error: profileError } = await supabase
        .from("weltkochen_profiles")
        .select("id,username,display_name")
        .in("id", deleterIds);

      if (!profileError) {
        deleters = Object.fromEntries((profiles || []).map((profile) => [
          profile.id,
          profile.display_name || profile.username || "Benutzer",
        ]));
      }
    }

    setDeletedRecipes((data || []).map((recipe) => ({
      ...recipe,
      deletedByName: deleters[recipe.deleted_by] || "Unbekannt",
    })));
    setTrashLoading(false);
  }

  async function restoreDeletedRecipe(recipe) {
    if (!recipe?.id || trashActionId) return;
    setTrashActionId(recipe.id);
    setTrashMessage("");
    setTrashError("");

    const { error } = await supabase.rpc("weltkochen_restore_recipe", {
      p_recipe_id: recipe.id,
    });

    if (error) {
      setTrashError(error.message);
    } else {
      setTrashMessage(`„${recipe.dish}“ wurde wiederhergestellt.`);
      await loadDeletedRecipes();
      await onTrashChanged?.();
    }

    setTrashActionId("");
  }

  async function finalDeleteRecipe(recipe) {
    if (!recipe?.id || trashActionId) return;

    const confirmed = window.confirm(
      `„${recipe.dish}“ endgültig löschen?\n\nDanach kann das Rezept nicht mehr wiederhergestellt werden.`
    );
    if (!confirmed) return;

    setTrashActionId(recipe.id);
    setTrashMessage("");
    setTrashError("");

    const { error } = await supabase.rpc("weltkochen_final_delete_recipe", {
      p_recipe_id: recipe.id,
    });

    if (error) {
      setTrashError(error.message);
    } else {
      setTrashMessage(`„${recipe.dish}“ wurde endgültig gelöscht.`);
      await loadDeletedRecipes();
      await onTrashChanged?.();
    }

    setTrashActionId("");
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

  async function setInviteCodeActive(code, active) {
    if (!supabase || inviteActionCode) return;

    setInviteActionCode(code);
    setInviteMessage("");
    setInviteError("");

    const { error } = await supabase.rpc("weltkochen_set_invite_code_active", {
      p_code: code,
      p_active: active,
    });

    if (error) {
      setInviteError(error.message);
    } else {
      setInviteMessage(active ? `${code} wurde freigegeben.` : `${code} wurde gesperrt.`);
      await loadInviteCodes();
    }

    setInviteActionCode("");
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

  const activityUsers = useMemo(() => {
    const unique = new Map();
    for (const item of activities) {
      const id = String(item.user_id || "");
      if (!unique.has(id)) unique.set(id, item.userName || "System");
    }
    return [...unique.entries()].sort((a, b) => String(a[1]).localeCompare(String(b[1]), "de"));
  }, [activities]);

  const filteredActivities = useMemo(() => {
    return activities.filter((item) => {
      const userMatches = activityUserFilter === "all" || String(item.user_id || "") === activityUserFilter;
      const actionMatches = activityActionFilter === "all" || item.action === activityActionFilter;
      return userMatches && actionMatches;
    });
  }, [activities, activityUserFilter, activityActionFilter]);

  const filteredAdminUsers = useMemo(() => {
    const clean = adminUserSearch.trim().toLocaleLowerCase("de-DE");
    if (!clean) return adminUsers;
    return adminUsers.filter((user) =>
      [user.display_name, user.username, user.email, user.role]
        .filter(Boolean)
        .some((value) => String(value).toLocaleLowerCase("de-DE").includes(clean))
    );
  }, [adminUsers, adminUserSearch]);

  const filteredDeletedRecipes = useMemo(() => {
    const clean = trashSearch.trim().toLocaleLowerCase("de-DE");
    if (!clean) return deletedRecipes;
    return deletedRecipes.filter((recipe) =>
      [recipe.dish, recipe.country, recipe.creator_name, recipe.creator_username, recipe.deletedByName]
        .filter(Boolean)
        .some((value) => String(value).toLocaleLowerCase("de-DE").includes(clean))
    );
  }, [deletedRecipes, trashSearch]);

  return (
    <main className="mx-auto max-w-6xl px-4 py-6 md:px-5 md:py-8">
      <div className="space-y-5 md:space-y-6">
        <div className="rounded-[1.75rem] border border-stone-200 bg-stone-900 p-6 text-white shadow-[0_18px_45px_rgba(0,0,0,.14)]">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-amber-300">Verwaltung</p>
          <h1 className="mt-2 text-3xl font-black tracking-tight md:text-4xl">Admin-Dashboard</h1>
          <p className="mt-2 max-w-2xl text-sm text-stone-300">Benutzer, Inhalte, Papierkorb, Regeln und Aktivitäten an einem Ort.</p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm"><p className="text-xs font-black uppercase tracking-wide text-stone-500">Aktive Benutzer</p><p className="mt-1 text-3xl font-black">{adminStats.users}</p></div>
          <div className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm"><p className="text-xs font-black uppercase tracking-wide text-stone-500">Rezepte</p><p className="mt-1 text-3xl font-black">{adminStats.recipes}</p></div>
          <div className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm"><p className="text-xs font-black uppercase tracking-wide text-stone-500">Im Papierkorb</p><p className="mt-1 text-3xl font-black">{adminStats.deleted}</p></div>
          <div className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm"><p className="text-xs font-black uppercase tracking-wide text-stone-500">Vorschläge</p><p className="mt-1 text-3xl font-black">{adminStats.suggestions}</p></div>
        </div>

        <Card className="border border-stone-200 bg-[#fffaf0]/95 shadow-[0_12px_30px_rgba(76,54,28,.08)]">
          <CardContent className="p-6">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="flex items-center gap-2 text-2xl font-black"><Activity className="h-6 w-6" /> Aktivitätsverlauf</h3>
                <p className="mt-1 text-sm text-stone-600">Die letzten 50 Änderungen an Rezepten und Bewertungen.</p>
              </div>
              <Button type="button" variant="outline" onClick={loadActivities} disabled={activityLoading} className="rounded-xl bg-white">
                Aktualisieren
              </Button>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <label>
                <span className="mb-1 block text-xs font-black uppercase tracking-wide text-stone-500">Benutzer</span>
                <select value={activityUserFilter} onChange={(event) => setActivityUserFilter(event.target.value)} className="w-full rounded-xl border border-stone-300 bg-white p-3 outline-none transition focus:border-amber-500 focus:ring-2 focus:ring-amber-100">
                  <option value="all">Alle Benutzer</option>
                  {activityUsers.map(([id, name]) => <option key={id || "system"} value={id}>{name}</option>)}
                </select>
              </label>
              <label>
                <span className="mb-1 block text-xs font-black uppercase tracking-wide text-stone-500">Aktion</span>
                <select value={activityActionFilter} onChange={(event) => setActivityActionFilter(event.target.value)} className="w-full rounded-xl border border-stone-300 bg-white p-3 outline-none transition focus:border-amber-500 focus:ring-2 focus:ring-amber-100">
                  <option value="all">Alle Aktionen</option>
                  <option value="recipe_created">Rezept erstellt</option>
                  <option value="recipe_updated">Rezept bearbeitet</option>
                  <option value="recipe_deleted">Rezept gelöscht</option>
                  <option value="recipe_restored">Rezept wiederhergestellt</option>
                  <option value="recipe_final_deleted">Rezept endgültig gelöscht</option>
                  <option value="recipe_rated">Rezept bewertet</option>
                </select>
              </label>
            </div>

            <div className="mt-4 max-h-96 overflow-auto rounded-2xl border border-stone-200 bg-white">
              {activityLoading ? (
                <p className="p-4 text-stone-500">Aktivitäten werden geladen...</p>
              ) : filteredActivities.length ? (
                <div className="divide-y divide-stone-200">
                  {filteredActivities.map((item) => {
                    const actionNames = {
                      recipe_created: "Rezept erstellt",
                      recipe_updated: "Rezept bearbeitet",
                      recipe_deleted: "Rezept gelöscht",
                      recipe_restored: "Rezept wiederhergestellt",
                      recipe_final_deleted: "Rezept endgültig gelöscht",
                      recipe_rated: "Rezept bewertet",
                    };
                    return (
                      <div key={item.id} className="p-3">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <span className="font-black">{actionNames[item.action] || item.action}</span>
                          <span className="text-xs text-stone-500">{new Date(item.created_at).toLocaleString("de-DE")}</span>
                        </div>
                        <p className="mt-1 text-sm text-stone-600">
                          {item.userName}
                          {item.details?.dish ? ` · ${item.details.dish}` : ""}
                          {item.details?.country ? ` · ${item.details.country}` : ""}
                          {item.action === "recipe_rated" && item.details?.rating ? ` · ${item.details.rating}/5 Sterne` : ""}
                        </p>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="p-4 text-stone-500">Keine Aktivitäten für diesen Filter gefunden.</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="border border-stone-200 bg-[#fffaf0]/95 shadow-[0_12px_30px_rgba(76,54,28,.08)]">
          <CardContent className="flex flex-col gap-3 p-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="text-xl font-black tracking-tight md:text-2xl">Datensicherung</h3>
              <p className="mt-1 text-sm text-stone-600">Alle Rezepte, Zutaten, Bewertungen, Vorschläge und Einstellungen als JSON sichern.</p>
            </div>
            <Button type="button" onClick={onExportBackup} className="rounded-xl bg-stone-900 font-black text-white shadow-sm transition hover:bg-stone-800">
              Backup herunterladen
            </Button>
          </CardContent>
        </Card>

        <details  className="group">
          <summary className="mb-3 cursor-pointer list-none rounded-2xl border border-stone-200 bg-white px-5 py-4 font-black shadow-sm transition hover:bg-white">
            Gelöschte Rezepte <span className="float-right text-stone-400 group-open:rotate-180">⌄</span>
          </summary>
        <Card className="border border-stone-200 bg-[#fffaf0]/95 shadow-[0_12px_30px_rgba(76,54,28,.08)]">
          <CardContent className="p-6">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h3 className="text-xl font-black tracking-tight md:text-2xl">Gelöschte Rezepte</h3>
                <p className="mt-1 text-sm text-stone-600">
                  Nutzerlöschungen landen zuerst hier. Du kannst sie wiederherstellen oder endgültig löschen.
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                onClick={loadDeletedRecipes}
                disabled={trashLoading}
                className="rounded-xl border-stone-300 bg-white"
              >
                Aktualisieren
              </Button>
            </div>

            <div className="relative mt-4">
              <Search className="absolute left-4 top-3.5 h-5 w-5 text-stone-400" />
              <input
                value={trashSearch}
                onChange={(event) => setTrashSearch(event.target.value)}
                placeholder="Papierkorb nach Rezept, Land oder Benutzer durchsuchen..."
                className="w-full rounded-xl border border-stone-300 bg-white py-3 pl-12 pr-4 outline-none focus:border-amber-500"
              />
            </div>

            {trashMessage && (
              <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-3 text-sm font-semibold text-emerald-800">
                {trashMessage}
              </div>
            )}

            {trashError && (
              <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 p-3 text-sm font-semibold text-red-700">
                {trashError}
              </div>
            )}

            <div className="mt-5 overflow-hidden rounded-2xl border border-stone-200 bg-white">
              {trashLoading ? (
                <p className="p-4 text-stone-500">Papierkorb wird geladen...</p>
              ) : filteredDeletedRecipes.length ? (
                <div className="divide-y divide-stone-200">
                  {filteredDeletedRecipes.map((recipe) => (
                    <div key={recipe.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                      <div className="min-w-0">
                        <div className="font-black">{recipe.dish}</div>
                        <div className="mt-1 text-sm text-stone-500">
                          {recipe.country} · erstellt von {recipe.creator_name || recipe.creator_username || "Unbekannt"}
                        </div>
                        <div className="mt-1 text-xs text-stone-500">
                          Gelöscht von {recipe.deletedByName} · {recipe.deleted_at ? new Date(recipe.deleted_at).toLocaleString("de-DE") : "—"}
                        </div>
                      </div>

                      <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
                        <Button
                          type="button"
                          variant="outline"
                          disabled={trashActionId === recipe.id}
                          onClick={() => restoreDeletedRecipe(recipe)}
                          className="w-full rounded-xl border-emerald-300 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 sm:w-auto"
                        >
                          {trashActionId === recipe.id ? "Bitte warten..." : "Wiederherstellen"}
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          disabled={trashActionId === recipe.id}
                          onClick={() => finalDeleteRecipe(recipe)}
                          className="w-full rounded-xl border-red-300 bg-red-50 text-red-700 hover:bg-red-100 sm:w-auto"
                        >
                          Endgültig löschen
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="p-4 text-stone-500">Keine passenden gelöschten Rezepte gefunden.</p>
              )}
            </div>
          </CardContent>
        </Card>
        </details>

        <details  className="group">
          <summary className="mb-3 cursor-pointer list-none rounded-2xl border border-stone-200 bg-white px-5 py-4 font-black shadow-sm transition hover:bg-white">
            Admin-Bereich <span className="float-right text-stone-400 group-open:rotate-180">⌄</span>
          </summary>
        <Card className="border border-stone-200 bg-[#fffaf0]/95 shadow-[0_12px_30px_rgba(76,54,28,.08)]">
          <CardContent className="p-6">
            <h2 className="text-3xl font-black tracking-tight md:text-4xl">Admin-Bereich</h2>
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
                className="mt-1 w-full rounded-xl border border-stone-300 bg-white p-3 outline-none transition focus:border-amber-500 focus:ring-2 focus:ring-amber-100 outline-none transition focus:border-amber-500 focus:ring-2 focus:ring-amber-100"
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
                className="mt-1 w-full rounded-xl border border-stone-300 bg-white p-3 outline-none transition focus:border-amber-500 focus:ring-2 focus:ring-amber-100 outline-none transition focus:border-amber-500 focus:ring-2 focus:ring-amber-100"
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
        </details>

        <details open className="group">
          <summary className="mb-3 cursor-pointer list-none rounded-2xl border border-stone-200 bg-white px-5 py-4 font-black shadow-sm transition hover:bg-white">
            Benutzerverwaltung <span className="float-right text-stone-400 group-open:rotate-180">⌄</span>
          </summary>
        <Card className="border border-stone-200 bg-[#fffaf0]/95 shadow-[0_12px_30px_rgba(76,54,28,.08)]">
          <CardContent className="p-6">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h3 className="text-xl font-black tracking-tight md:text-2xl">Benutzerverwaltung</h3>
                <p className="mt-1 text-sm text-stone-600">
                  Benutzer sperren, wieder freigeben oder dauerhaft löschen.
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

            <div className="relative mt-4">
              <Search className="absolute left-4 top-3.5 h-5 w-5 text-stone-400" />
              <input
                value={adminUserSearch}
                onChange={(event) => setAdminUserSearch(event.target.value)}
                placeholder="Benutzer nach Name, Benutzername oder E-Mail suchen..."
                className="w-full rounded-xl border border-stone-300 bg-white py-3 pl-12 pr-4 outline-none focus:border-amber-500"
              />
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
              ) : filteredAdminUsers.length ? (
                <div className="divide-y divide-stone-200">
                  {filteredAdminUsers.map((user) => {
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

                        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
                          <Button
                            type="button"
                            variant={isBlocked ? "outline" : "destructive"}
                            disabled={isMe || userActionId === user.id}
                            onClick={() => setUserBlocked(user.id, !isBlocked)}
                            className={`w-full rounded-xl sm:w-auto ${
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

                          {!isMe && (
                            <Button
                              type="button"
                              variant="outline"
                              disabled={userActionId === user.id}
                              onClick={() => deleteUser(user)}
                              className="w-full rounded-xl border-red-300 bg-red-50 text-red-700 hover:bg-red-100 sm:w-auto"
                            >
                              {userActionId === user.id ? "Bitte warten..." : "Löschen"}
                            </Button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="p-4 text-stone-500">Keine passenden Benutzer gefunden.</p>
              )}
            </div>
          </CardContent>
        </Card>
        </details>

        <details  className="group">
          <summary className="mb-3 cursor-pointer list-none rounded-2xl border border-stone-200 bg-white px-5 py-4 font-black shadow-sm transition hover:bg-white">
            Einladungscodes <span className="float-right text-stone-400 group-open:rotate-180">⌄</span>
          </summary>
        <Card className="border border-stone-200 bg-[#fffaf0]/95 shadow-[0_12px_30px_rgba(76,54,28,.08)]">
          <CardContent className="p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="text-xl font-black tracking-tight md:text-2xl">Einladungscodes</h3>
                <p className="mt-1 text-sm text-stone-600">
                  Neue Benutzer benötigen einen freien Einladungscode.
                </p>
              </div>

              <Button
                onClick={createInviteCode}
                disabled={inviteBusy}
                className="rounded-xl bg-stone-900 px-5 py-5 font-black text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-stone-800 hover:shadow-md"
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
                    const active = invite.active !== false;
                    return (
                      <div
                        key={invite.code}
                        className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between"
                      >
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <div className="font-mono text-lg font-black">{invite.code}</div>
                            <span className={`rounded-full px-2 py-1 text-xs font-bold ${
                              active
                                ? "bg-emerald-100 text-emerald-700"
                                : "bg-red-100 text-red-700"
                            }`}>
                              {active ? "Aktiv" : "Gesperrt"}
                            </span>
                          </div>
                          <div className="mt-1 text-sm text-stone-500">
                            {invite.created_at
                              ? `Erstellt ${new Date(invite.created_at).toLocaleDateString("de-DE")}`
                              : ""}
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-2">
                          {active && (
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => copyInviteCode(invite.code)}
                              className="rounded-xl border-stone-300 bg-white"
                            >
                              Kopieren
                            </Button>
                          )}

                          <Button
                            type="button"
                            variant="outline"
                            disabled={inviteActionCode === invite.code}
                            onClick={() => setInviteCodeActive(invite.code, !active)}
                            className={`rounded-xl ${
                              active
                                ? "border-red-300 bg-red-50 text-red-700 hover:bg-red-100"
                                : "border-emerald-300 bg-emerald-50 text-emerald-800 hover:bg-emerald-100"
                            }`}
                          >
                            {inviteActionCode === invite.code
                              ? "Bitte warten..."
                              : active
                                ? "Sperren"
                                : "Entsperren"}
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="p-4 text-stone-500">
                  Keine freien Einladungscodes vorhanden.
                </p>
              )}
            </div>
          </CardContent>
        </Card>
        </details>
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
  const [focusCountry, setFocusCountry] = useState("");
  const [discoverMode, setDiscoverMode] = useState("random");
  const [form, setForm] = useState(EMPTY_RECIPE_FORM);
  const [savedFormSignature, setSavedFormSignature] = useState(() => recipeFormSignature(EMPTY_RECIPE_FORM));
  const [suggestionText, setSuggestionText] = useState("");
  const [suggestionDialogOpen, setSuggestionDialogOpen] = useState(false);
  const [openedSuggestion, setOpenedSuggestion] = useState(null);
  const [editingRecipeId, setEditingRecipeId] = useState(null);
  const [openedRecipe, setOpenedRecipe] = useState(null);
  const [page, setPage] = useState("karte");
  const [favoriteRecipeIds, setFavoriteRecipeIds] = useState([]);
  const [shoppingList, setShoppingList] = useState([]);
  const [shoppingListOpen, setShoppingListOpen] = useState(false);
  const [shoppingDraft, setShoppingDraft] = useState({ amount: "", unit: "", name: "" });
  const [mealPlan, setMealPlan] = useState([]);
  const [planDate, setPlanDate] = useState(new Date().toISOString().slice(0, 10));
  const [planRecipeId, setPlanRecipeId] = useState("");
  const [planServings, setPlanServings] = useState(4);
  const [planNote, setPlanNote] = useState("");
  const [planSearch, setPlanSearch] = useState("");
  const [planSearchOpen, setPlanSearchOpen] = useState(false);
  const [weekOffset, setWeekOffset] = useState(0);
  const [selectedRegion, setSelectedRegion] = useState("Alle Kontinente");
  const [collapsedRegions, setCollapsedRegions] = useState({});
  const [imageError, setImageError] = useState("");
  const [importBusy, setImportBusy] = useState(false);
  const [importMessage, setImportMessage] = useState("");
  const [importError, setImportError] = useState("");
  const [tutorialOpen, setTutorialOpen] = useState(false);
  const [tutorialStep, setTutorialStep] = useState(0);
  const [mobileNavTop, setMobileNavTop] = useState(0);

  const tutorialSteps = [
    { icon: "🌍", eyebrow: "Willkommen", title: "Deine kulinarische Weltreise beginnt.", text: "Hier kocht ihr euch Land für Land durch die Welt. Je mehr gute Rezepte ihr sammelt, desto grüner wird eure Karte." },
    { icon: "🗺️", eyebrow: "Die Weltkarte", title: "Jedes Land erzählt eine Geschichte.", text: "Wähle ein Land auf der Karte aus. Farben zeigen dir, wo schon Rezepte vorhanden sind, welche Länder abgeschlossen sind und wo noch Vorschläge warten." },
    { icon: "🍳", eyebrow: "Rezepte", title: "Selbst eintragen oder importieren.", text: "Du kannst Rezepte manuell anlegen oder eine Rezept-URL importieren. Zutaten, Personenanzahl und Mengen werden automatisch mitgedacht." },
    { icon: "⭐", eyebrow: "Bewerten", title: "Gute Rezepte bringen Länder voran.", text: "Bewertet eure Gerichte. Sobald ein Land genug starke Rezepte über der eingestellten Mindestbewertung hat, gilt es als abgeschlossen." },
    { icon: "❤️", eyebrow: "Merken & planen", title: "Favoriten und Kochplan.", text: "Speichere Lieblingsrezepte mit dem Herz und plane sie direkt für bestimmte Tage in deinem Kochplan ein." },
    { icon: "🛒", eyebrow: "Einkaufen", title: "Aus Rezepten wird eine Einkaufsliste.", text: "Zutaten können direkt übernommen werden. Mengen werden zusammengeführt und bei geplanten Gerichten passend zur Personenanzahl berechnet." },
    { icon: "🚀", eyebrow: "Los geht's", title: "Jetzt wird die Welt erkocht.", text: "Such dir ein Land aus, trag das erste Rezept ein und los geht die Reise. Das Tutorial kannst du später jederzeit erneut starten." },
  ];

  const formIsDirty = useMemo(
    () => recipeFormSignature(form) !== savedFormSignature,
    [form, savedFormSignature],
  );

  function friendlyError(error, fallback) {
    const text = String(error?.message || error || "").toLocaleLowerCase("de-DE");
    if (text.includes("network") || text.includes("fetch")) return "Keine Verbindung zum Online-Speicher. Bitte prüfe deine Internetverbindung.";
    if (text.includes("permission") || text.includes("policy") || text.includes("row-level")) return "Diese Aktion ist für dein Konto nicht freigegeben.";
    if (text.includes("duplicate") || text.includes("unique")) return "Dieser Eintrag ist bereits vorhanden.";
    if (text.includes("timeout")) return "Die Anfrage hat zu lange gedauert. Bitte versuche es erneut.";
    return fallback;
  }

  function navigateTo(nextPage) {
    if (page === "details" && nextPage !== "details" && formIsDirty) {
      const leave = window.confirm("Du hast ungespeicherte Änderungen am Rezept. Trotzdem verlassen?");
      if (!leave) return;
    }
    setPage(nextPage);
  }

  useEffect(() => {
    const beforeUnload = (event) => {
      if (!formIsDirty) return;
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", beforeUnload);
    return () => window.removeEventListener("beforeunload", beforeUnload);
  }, [formIsDirty]);

  useEffect(() => {
    let raf = 0;

    const updateMobileNavPosition = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const viewport = window.visualViewport;
        const top = viewport
          ? viewport.pageTop + viewport.height - 78
          : window.scrollY + window.innerHeight - 78;
        setMobileNavTop(Math.max(0, top));
      });
    };

    updateMobileNavPosition();
    window.addEventListener("scroll", updateMobileNavPosition, { passive: true });
    window.addEventListener("resize", updateMobileNavPosition);
    window.visualViewport?.addEventListener("scroll", updateMobileNavPosition);
    window.visualViewport?.addEventListener("resize", updateMobileNavPosition);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", updateMobileNavPosition);
      window.removeEventListener("resize", updateMobileNavPosition);
      window.visualViewport?.removeEventListener("scroll", updateMobileNavPosition);
      window.visualViewport?.removeEventListener("resize", updateMobileNavPosition);
    };
  }, []);

  useEffect(() => {
    if (!currentUser?.id) return;
    const tutorialKey = `weltkochen_tutorial_seen_${currentUser.id}`;
    if (!window.localStorage.getItem(tutorialKey)) {
      setTutorialStep(0);
      setTutorialOpen(true);
    }
  }, [currentUser?.id]);

  function closeTutorial(markSeen = true) {
    if (markSeen && currentUser?.id) {
      window.localStorage.setItem(`weltkochen_tutorial_seen_${currentUser.id}`, "1");
    }
    setTutorialOpen(false);
  }

  function restartTutorial() {
    setTutorialStep(0);
    setTutorialOpen(true);
  }

  useEffect(() => {
    let cancelled = false;
    async function boot() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session && !cancelled) {
          const profile = await getMyProfile();
          setCurrentUser(profile);
          const [cloud, content, favoritesResult, shoppingResult, mealPlanResult] = await Promise.all([
            loadCloudState().catch(() => null),
            loadNormalizedContent(),
            supabase.from("weltkochen_favorites").select("recipe_id"),
            supabase.from("weltkochen_shopping_items").select("id,recipe_id,recipe_name,amount,unit,name,checked,source_key,created_at").order("created_at", { ascending: true }),
            supabase.from("weltkochen_meal_plan").select("id,plan_date,recipe_id,servings,note,created_at").order("plan_date", { ascending: true }),
          ]);
          if (!cancelled) {
            if (cloud?.settings) setSettings(cloud.settings);
            setRecipes(content.recipes);
            setSuggestions(content.suggestions);
            setFavoriteRecipeIds((favoritesResult.data || []).map((item) => item.recipe_id));
      setShoppingList((shoppingResult.data || []).map((item) => ({
        id: item.id,
        recipeId: item.recipe_id,
        recipeName: item.recipe_name,
        amount: item.amount == null ? "" : Number(item.amount),
        unit: item.unit || "",
        name: item.name,
        checked: Boolean(item.checked),
        sourceKey: item.source_key || null,
      })));
      setMealPlan(mealPlanResult.data || []);
            setShoppingList((shoppingResult.data || []).map((item) => ({
              id: item.id,
              recipeId: item.recipe_id,
              recipeName: item.recipe_name,
              amount: item.amount == null ? "" : Number(item.amount),
              unit: item.unit || "",
              name: item.name,
              checked: Boolean(item.checked),
              sourceKey: item.source_key || null,
            })));
            setMealPlan(mealPlanResult.data || []);
          }
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
    saveSettings(settings);
  }, [settings]);

  useEffect(() => {
    setEditingRecipeId(null);
    setForm({ dish: "", category: "Hauptgericht", sourceUrl: "", servings: 4, ingredients: [{ amount: "", unit: "", name: "" }], recipe: "", notes: "", image: "" });
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
  const filteredCountries = useMemo(() => {
    const clean = query.trim().toLocaleLowerCase("de-DE");
    if (!clean) return countries;
    return countries
      .filter((country) => country.toLocaleLowerCase("de-DE").includes(clean))
      .sort((a, b) => {
        const aName = a.toLocaleLowerCase("de-DE");
        const bName = b.toLocaleLowerCase("de-DE");
        const aStarts = aName.startsWith(clean) ? 0 : 1;
        const bStarts = bName.startsWith(clean) ? 0 : 1;
        return aStarts - bStarts || a.localeCompare(b, "de");
      });
  }, [query]);

  function chooseCountryFromSearch(country, jumpToForm = false) {
    setSelected(country);
    setFocusCountry("");
    window.setTimeout(() => setFocusCountry(country), 0);
    setQuery(country);
    if (jumpToForm) window.setTimeout(() => {
      document.getElementById("recipe-entry-card")?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 120);
  }
  const activeCountry = selected;
  const activeRecipes = Array.isArray(recipes[activeCountry]) ? recipes[activeCountry] : [];
  const activeQualifiedCount = getQualifiedRecipesCount(activeRecipes, settings.minAverageRatingForCompletion);
  const activeCountryComplete = activeQualifiedCount >= settings.requiredRecipesPerCountry;
  const activeRatedValues = activeRecipes
    .map((recipe) => getRecipeAverage(recipe))
    .filter((value) => value !== "–")
    .map(Number)
    .filter(Number.isFinite);
  const activeCountryAverage = activeRatedValues.length
    ? (activeRatedValues.reduce((sum, value) => sum + value, 0) / activeRatedValues.length).toFixed(1)
    : "–";
  const planRecipeMatches = useMemo(() => {
    const clean = planSearch.trim().toLocaleLowerCase("de-DE");
    if (!clean) return [];

    return recipeEntries
      .map(([country, recipe]) => {
        const dish = String(recipe.dish || "").toLocaleLowerCase("de-DE");
        const countryName = String(country || "").toLocaleLowerCase("de-DE");
        const category = String(recipe.category || "").toLocaleLowerCase("de-DE");
        let score = 10;
        if (dish === clean) score = 0;
        else if (countryName === clean) score = 1;
        else if (dish.startsWith(clean)) score = 2;
        else if (countryName.startsWith(clean)) score = 3;
        else if (dish.includes(clean)) score = 4;
        else if (countryName.includes(clean)) score = 5;
        else if (category.includes(clean)) score = 6;
        return { country, recipe, score };
      })
      .filter((entry) => entry.score < 10)
      .sort((a, b) => a.score - b.score || a.recipe.dish.localeCompare(b.recipe.dish, "de"))
      .slice(0, 10);
  }, [recipeEntries, planSearch]);

  const currentWeekDays = useMemo(() => {
    const today = new Date();
    const day = today.getDay() || 7;
    const monday = new Date(today);
    monday.setHours(12, 0, 0, 0);
    monday.setDate(today.getDate() - day + 1 + (weekOffset * 7));
    return Array.from({ length: 7 }, (_, index) => {
      const date = new Date(monday);
      date.setDate(monday.getDate() + index);
      return {
        date,
        iso: date.toISOString().slice(0, 10),
        label: date.toLocaleDateString("de-DE", { weekday: "short" }),
        dayLabel: date.toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit" }),
      };
    });
  }, [weekOffset]);

  const weeklyPlanEntries = useMemo(() => {
    const start = currentWeekDays[0]?.iso;
    const endDate = currentWeekDays[6]?.iso;
    return mealPlan.filter((entry) => entry.plan_date >= start && entry.plan_date <= endDate);
  }, [mealPlan, currentWeekDays]);

  const combinedShoppingItems = useMemo(() => combineShoppingItems(shoppingList), [shoppingList]);

  const groupedShoppingItems = useMemo(() => {
    return combinedShoppingItems.reduce((groups, item) => {
      if (!groups[item.category]) groups[item.category] = [];
      groups[item.category].push(item);
      return groups;
    }, {});
  }, [combinedShoppingItems]);
  const visibleRecipes = useMemo(() => filterRecipesForTable(recipeEntries, query, activeCountry), [recipeEntries, query, activeCountry]);

  const topRecipeEntry = useMemo(() => {
    const ratedRecipes = recipeEntries
      .map(([country, recipe]) => {
        const ratingValues = Object.values(recipe.ratings || {})
          .map(Number)
          .filter((value) => Number.isFinite(value) && value > 0);
        const average = ratingValues.length
          ? ratingValues.reduce((sum, value) => sum + value, 0) / ratingValues.length
          : null;

        return {
          country,
          recipe,
          average,
          ratingCount: ratingValues.length,
        };
      })
      .filter((entry) => entry.average !== null)
      .sort((a, b) =>
        b.average - a.average ||
        b.ratingCount - a.ratingCount ||
        a.recipe.dish.localeCompare(b.recipe.dish, "de")
      );

    if (!ratedRecipes.length) return null;
    const winner = ratedRecipes[0];
    return [winner.country, winner.recipe, winner.average, winner.ratingCount];
  }, [recipeEntries]);

  const nextCountrySuggestion = useMemo(() => {
    const candidates = countries
      .map((country) => {
        const list = Array.isArray(recipes[country]) ? recipes[country] : [];
        return {
          country,
          count: getQualifiedRecipesCount(list, settings.minAverageRatingForCompletion),
          total: list.length,
        };
      })
      .filter((item) => item.count < settings.requiredRecipesPerCountry)
      .sort((a, b) => b.count - a.count || b.total - a.total || a.country.localeCompare(b.country, "de"));
    return candidates[0] || null;
  }, [recipes, settings.requiredRecipesPerCountry, settings.minAverageRatingForCompletion]);

  function showRandomRecipe() {
    if (!recipeEntries.length) return;
    const [country, recipe] = recipeEntries[Math.floor(Math.random() * recipeEntries.length)];
    setSelected(country);
    setFocusCountry("");
    window.setTimeout(() => setFocusCountry(country), 0);
    openRecipe(recipe, country);
  }

  function showTopRecipe() {
    if (!topRecipeEntry) return;
    const [country, recipe] = topRecipeEntry;
    setSelected(country);
    setFocusCountry("");
    window.setTimeout(() => setFocusCountry(country), 0);
    openRecipe(recipe, country);
  }

  function showNextCountry() {
    if (!nextCountrySuggestion) return;
    const country = nextCountrySuggestion.country;
    setSelected(country);
    setFocusCountry("");
    setQuery("");
    window.setTimeout(() => setFocusCountry(country), 0);
  }

  if (!cloudLoaded) {
    return (
      <div className="min-h-screen bg-[#f7edda] p-5 text-stone-800">
        <div className="mx-auto max-w-7xl animate-pulse">
          <div className="flex items-center gap-4 border-b-2 border-stone-300 pb-5">
            <div className="h-14 w-14 rounded-full bg-stone-200" />
            <div className="space-y-2">
              <div className="h-6 w-56 rounded bg-stone-200" />
              <div className="h-4 w-72 max-w-full rounded bg-stone-200" />
            </div>
          </div>
          <div className="mt-8 grid gap-6 lg:grid-cols-[1.6fr_.9fr]">
            <div className="h-[58vh] rounded-[2rem] bg-stone-200" />
            <div className="space-y-4">
              <div className="h-14 rounded-2xl bg-stone-200" />
              <div className="h-40 rounded-[2rem] bg-stone-200" />
              <div className="h-48 rounded-[2rem] bg-stone-200" />
            </div>
          </div>
          <p className="mt-5 text-center text-sm font-semibold text-stone-500">Online-Daten werden geladen…</p>
        </div>
      </div>
    );
  }

  if (!currentUser) return <AuthScreen onLogin={async (user) => {
    setCurrentUser(user);
    try {
      const [content, favoritesResult, shoppingResult, mealPlanResult] = await Promise.all([
        loadNormalizedContent(),
        supabase.from("weltkochen_favorites").select("recipe_id"),
        supabase.from("weltkochen_shopping_items").select("id,recipe_id,recipe_name,amount,unit,name,checked,source_key,created_at").order("created_at", { ascending: true }),
        supabase.from("weltkochen_meal_plan").select("id,plan_date,recipe_id,servings,note,created_at").order("plan_date", { ascending: true }),
      ]);
      setRecipes(content.recipes);
      setSuggestions(content.suggestions);
      setFavoriteRecipeIds((favoritesResult.data || []).map((item) => item.recipe_id));
    } catch (error) {
      setStorageError(error instanceof Error ? error.message : "Rezepte konnten nicht geladen werden.");
    }
    setPage(user?.role === "admin" ? "admin" : "karte");
  }} storageError={storageError} />;

  async function loadShoppingList() {
    if (!supabase || !currentUser?.id) return;
    const { data, error } = await supabase
      .from("weltkochen_shopping_items")
      .select("id,recipe_id,recipe_name,amount,unit,name,checked,source_key,created_at")
      .order("created_at", { ascending: true });
    if (!error) {
      setShoppingList((data || []).map((item) => ({
        id: item.id,
        recipeId: item.recipe_id,
        recipeName: item.recipe_name,
        amount: item.amount == null ? "" : Number(item.amount),
        unit: item.unit || "",
        name: item.name,
        checked: Boolean(item.checked),
        sourceKey: item.source_key || null,
      })));
    }
  }

  async function loadMealPlan() {
    if (!supabase || !currentUser?.id) return;
    const { data, error } = await supabase
      .from("weltkochen_meal_plan")
      .select("id,plan_date,recipe_id,servings,note,created_at")
      .order("plan_date", { ascending: true });
    if (!error) setMealPlan(data || []);
  }

  async function logout() {
    await supabase.auth.signOut();
    setCurrentUser(null);
    setPage("karte");
  }

  async function updateSettings(nextSettings) {
    setSettings(nextSettings);
    saveSettings(nextSettings);
    if (ONLINE_STORAGE_ENABLED) await saveCloudState({ settings: nextSettings });
  }

  function openRecipe(recipe, country) {
    setOpenedRecipe({ ...recipe, country });
  }

  function closeRecipe() {
    setOpenedRecipe(null);
  }

  async function toggleFavorite(recipe) {
    if (!recipe?.id || !currentUser?.id) return;
    const isFavorite = favoriteRecipeIds.includes(recipe.id);
    if (isFavorite) {
      const { error } = await supabase.from("weltkochen_favorites").delete().eq("user_id", currentUser.id).eq("recipe_id", recipe.id);
      if (!error) setFavoriteRecipeIds((current) => current.filter((id) => id !== recipe.id));
    } else {
      const { error } = await supabase.from("weltkochen_favorites").insert({ user_id: currentUser.id, recipe_id: recipe.id });
      if (!error) setFavoriteRecipeIds((current) => [...current, recipe.id]);
    }
  }

  async function addRecipeToShoppingList(recipe, servings) {
    const baseServings = Number(recipe?.servings) || 4;
    const scale = Math.max(1, Number(servings) || baseServings) / baseServings;
    const additions = cleanIngredientRows(recipe?.ingredients).map((item) => ({
      user_id: currentUser.id,
      recipe_id: recipe.id,
      recipe_name: recipe.dish,
      amount: item.amount === "" ? null : Number(item.amount) * scale,
      unit: item.unit || "",
      name: item.name,
      checked: false,
    }));
    if (!additions.length) return;
    const { error } = await supabase.from("weltkochen_shopping_items").insert(additions);
    if (error) {
      setStorageError(error.message);
      return;
    }
    await loadShoppingList();
    setShoppingListOpen(true);
  }

  async function toggleShoppingItem(id) {
    const item = shoppingList.find((entry) => entry.id === id);
    if (!item) return;
    const { error } = await supabase
      .from("weltkochen_shopping_items")
      .update({ checked: !item.checked })
      .eq("id", id);
    if (!error) await loadShoppingList();
  }

  async function addManualShoppingItem() {
    const name = shoppingDraft.name.trim();
    if (!name) return;
    const amount = shoppingDraft.amount === "" ? null : Number(shoppingDraft.amount);
    const { error } = await supabase.from("weltkochen_shopping_items").insert({
      user_id: currentUser.id,
      recipe_id: null,
      recipe_name: "Manuell",
      amount: Number.isFinite(amount) ? amount : null,
      unit: shoppingDraft.unit.trim(),
      name,
      checked: false,
      source_key: null,
    });
    if (error) {
      setStorageError("Eintrag konnte nicht gespeichert werden.");
      return;
    }
    setShoppingDraft({ amount: "", unit: "", name: "" });
    await loadShoppingList();
  }

  async function editCombinedShoppingItem(item) {
    const name = window.prompt("Bezeichnung", item.name);
    if (name === null || !name.trim()) return;
    const amountText = window.prompt("Menge", item.amount === "" || item.amount == null ? "" : String(item.amount));
    if (amountText === null) return;
    const unit = window.prompt("Einheit", item.unit || "");
    if (unit === null) return;

    const firstId = item.ids[0];
    const restIds = item.ids.slice(1);
    const numericAmount = amountText.trim() === "" ? null : Number(amountText.replace(",", "."));

    const { error } = await supabase
      .from("weltkochen_shopping_items")
      .update({
        name: name.trim(),
        amount: Number.isFinite(numericAmount) ? numericAmount : null,
        unit: unit.trim(),
        source_key: null,
      })
      .eq("id", firstId);

    if (error) {
      setStorageError("Eintrag konnte nicht geändert werden.");
      return;
    }

    if (restIds.length) {
      await supabase.from("weltkochen_shopping_items").delete().in("id", restIds);
    }
    await loadShoppingList();
  }

  async function deleteCombinedShoppingItem(item) {
    if (!window.confirm(`${item.name} von der Einkaufsliste löschen?`)) return;
    const { error } = await supabase.from("weltkochen_shopping_items").delete().in("id", item.ids);
    if (!error) await loadShoppingList();
  }

  async function clearShoppingList() {
    if (!shoppingList.length) return;
    if (!window.confirm("Einkaufsliste wirklich leeren?")) return;
    const { error } = await supabase
      .from("weltkochen_shopping_items")
      .delete()
      .eq("user_id", currentUser.id);
    if (!error) await loadShoppingList();
  }

  function openPlanForRecipe(recipe, servings) {
    setPlanRecipeId(recipe.id);
    setPlanSearch(recipe.dish);
    setPlanServings(Math.max(1, Number(servings) || Number(recipe.servings) || 4));
    setPage("kochplan");
    setOpenedRecipe(null);
  }

  async function addMealPlanEntry() {
    if (!planDate || !planRecipeId) return;
    const { error } = await supabase.from("weltkochen_meal_plan").upsert({
      user_id: currentUser.id,
      plan_date: planDate,
      recipe_id: planRecipeId,
      servings: Math.max(1, Number(planServings) || 4),
      note: planNote.trim(),
    }, { onConflict: "user_id,plan_date,recipe_id" });

    if (error) {
      setStorageError(error.message);
      return;
    }
    setPlanNote("");
    setPlanSearch("");
    setPlanRecipeId("");
    setPlanSearchOpen(false);
    await loadMealPlan();
  }

  async function removeMealPlanEntry(id) {
    const { error } = await supabase.from("weltkochen_meal_plan").delete().eq("id", id);
    if (!error) await loadMealPlan();
  }

  async function addPlannedMealToShoppingList(entry) {
    const pair = recipeEntries.find(([, recipe]) => recipe.id === entry.recipe_id);
    if (!pair) return;
    await addRecipeToShoppingList(pair[1], entry.servings);
  }


  async function addWeekToShoppingList() {
    const additions = [];
    for (const entry of weeklyPlanEntries) {
      const pair = recipeEntries.find(([, recipe]) => recipe.id === entry.recipe_id);
      const recipe = pair?.[1];
      if (!recipe) continue;
      const baseServings = Number(recipe.servings) || 4;
      const scale = Math.max(1, Number(entry.servings) || baseServings) / baseServings;
      for (const item of cleanIngredientRows(recipe.ingredients)) {
        additions.push({
          user_id: currentUser.id,
          recipe_id: recipe.id,
          recipe_name: recipe.dish,
          amount: item.amount === "" ? null : Number(item.amount) * scale,
          unit: item.unit || "",
          name: item.name,
          checked: false,
          source_key: `week:${entry.id}:${normalizeIngredientName(item.name)}:${unitFamily(item.unit)}`,
        });
      }
    }

    if (!additions.length) {
      window.alert("Für diese Woche sind noch keine Rezepte mit Zutaten geplant.");
      return;
    }

    const { error } = await supabase
      .from("weltkochen_shopping_items")
      .upsert(additions, { onConflict: "user_id,source_key", ignoreDuplicates: true });
    if (error) {
      setStorageError(error.message);
      return;
    }
    await loadShoppingList();
    setShoppingListOpen(true);
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
      if (file.size > 10 * 1024 * 1024) throw new Error("Das Bild darf maximal 10 MB groß sein.");
      const extension = (file.name.split(".").pop() || "jpg").toLowerCase().replace(/[^a-z0-9]/g, "");
      const path = `${currentUser.id}/${Date.now()}-${Math.random().toString(16).slice(2)}.${extension || "jpg"}`;
      const { error: uploadError } = await supabase.storage.from("recipe-images").upload(path, file, { cacheControl: "3600", upsert: false });
      if (uploadError) throw uploadError;
      const { data: publicData } = supabase.storage.from("recipe-images").getPublicUrl(path);
      setForm((current) => ({ ...current, image: publicData.publicUrl }));
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

  async function importRecipeFromLink() {
    const url = String(form.sourceUrl || "").trim();
    setImportMessage("");
    setImportError("");
    if (!url) {
      setImportError("Bitte zuerst einen Rezept-Link einfügen.");
      return;
    }
    if (!supabase) {
      setImportError("Supabase ist nicht verbunden.");
      return;
    }

    setImportBusy(true);
    try {
      const { data, error } = await supabase.functions.invoke("import-recipe", {
        body: { url },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      if (!data?.ok) {
        setForm((current) => ({ ...current, sourceUrl: data?.sourceUrl || url }));
        setImportMessage(data?.message || "Der Link wurde gespeichert. Die Felder müssen manuell ausgefüllt werden.");
        return;
      }

      const importedIngredients = (Array.isArray(data.ingredients) ? data.ingredients : []).map((item) => ({
        amount: ingredientAmountToNumber(item?.amount),
        unit: String(item?.unit || ""),
        name: String(item?.name || ""),
      })).filter((item) => item.name);

      const importedCategory = recipeCategories.includes(data.category) ? data.category : form.category;

      setForm((current) => ({
        ...current,
        sourceUrl: data.sourceUrl || url,
        dish: data.title || current.dish,
        image: data.image || current.image,
        servings: Number(data.servings) || current.servings || 4,
        ingredients: importedIngredients.length ? importedIngredients : current.ingredients,
        recipe: data.instructions || current.recipe,
        notes: data.description || current.notes,
        category: importedCategory || "Hauptgericht",
      }));
      setImportMessage("Rezeptdaten wurden übernommen. Bitte kurz prüfen und danach speichern.");
    } catch (error) {
      setImportError(error instanceof Error ? error.message : "Rezept konnte nicht importiert werden.");
    } finally {
      setImportBusy(false);
    }
  }

  function updateIngredient(index, field, value) {
    setForm((current) => ({
      ...current,
      ingredients: (Array.isArray(current.ingredients) ? current.ingredients : []).map((item, itemIndex) =>
        itemIndex === index ? { ...item, [field]: value } : item
      ),
    }));
  }

  function addIngredientRow() {
    setForm((current) => ({
      ...current,
      ingredients: [...(Array.isArray(current.ingredients) ? current.ingredients : []), { amount: "", unit: "", name: "" }],
    }));
  }

  function removeIngredientRow(index) {
    setForm((current) => {
      const next = (Array.isArray(current.ingredients) ? current.ingredients : []).filter((_, itemIndex) => itemIndex !== index);
      return { ...current, ingredients: next.length ? next : [{ amount: "", unit: "", name: "" }] };
    });
  }

  async function saveRecipe() {
    if (!form.dish.trim()) return;
    setStorageError("");
    const ingredients = cleanIngredientRows(form.ingredients);
    const recipeId = editingRecipeId || `${selected}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
    const existing = editingRecipeId ? (Array.isArray(recipes[selected]) ? recipes[selected] : []).find((recipe) => recipe.id === editingRecipeId) : null;
    const row = {
      id: recipeId, country: selected, dish: form.dish.trim(), category: form.category || "Hauptgericht",
      source_url: form.sourceUrl || "", servings: Math.max(1, Number(form.servings) || 4),
      instructions: form.recipe || "", notes: form.notes || "", image_url: form.image || "",
      creator_id: existing?.creatorId || currentUser.id, creator_username: existing?.createdBy || currentUser.username,
      creator_name: existing?.createdByName || currentUser.displayName, updated_at: new Date().toISOString(),
    };
    try {
      const { error: recipeError } = await supabase.from("weltkochen_recipes").upsert(row);
      if (recipeError) throw recipeError;
      const { error: deleteError } = await supabase.from("weltkochen_ingredients").delete().eq("recipe_id", recipeId);
      if (deleteError) throw deleteError;
      if (ingredients.length) {
        const { error: ingredientError } = await supabase.from("weltkochen_ingredients").insert(
          ingredients.map((item, position) => ({ recipe_id: recipeId, position, amount: item.amount === "" ? null : Number(item.amount), unit: item.unit || "", name: item.name }))
        );
        if (ingredientError) throw ingredientError;
      }
      const content = await loadNormalizedContent();
      setRecipes(content.recipes); setSuggestions(content.suggestions);
      setForm(EMPTY_RECIPE_FORM);
      setSavedFormSignature(recipeFormSignature(EMPTY_RECIPE_FORM));
      setImageError(""); setEditingRecipeId(null);
    } catch (error) {
      setStorageError(friendlyError(error, "Rezept konnte nicht gespeichert werden. Bitte versuche es erneut."));
    }
  }

  const deletePuzzles = [
    { question: "Was ist 2 + 3?", answer: "5" },
    { question: "Was ist 10 - 4?", answer: "6" },
    { question: "Was ist 3 × 3?", answer: "9" },
    { question: "Was ist 12 ÷ 3?", answer: "4" },
    { question: "Wie viele Tage hat eine Woche?", answer: "7" },
    { question: "Wie viele Monate hat ein Jahr?", answer: "12" },
    { question: "Welche Farbe entsteht aus Blau und Gelb?", answer: "grün" },
    { question: "Wie viele Beine hat eine Spinne?", answer: "8" },
    { question: "Was ist 5 + 5?", answer: "10" },
    { question: "Was ist 9 - 2?", answer: "7" },
    { question: "Was ist 4 × 2?", answer: "8" },
    { question: "Was ist 15 ÷ 5?", answer: "3" },
    { question: "Welcher Tag kommt nach Montag?", answer: "dienstag" },
    { question: "Welche Jahreszeit kommt nach dem Sommer?", answer: "herbst" },
    { question: "Wie viele Stunden hat ein Tag?", answer: "24" },
    { question: "Was ist 1 + 6?", answer: "7" },
    { question: "Was ist 20 - 10?", answer: "10" },
    { question: "Was ist 6 ÷ 2?", answer: "3" },
    { question: "Wie viele Minuten hat eine Stunde?", answer: "60" },
    { question: "Welche Zahl kommt nach 19?", answer: "20" },
  ];

  function normalizePuzzleAnswer(value) {
    return String(value || "")
      .trim()
      .toLocaleLowerCase("de-DE")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");
  }

  async function startDeleteRecipeChallenge(recipe = null) {
    let target = recipe;

    if (!target && editingRecipeId) {
      target = (Array.isArray(recipes[selected]) ? recipes[selected] : []).find((item) => item.id === editingRecipeId) || {
        id: editingRecipeId,
        country: selected,
        dish: form.dish || "Rezept",
      };
    }

    if (!target?.id) {
      clearRecipe();
      return;
    }

    const puzzle = deletePuzzles[Math.floor(Math.random() * deletePuzzles.length)];
    const answer = window.prompt(
      `Sicherheitsfrage vor dem Löschen:\n\n${puzzle.question}\n\nErst bei richtiger Antwort wird „${target.dish || "das Rezept"}“ gelöscht.`
    );

    if (answer === null) return;

    if (normalizePuzzleAnswer(answer) !== normalizePuzzleAnswer(puzzle.answer)) {
      window.alert("Antwort ist nicht richtig. Das Rezept wurde NICHT gelöscht.");
      return;
    }

    try {
      const { data: deleteResult, error } = await supabase.rpc("weltkochen_soft_delete_recipe", {
        p_recipe_id: target.id,
      });

      if (error) throw error;

      const content = await loadNormalizedContent();
      setRecipes(content.recipes);
      setSuggestions(content.suggestions);

      if (openedRecipe?.id === target.id) setOpenedRecipe(null);

      if (editingRecipeId === target.id) {
        setEditingRecipeId(null);
        setForm({
          dish: "",
          category: "Hauptgericht",
          sourceUrl: "",
          servings: 4,
          ingredients: [{ amount: "", unit: "", name: "" }],
          recipe: "",
          notes: "",
          image: "",
        });
        setImageError("");
      }

      const remaining = deleteResult?.remainingToday;
      window.alert(
        remaining === null || remaining === undefined
          ? "Rezept wurde in den Admin-Papierkorb verschoben."
          : `Rezept wurde in den Admin-Papierkorb verschoben. Du kannst heute noch ${remaining} Rezept${remaining === 1 ? "" : "e"} löschen.`
      );
    } catch (error) {
      setStorageError(error instanceof Error ? error.message : "Rezept konnte nicht gelöscht werden.");
    }
  }

  function clearRecipe() {
    setForm({
      dish: "",
      category: "Hauptgericht",
      sourceUrl: "",
      servings: 4,
      ingredients: [{ amount: "", unit: "", name: "" }],
      recipe: "",
      notes: "",
      image: "",
    });
    setImageError("");
    setEditingRecipeId(null);
  }

  async function setRating(country, recipeId, rating) {
    try {
      const { error } = await supabase.from("weltkochen_ratings").upsert({ recipe_id: recipeId, user_id: currentUser.id, rating, updated_at: new Date().toISOString() });
      if (error) throw error;
      setRecipes((prev) => {
        const list = Array.isArray(prev[country]) ? prev[country] : [];
        return { ...prev, [country]: list.map((recipe) => recipe.id === recipeId ? { ...recipe, ratings: { ...(recipe.ratings || {}), [currentUser.username]: rating } } : recipe) };
      });
      setOpenedRecipe((current) => current?.id === recipeId ? { ...current, ratings: { ...(current.ratings || {}), [currentUser.username]: rating } } : current);
    } catch (error) { setStorageError(error instanceof Error ? error.message : "Bewertung konnte nicht gespeichert werden."); }
  }

  function editRecipe(recipe) {
    const nextForm = {
      dish: recipe.dish || "",
      category: recipe.category || "Hauptgericht",
      sourceUrl: recipe.sourceUrl || "",
      servings: Number(recipe.servings) || 4,
      ingredients: Array.isArray(recipe.ingredients) && recipe.ingredients.length
        ? recipe.ingredients.map((item) => ({ amount: ingredientAmountToNumber(item.amount), unit: item.unit || "", name: item.name || "" }))
        : [{ amount: "", unit: "", name: "" }],
      recipe: recipe.recipe || "",
      notes: recipe.notes || "",
      image: recipe.image || "",
    };
    setEditingRecipeId(recipe.id);
    setForm(nextForm);
    setSavedFormSignature(recipeFormSignature(nextForm));
    setImageError("");
    setPage("details");
  }

  function editRecipeFromModal(recipe) {
    if (recipe?.country) setSelected(recipe.country);
    setOpenedRecipe(null);
    editRecipe(recipe);
    window.setTimeout(() => {
      document.getElementById("recipe-entry-card")?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 100);
  }

  async function addSuggestion() {
    const clean = suggestionText.trim(); if (!clean) return;
    try {
      const { error } = await supabase.from("weltkochen_suggestions").insert({ country: selected, suggestion: clean, creator_id: currentUser.id });
      if (error) throw error;
      const content = await loadNormalizedContent(); setSuggestions(content.suggestions);
      setSuggestionText(""); setSuggestionDialogOpen(false);
    } catch (error) { setStorageError(friendlyError(error, "Vorschlag konnte nicht gespeichert werden.")); }
  }

  async function removeSuggestion(country, indexToRemove) {
    const suggestion = (Array.isArray(suggestions[country]) ? suggestions[country] : [])[indexToRemove];
    if (!suggestion) return;
    try {
      const { data: rows, error: findError } = await supabase.from("weltkochen_suggestions").select("id").eq("country", country).eq("suggestion", suggestion).limit(1);
      if (findError) throw findError;
      if (rows?.[0]?.id) {
        const { error: deleteError } = await supabase.from("weltkochen_suggestions").delete().eq("id", rows[0].id);
        if (deleteError) throw deleteError;
      }
      const content = await loadNormalizedContent(); setSuggestions(content.suggestions); setOpenedSuggestion(null);
    } catch (error) { setStorageError(friendlyError(error, "Vorschlag konnte nicht gelöscht werden.")); }
  }

  function openSuggestion(country, suggestion, index) {
    setOpenedSuggestion({ country, suggestion, index });
  }

  async function convertSuggestionToRecipe() {
    if (!openedSuggestion) return;
    setSelected(openedSuggestion.country);
    setForm({
      dish: openedSuggestion.suggestion,
      category: "Hauptgericht",
      sourceUrl: "",
      servings: 4,
      ingredients: [{ amount: "", unit: "", name: "" }],
      recipe: "",
      notes: "Aus Rezeptvorschlag übernommen.",
      image: "",
    });
    setImageError("");
    setEditingRecipeId(null);
    await removeSuggestion(openedSuggestion.country, openedSuggestion.index);
    setPage("details");
  }

  async function exportBackup() {
    try {
      const content = await loadNormalizedContent();
      const payload = { exportedAt: new Date().toISOString(), version: 2, settings, recipes: content.recipes, suggestions: content.suggestions };
      const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a"); a.href = url;
      a.download = `koch-dich-um-die-welt-backup-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
    } catch (error) { setStorageError(error instanceof Error ? error.message : "Backup konnte nicht erstellt werden."); }
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
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_#fffaf0_0%,_#f7edda_42%,_#efe0c7_100%)] pb-24 text-stone-900 md:pb-0" style={{ fontFamily: "ui-rounded, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>
      <header className="sticky top-0 z-[90] border-b border-stone-300/80 bg-[#fffaf0]/90 px-4 py-3 shadow-sm backdrop-blur-xl md:px-5 md:py-4">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <button onClick={() => navigateTo("karte")} className="flex items-center gap-4 text-left">
            <div className="grid h-12 w-12 place-items-center rounded-2xl border border-stone-200 bg-white shadow-sm shadow-[0_8px_24px_rgba(70,50,30,.12)] md:h-16 md:w-16"><ChefHat className="h-6 w-6 md:h-8 md:w-8" /></div>
            <div>
              <h1 className="text-lg font-black tracking-tight sm:text-2xl md:text-3xl">Koch dich um die Welt</h1>
              <p className="hidden text-stone-600 sm:block">Mehrere Rezepte pro Land · Bewertungen pro Benutzer</p>
            </div>
          </button>

          <nav className="hidden flex-wrap items-center gap-2 rounded-2xl border border-stone-200 bg-white/70 p-1.5 shadow-sm md:flex">
            <button onClick={() => navigateTo("karte")} className={`flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-bold transition ${page === "karte" ? "bg-stone-900 text-white shadow-sm" : "text-stone-600 hover:bg-stone-100"}`}><Globe2 size={20} /> Weltkarte</button>
            <button onClick={() => navigateTo("details")} className={`flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-bold transition ${page === "details" ? "bg-stone-900 text-white shadow-sm" : "text-stone-600 hover:bg-stone-100"}`}><BookOpen size={20} /> Rezept eintragen</button>
            <button onClick={() => navigateTo("favoriten")} className={`flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-bold transition ${page === "favoriten" ? "bg-stone-900 text-white shadow-sm" : "text-stone-600 hover:bg-stone-100"}`}><Heart size={20} /> Favoriten</button>
            <button onClick={() => navigateTo("kochplan")} className={`flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-bold transition ${page === "kochplan" ? "bg-stone-900 text-white shadow-sm" : "text-stone-600 hover:bg-stone-100"}`}><CalendarDays size={20} /> Kochplan</button>
            {currentUser.role === "admin" && <button onClick={() => navigateTo("admin")} className={`flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-bold transition ${page === "admin" ? "bg-stone-900 text-white shadow-sm" : "text-stone-600 hover:bg-stone-100"}`}><BarChart3 size={20} /> Admin</button>}
            <button onClick={() => setShoppingListOpen(true)} className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-bold text-stone-600 transition hover:bg-stone-100"><ShoppingCart size={20} /> Einkauf {combinedShoppingItems.length ? `(${combinedShoppingItems.length})` : ""}</button>
            <button onClick={restartTutorial} className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-bold text-stone-600 transition hover:bg-stone-100" title="Tutorial erneut starten"><Sparkles size={20} /> Tutorial</button>
            <span className="flex items-center gap-2 px-3 py-2 font-semibold text-stone-600"><BarChart3 size={20} /> {progress}%</span>
          </nav>

          <div className="flex items-center gap-3">
            <div className="hidden rounded-2xl border border-stone-200 bg-white shadow-sm px-4 py-2 text-sm font-semibold md:block">{currentUser.displayName}</div>
            <Button onClick={logout} variant="outline" className="rounded-2xl border-stone-300 bg-transparent px-4 py-6 text-stone-800 hover:bg-stone-100">Abmelden</Button>
          </div>
        </div>
      </header>

      {storageError && currentUser && (
        <div className="mx-auto mt-4 max-w-7xl px-5">
          <div className="flex items-start justify-between gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-800">
            <span>{storageError}</span>
            <button type="button" onClick={() => setStorageError("")} className="shrink-0 rounded-lg px-2 py-1 text-red-700 hover:bg-red-100">×</button>
          </div>
        </div>
      )}


      {page === "admin" && currentUser.role === "admin" ? (
        <AdminPanel
          settings={settings}
          onUpdateSettings={updateSettings}
          onExportBackup={exportBackup}
          onTrashChanged={async () => {
            const content = await loadNormalizedContent();
            setRecipes(content.recipes);
            setSuggestions(content.suggestions);
          }}
        />
      ) : page === "karte" ? (
        <main className="mx-auto max-w-[1600px] px-4 py-5 md:px-5 md:py-8">
          <section className="mb-6 overflow-hidden rounded-[2rem] border border-stone-200 bg-stone-900 text-white shadow-[0_24px_60px_rgba(0,0,0,.16)]">
            <div className="grid gap-6 p-5 md:p-7 lg:grid-cols-[1.25fr_.75fr] lg:items-end">
              <div>
                <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1.5 text-xs font-black uppercase tracking-[0.14em] text-amber-300">
                  <Globe2 className="h-4 w-4" /> Deine kulinarische Weltreise
                </div>
                <h2 className="max-w-3xl text-3xl font-black tracking-tight sm:text-4xl lg:text-5xl">
                  Einmal um die Welt – Rezept für Rezept.
                </h2>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-stone-300 sm:text-base">
                  Entdecke Länder, sammle eure besten Gerichte und mach die Weltkarte Schritt für Schritt grüner.
                </p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/[0.07] p-4 backdrop-blur">
                <div className="flex items-end justify-between gap-4">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wide text-stone-400">Fortschritt</p>
                    <p className="mt-1 text-3xl font-black">{progress}%</p>
                  </div>
                  <p className="text-right text-sm font-bold text-stone-200">{doneCount} / {countries.length}<br /><span className="font-medium text-stone-400">Länder abgeschlossen</span></p>
                </div>
                <div className="mt-4 h-3 overflow-hidden rounded-full bg-white/10">
                  <div className="h-full rounded-full bg-amber-400 transition-all duration-500" style={{ width: `${Math.max(2, progress)}%` }} />
                </div>
              </div>
            </div>
          </section>

          <div className="grid gap-6 lg:grid-cols-[1.65fr_.85fr]">
          <section className="space-y-5">
            <WorldMap selected={selected} hovered={hovered} setSelected={setSelected} setHovered={setHovered} recipes={recipes} suggestions={suggestions} selectedRegion={selectedRegion} requiredRecipes={settings.requiredRecipesPerCountry} minAverageRating={settings.minAverageRatingForCompletion} focusCountry={focusCountry} />
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-stone-200 bg-white/90 p-4 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="grid h-11 w-11 place-items-center rounded-xl bg-emerald-100 text-emerald-700"><Globe2 className="h-5 w-5" /></div>
                  <div><p className="text-xs font-black uppercase tracking-wide text-stone-400">Länder</p><p className="text-2xl font-black">{doneCount}<span className="text-sm font-bold text-stone-400"> / {countries.length}</span></p></div>
                </div>
              </div>
              <div className="rounded-2xl border border-stone-200 bg-white/90 p-4 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="grid h-11 w-11 place-items-center rounded-xl bg-amber-100 text-amber-700"><ChefHat className="h-5 w-5" /></div>
                  <div><p className="text-xs font-black uppercase tracking-wide text-stone-400">Rezepte</p><p className="text-2xl font-black">{recipeEntries.length}</p></div>
                </div>
              </div>
              <div className="rounded-2xl border border-stone-200 bg-white/90 p-4 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="grid h-11 w-11 place-items-center rounded-xl bg-yellow-100 text-yellow-700"><Star className="h-5 w-5 fill-current" /></div>
                  <div><p className="text-xs font-black uppercase tracking-wide text-stone-400">Ø Bewertung</p><p className="text-2xl font-black">{averageRating}<span className="text-sm font-bold text-stone-400"> / 5</span></p></div>
                </div>
              </div>
            </div>
          </section>

          <aside className="space-y-5">
            <div className="grid gap-3 md:grid-cols-[1fr_auto]">
              <div className="relative z-30">
                <Search className="absolute left-4 top-3.5 h-5 w-5 text-stone-500" />
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" && query.trim() && filteredCountries[0]) {
                      event.preventDefault();
                      chooseCountryFromSearch(filteredCountries[0]);
                    }
                  }}
                  placeholder="Welches Land möchtest du entdecken?"
                  className="w-full rounded-2xl border border-stone-200 bg-white py-3.5 pl-12 pr-4 font-semibold shadow-sm outline-none transition focus:border-amber-400 focus:ring-4 focus:ring-amber-100"
                />
                {query.trim() && filteredCountries.length > 0 && query !== selected && (
                  <div className="absolute left-0 right-0 top-[calc(100%+6px)] max-h-64 overflow-auto rounded-2xl border-2 border-stone-300 bg-white p-2 shadow-xl">
                    {filteredCountries.slice(0, 8).map((country) => (
                      <button
                        key={country}
                        type="button"
                        onClick={() => chooseCountryFromSearch(country)}
                        className="block w-full rounded-xl px-4 py-3 text-left font-bold hover:bg-amber-50"
                      >
                        {country}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <select value={selectedRegion} onChange={(event) => setSelectedRegion(event.target.value)} className="rounded-2xl border border-stone-200 bg-white px-4 py-3.5 font-semibold shadow-sm outline-none transition focus:border-amber-400 focus:ring-4 focus:ring-amber-100">
                <option>Alle Kontinente</option>
                {regionRows.map((region) => <option key={region.name}>{region.name}</option>)}
              </select>
            </div>

            {query.trim() ? (
              <Card className="overflow-hidden rounded-[1.75rem] border border-stone-200 bg-[#fffaf0]/95 shadow-[0_12px_30px_rgba(76,54,28,.08)] shadow-sm">
                <CardContent className="p-0">
                  <div className="grid grid-cols-[1fr_1.3fr_1fr_36px] border-b-2 border-stone-300 bg-[#fbf0dd] px-4 py-4 font-black"><span>Land</span><span>Rezept</span><span>Bewertung</span><span /></div>
                  <div className="max-h-[560px] overflow-auto">
                    {visibleRecipes.map(([country, recipe]) => (
                      <button key={recipe.id} onMouseEnter={() => setHovered(country)} onMouseLeave={() => setHovered("")} onClick={() => { setSelected(country); openRecipe(recipe, country); }} className={`grid w-full grid-cols-[1fr_1.3fr_1fr_36px] items-center border-b border-stone-200 px-4 py-4 text-left transition hover:bg-amber-100 ${selected === country ? "bg-amber-100" : ""}`}>
                        <span className="font-semibold">{country}</span>
                        <span>{recipe.image && <img src={recipe.image} alt={recipe.dish} className="mb-2 h-16 w-24 rounded-lg object-cover" />}<b>{recipe.dish}</b><br /><small className="text-stone-500">{recipe.category || "Hauptgericht"} · von {recipe.createdByName || recipe.createdBy}</small></span>
                        <span onClick={(event) => event.stopPropagation()}><RatingStars value={getUserRating(recipe, currentUser.username)} onChange={(rating) => setRating(country, recipe.id, rating)} small /><small className="text-stone-500">Ø {getRecipeAverage(recipe)}</small></span>
                        <ChevronRight />
                      </button>
                    ))}
                    {!visibleRecipes.length && <p className="p-6 text-stone-500">Keine passenden Rezepte gefunden.</p>}
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card className="rounded-[1.75rem] border border-stone-200 bg-[#fffaf0]/95 shadow-[0_12px_30px_rgba(76,54,28,.08)] shadow-sm">
                <CardContent className="p-5">
                  <p className="text-xs font-black uppercase tracking-[0.14em] text-amber-700">Entdecken</p>
                  <h3 className="mt-1 text-2xl font-black tracking-tight">Wo geht die Reise hin?</h3>
                  <p className="mt-1 text-sm text-stone-500">Lass dich überraschen oder mach gezielt weiter.</p>

                  <div className="mt-4 grid gap-2 sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
                    <button type="button" onClick={() => setDiscoverMode("random")} className={`group rounded-2xl border p-3 text-left transition ${discoverMode === "random" ? "border-stone-900 bg-stone-900 text-white shadow-md" : "border-stone-200 bg-white hover:-translate-y-0.5 hover:border-amber-300 hover:shadow-md"}`}>
                      <span className={`mb-2 grid h-9 w-9 place-items-center rounded-xl text-lg ${discoverMode === "random" ? "bg-white/10" : "bg-amber-100"}`}>🎲</span>
                      <span className="block text-sm font-black">Zufall</span>
                      <span className={`mt-0.5 block text-[11px] ${discoverMode === "random" ? "text-stone-300" : "text-stone-400"}`}>Überrasch mich</span>
                    </button>
                    <button type="button" onClick={() => setDiscoverMode("next")} className={`group rounded-2xl border p-3 text-left transition ${discoverMode === "next" ? "border-stone-900 bg-stone-900 text-white shadow-md" : "border-stone-200 bg-white hover:-translate-y-0.5 hover:border-amber-300 hover:shadow-md"}`}>
                      <span className={`mb-2 grid h-9 w-9 place-items-center rounded-xl text-lg ${discoverMode === "next" ? "bg-white/10" : "bg-emerald-100"}`}>🧭</span>
                      <span className="block text-sm font-black">Weiterreisen</span>
                      <span className={`mt-0.5 block text-[11px] ${discoverMode === "next" ? "text-stone-300" : "text-stone-400"}`}>Nächstes Land</span>
                    </button>
                    <button type="button" onClick={() => setDiscoverMode("top")} className={`group rounded-2xl border p-3 text-left transition ${discoverMode === "top" ? "border-stone-900 bg-stone-900 text-white shadow-md" : "border-stone-200 bg-white hover:-translate-y-0.5 hover:border-amber-300 hover:shadow-md"}`}>
                      <span className={`mb-2 grid h-9 w-9 place-items-center rounded-xl text-lg ${discoverMode === "top" ? "bg-white/10" : "bg-yellow-100"}`}>⭐</span>
                      <span className="block text-sm font-black">Bestes Rezept</span>
                      <span className={`mt-0.5 block text-[11px] ${discoverMode === "top" ? "text-stone-300" : "text-stone-400"}`}>Euer Favorit</span>
                    </button>
                  </div>

                  {discoverMode === "random" && (
                    <div className="mt-4 rounded-2xl border border-stone-200 bg-white p-4">
                      <h4 className="font-black">Überrasch mich</h4>
                      <p className="mt-1 text-sm text-stone-500">Öffnet zufällig eines eurer vorhandenen Rezepte.</p>
                      <Button type="button" onClick={showRandomRecipe} disabled={!recipeEntries.length} className="mt-3 w-full rounded-xl bg-stone-900 text-white">
                        🎲 Zufälliges Rezept anzeigen
                      </Button>
                    </div>
                  )}

                  {discoverMode === "next" && (
                    <div className="mt-4 rounded-2xl border border-stone-200 bg-white p-4">
                      {nextCountrySuggestion ? (
                        <>
                          <p className="text-sm text-stone-500">Hier fehlt noch etwas</p>
                          <h4 className="mt-1 text-xl font-black">{nextCountrySuggestion.country}</h4>
                          <p className="mt-1 text-sm text-stone-500">{nextCountrySuggestion.count} / {settings.requiredRecipesPerCountry} qualifizierte Rezepte</p>
                          <Button type="button" onClick={showNextCountry} className="mt-3 w-full rounded-xl bg-stone-900 text-white">
                            🌍 Land auf der Karte anzeigen
                          </Button>
                        </>
                      ) : (
                        <p className="font-bold">Alle Länder erfüllen bereits das aktuelle Ziel. 🎉</p>
                      )}
                    </div>
                  )}

                  {discoverMode === "top" && (
                    <div className="mt-4 rounded-2xl border border-stone-200 bg-white p-4">
                      {topRecipeEntry ? (
                        <>
                          <p className="text-sm text-stone-500">{topRecipeEntry[0]}</p>
                          <h4 className="mt-1 text-xl font-black">{topRecipeEntry[1].dish}</h4>
                          <div className="mt-2 flex flex-wrap items-center gap-2">
                            <RatingStars value={Math.round(topRecipeEntry[2])} small />
                            <span className="text-sm font-bold">Ø {topRecipeEntry[2].toFixed(1)} / 5</span>
                            <span className="text-xs text-stone-500">({topRecipeEntry[3]} Bewertung{topRecipeEntry[3] === 1 ? "" : "en"})</span>
                          </div>
                          <Button type="button" onClick={showTopRecipe} className="mt-3 w-full rounded-xl bg-stone-900 text-white">
                            ⭐ Top-Rezept öffnen
                          </Button>
                        </>
                      ) : (
                        <p className="text-stone-500">Noch kein Rezept vorhanden.</p>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {recipeEntries.length > 0 && (
              <button
                type="button"
                onClick={showRandomRecipe}
                className="group relative w-full overflow-hidden rounded-[1.75rem] border border-stone-200 bg-stone-900 p-5 text-left text-white shadow-[0_16px_40px_rgba(0,0,0,.14)] transition hover:-translate-y-0.5 hover:shadow-[0_20px_50px_rgba(0,0,0,.18)]"
              >
                <div className="absolute -right-8 -top-8 h-28 w-28 rounded-full bg-amber-400/20 blur-2xl" />
                <div className="relative flex items-center justify-between gap-4">
                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.14em] text-amber-300">Was kochen wir heute?</p>
                    <p className="mt-1 text-xl font-black">Lass dich überraschen.</p>
                    <p className="mt-1 text-sm text-stone-400">Ein Klick wählt zufällig ein Rezept aus eurer Sammlung.</p>
                  </div>
                  <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-white/10 text-2xl transition group-hover:rotate-12 group-hover:scale-110">🎲</div>
                </div>
              </button>
            )}

            <Card className="rounded-[1.75rem] border border-stone-200 bg-[#fffaf0]/95 shadow-[0_12px_30px_rgba(76,54,28,.08)] shadow-sm">
              <CardContent className="p-5">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.14em] text-amber-700">Ausgewähltes Land</p>
                    <h3 className="mt-1 flex items-center gap-2 text-3xl font-black tracking-tight"><span>🌍</span>{activeCountry}</h3>
                    <div className="mt-2 flex flex-wrap gap-2">
                      <span className={`rounded-full px-3 py-1 text-xs font-black ${activeCountryComplete ? "bg-emerald-100 text-emerald-800" : "bg-stone-100 text-stone-700"}`}>
                        {activeCountryComplete ? "✓ Abgeschlossen" : `${activeQualifiedCount}/${settings.requiredRecipesPerCountry} qualifiziert`}
                      </span>
                      <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-black text-amber-800">{activeRecipes.length} Rezept{activeRecipes.length === 1 ? "" : "e"}</span>
                      <span className="rounded-full bg-yellow-100 px-3 py-1 text-xs font-black text-yellow-800">Ø {activeCountryAverage} ⭐</span>
                    </div>
                  </div>
                  <button type="button" onClick={() => navigateTo("details")} className="rounded-xl bg-stone-900 px-4 py-2.5 text-sm font-black text-white shadow-sm transition hover:bg-stone-800">
                    + Rezept eintragen
                  </button>
                </div>
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
                      <button key={recipe.id} onClick={() => openRecipe(recipe, activeCountry)} className="group flex w-full items-center gap-3 rounded-2xl border border-stone-200 bg-white p-3 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-amber-300 hover:shadow-md">
                        <div className="relative shrink-0 overflow-hidden rounded-xl">
                          {recipe.image ? (
                            <img src={recipe.image} alt={recipe.dish} loading="lazy" className="h-24 w-28 object-cover transition duration-300 group-hover:scale-105" />
                          ) : (
                            <div className="grid h-24 w-28 place-items-center bg-stone-100"><ChefHat className="h-6 w-6 text-stone-400" /></div>
                          )}
                          <span className="absolute bottom-1.5 left-1.5 rounded-full bg-black/65 px-2 py-0.5 text-[10px] font-bold text-white backdrop-blur">{recipe.category || "Hauptgericht"}</span>
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-2">
                            <p className="font-black">{recipe.dish}</p>
                            {favoriteRecipeIds.includes(recipe.id) && <Heart className="h-4 w-4 shrink-0 fill-rose-500 text-rose-500" />}
                          </div>
                          <p className="mt-1 text-xs text-stone-500">von {recipe.createdByName || recipe.createdBy}</p>
                          <div className="mt-2 flex items-center gap-2">
                            <RatingStars value={getUserRating(recipe, currentUser.username)} onChange={(rating) => setRating(activeCountry, recipe.id, rating)} small />
                            <span className="text-xs text-stone-500">Ø {getRecipeAverage(recipe)}</span>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                ) : <p className="mt-3 text-stone-600">Für dieses Land ist noch kein Rezept eingetragen.</p>}
              </CardContent>
            </Card>
          </aside>
          </div>
        </main>
      ) : page === "favoriten" ? (
        <main className="mx-auto max-w-6xl px-4 py-6 md:px-5 md:py-8">
          <div className="mb-6">
            <p className="text-sm uppercase tracking-wide text-amber-700">Nur für {currentUser.displayName}</p>
            <h2 className="text-3xl font-black tracking-tight md:text-4xl">Meine Favoriten</h2>
            <p className="mt-2 text-stone-600">Deine Favoriten sind nur deinem Benutzerkonto zugeordnet.</p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {recipeEntries
              .filter(([, recipe]) => favoriteRecipeIds.includes(recipe.id))
              .map(([country, recipe]) => (
                <button key={recipe.id} onClick={() => openRecipe(recipe, country)} className="overflow-hidden rounded-2xl border-2 border-stone-200 bg-white text-left transition hover:border-amber-400">
                  {recipe.image ? <img src={recipe.image} alt={recipe.dish} className="aspect-[4/3] w-full object-cover" /> : <div className="grid h-40 place-items-center bg-stone-100"><ChefHat className="h-10 w-10 text-stone-400" /></div>}
                  <div className="p-4">
                    <div className="flex items-start justify-between gap-2"><h3 className="font-black">{recipe.dish}</h3><Heart className="h-5 w-5 shrink-0 fill-rose-500 text-rose-500" /></div>
                    <p className="mt-1 text-sm text-stone-500">{country} · {recipe.category || "Hauptgericht"}</p>
                    <p className="mt-2 text-sm font-bold">Ø {getRecipeAverage(recipe)} / 5</p>
                  </div>
                </button>
              ))}
          </div>

          {!favoriteRecipeIds.length && (
            <div className="rounded-2xl border-2 border-dashed border-stone-300 bg-white p-8 text-center text-stone-500">
              Noch keine Favoriten. Öffne ein Rezept und tippe auf das Herz.
            </div>
          )}
        </main>
      ) : page === "kochplan" ? (
        <main className="mx-auto max-w-6xl px-4 py-6 md:px-5 md:py-8">
          <div className="mb-6">
            <p className="text-sm uppercase tracking-wide text-amber-700">Planen</p>
            <h2 className="text-3xl font-black tracking-tight md:text-4xl">Mein Kochplan</h2>
            <p className="mt-2 text-stone-600">Plane Rezepte für bestimmte Tage und übernimm die Zutaten direkt in deine Einkaufsliste.</p>
          </div>

          <Card className="mb-6 border border-stone-200 bg-[#fffaf0]/95 shadow-[0_12px_30px_rgba(76,54,28,.08)]">
            <CardContent className="p-5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h3 className="text-xl font-black tracking-tight md:text-2xl">Wochenübersicht</h3>
                  <p className="text-sm text-stone-600">
                    {currentWeekDays[0]?.date.toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit" })} – {currentWeekDays[6]?.date.toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric" })}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button type="button" variant="outline" onClick={() => setWeekOffset((value) => value - 1)} className="rounded-xl bg-white">← Vorherige</Button>
                  <Button type="button" variant="outline" onClick={() => setWeekOffset(0)} className="rounded-xl bg-white">Diese Woche</Button>
                  <Button type="button" variant="outline" onClick={() => setWeekOffset((value) => value + 1)} className="rounded-xl bg-white">Nächste →</Button>
                  <Button type="button" onClick={addWeekToShoppingList} className="rounded-xl bg-stone-900 font-black text-white shadow-sm transition hover:bg-stone-800">
                    <ShoppingCart className="mr-2 h-4 w-4" /> Woche einkaufen
                  </Button>
                </div>
              </div>

              <div className="mt-5 grid gap-3 md:grid-cols-7">
                {currentWeekDays.map((day) => {
                  const entries = mealPlan.filter((entry) => entry.plan_date === day.iso);
                  return (
                    <div key={day.iso} className="min-h-40 rounded-2xl border border-stone-200 bg-white p-3">
                      <div className="mb-3 border-b border-stone-100 pb-2">
                        <p className="font-black uppercase">{day.label}</p>
                        <p className="text-xs text-stone-500">{day.dayLabel}</p>
                      </div>
                      <div className="space-y-2">
                        {entries.map((entry) => {
                          const pair = recipeEntries.find(([, recipe]) => recipe.id === entry.recipe_id);
                          const recipe = pair?.[1];
                          const country = pair?.[0];
                          return (
                            <button
                              key={entry.id}
                              type="button"
                              onClick={() => recipe && openRecipe(recipe, country)}
                              className="w-full rounded-xl bg-amber-50 p-2 text-left hover:bg-amber-100"
                            >
                              <p className="text-sm font-black">{recipe?.dish || "Rezept nicht verfügbar"}</p>
                              <p className="mt-1 text-xs text-stone-500">{entry.servings} Pers.{entry.note ? ` · ${entry.note}` : ""}</p>
                            </button>
                          );
                        })}
                        {!entries.length && (
                          <button
                            type="button"
                            onClick={() => {
                              setPlanDate(day.iso);
                              document.getElementById("meal-plan-entry")?.scrollIntoView({ behavior: "smooth", block: "center" });
                            }}
                            className="w-full rounded-xl border border-dashed border-stone-300 p-3 text-xs font-semibold text-stone-500 hover:bg-stone-50"
                          >
                            + Gericht planen
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          <Card id="meal-plan-entry" className="border border-stone-200 bg-[#fffaf0]/95 shadow-[0_12px_30px_rgba(76,54,28,.08)]">
            <CardContent className="p-5">
              <div className="grid gap-3 md:grid-cols-[160px_1fr_130px]">
                <label>
                  <span className="mb-1 block text-sm font-semibold">Datum</span>
                  <input type="date" value={planDate} onChange={(event) => setPlanDate(event.target.value)} className="w-full rounded-xl border-2 border-stone-300 bg-white p-3" />
                </label>

                <div className="relative z-30">
                  <span className="mb-1 block text-sm font-semibold">Rezept oder Land</span>
                  <Search className="absolute left-4 top-[43px] h-5 w-5 text-stone-400" />
                  <input
                    value={planSearch}
                    onFocus={() => setPlanSearchOpen(true)}
                    onChange={(event) => {
                      setPlanSearch(event.target.value);
                      setPlanRecipeId("");
                      setPlanSearchOpen(true);
                    }}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" && planRecipeMatches[0]) {
                        event.preventDefault();
                        const first = planRecipeMatches[0];
                        setPlanRecipeId(first.recipe.id);
                        setPlanSearch(first.recipe.dish);
                        setPlanServings(Number(first.recipe.servings) || 4);
                        setPlanSearchOpen(false);
                      }
                    }}
                    placeholder="z. B. Deutschland, Italien oder Lasagne..."
                    autoComplete="off"
                    className="w-full rounded-xl border-2 border-stone-300 bg-white py-3 pl-12 pr-4 outline-none focus:border-amber-500"
                  />

                  {planSearchOpen && planSearch.trim() && (
                    <div className="absolute left-0 right-0 top-[calc(100%+6px)] max-h-72 overflow-auto rounded-2xl border-2 border-stone-300 bg-white p-2 shadow-xl">
                      {planRecipeMatches.length ? planRecipeMatches.map(({ country, recipe }) => (
                        <button
                          key={recipe.id}
                          type="button"
                          onMouseDown={(event) => event.preventDefault()}
                          onClick={() => {
                            setPlanRecipeId(recipe.id);
                            setPlanSearch(recipe.dish);
                            setPlanServings(Number(recipe.servings) || 4);
                            setPlanSearchOpen(false);
                          }}
                          className="flex w-full items-center gap-3 rounded-xl p-2 text-left hover:bg-amber-50"
                        >
                          {recipe.image ? (
                            <img src={recipe.image} alt="" className="h-12 w-14 shrink-0 rounded-lg object-cover" />
                          ) : (
                            <div className="grid h-12 w-14 shrink-0 place-items-center rounded-lg bg-stone-100"><ChefHat className="h-5 w-5 text-stone-400" /></div>
                          )}
                          <div className="min-w-0">
                            <p className="truncate font-black">{recipe.dish}</p>
                            <p className="text-xs text-stone-500">{country} · {recipe.category || "Hauptgericht"} · Ø {getRecipeAverage(recipe)}</p>
                          </div>
                        </button>
                      )) : (
                        <p className="p-3 text-sm text-stone-500">Kein passendes Rezept gefunden.</p>
                      )}
                    </div>
                  )}

                  {planRecipeId && (
                    <p className="mt-1 text-xs font-semibold text-emerald-700">✓ Rezept ausgewählt</p>
                  )}
                </div>

                <label>
                  <span className="mb-1 block text-sm font-semibold">Personen</span>
                  <input type="number" min="1" max="100" value={planServings} onChange={(event) => setPlanServings(Math.max(1, Number(event.target.value) || 1))} className="w-full rounded-xl border-2 border-stone-300 bg-white p-3" />
                </label>
              </div>
              <label className="mt-3 block">
                <span className="mb-1 block text-sm font-semibold">Notiz (optional)</span>
                <input value={planNote} onChange={(event) => setPlanNote(event.target.value)} placeholder="z. B. Gäste kommen um 18 Uhr" className="w-full rounded-xl border-2 border-stone-300 bg-white p-3" />
              </label>
              <Button type="button" onClick={addMealPlanEntry} disabled={!planRecipeId || !planDate} className="mt-4 rounded-xl bg-stone-900 text-white">
                <Plus className="mr-2 h-4 w-4" /> Zum Kochplan hinzufügen
              </Button>
            </CardContent>
          </Card>

          <div className="mt-6 space-y-3">
            {mealPlan.map((entry) => {
              const pair = recipeEntries.find(([, recipe]) => recipe.id === entry.recipe_id);
              const recipe = pair?.[1];
              const country = pair?.[0];
              return (
                <Card key={entry.id} className="border border-stone-300 bg-white">
                  <CardContent className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm font-bold text-amber-700">{new Date(`${entry.plan_date}T12:00:00`).toLocaleDateString("de-DE", { weekday: "long", day: "2-digit", month: "2-digit", year: "numeric" })}</p>
                      <h3 className="mt-1 text-xl font-black">{recipe?.dish || "Rezept nicht mehr verfügbar"}</h3>
                      <p className="text-sm text-stone-500">{country || ""} · {entry.servings} Personen{entry.note ? ` · ${entry.note}` : ""}</p>
                    </div>
                    <div className="flex flex-col gap-2 sm:flex-row">
                      {recipe && <Button type="button" variant="outline" onClick={() => addPlannedMealToShoppingList(entry)} className="rounded-xl bg-white"><ShoppingCart className="mr-2 h-4 w-4" /> Einkauf</Button>}
                      {recipe && <Button type="button" variant="outline" onClick={() => openRecipe(recipe, country)} className="rounded-xl bg-white">Rezept öffnen</Button>}
                      <Button type="button" variant="outline" onClick={() => removeMealPlanEntry(entry.id)} className="rounded-xl border-red-300 bg-red-50 text-red-700"><Trash2 className="h-4 w-4" /></Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
            {!mealPlan.length && <p className="rounded-2xl border-2 border-dashed border-stone-300 bg-white p-8 text-center text-stone-500">Noch nichts geplant.</p>}
          </div>
        </main>
      ) : (
        <main className="mx-auto max-w-7xl px-4 py-6 md:px-5 md:py-8">
          <motion.section initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} className="mb-8 grid gap-6 rounded-[2rem] bg-gradient-to-br from-orange-400 via-rose-400 to-amber-500 p-8 text-white shadow-2xl md:grid-cols-[1.3fr_.7fr]">
            <div><div className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/20 px-4 py-2 text-sm backdrop-blur"><ChefHat size={18} /> Rezeptwerkstatt</div><h2 className="text-4xl font-black tracking-tight md:text-6xl">Mehrere Rezepte pro Land</h2><p className="mt-4 max-w-2xl text-lg text-white/90">Ein Land ist erst abgeschlossen, wenn genug Rezepte über der Mindestbewertung liegen.</p></div>
            <Card className="border-white/20 bg-white/20 text-white backdrop-blur-xl"><CardContent className="p-6"><div className="flex items-center gap-3"><Globe2 className="h-10 w-10" /><div><p className="text-sm text-white/75">Fortschritt</p><p className="text-3xl font-black tracking-tight md:text-4xl">{progress}%</p></div></div><div className="mt-5 h-4 rounded-full bg-white/20"><div className="h-4 rounded-full bg-white transition-all" style={{ width: `${progress}%` }} /></div><p className="mt-3 text-sm text-white/85">{doneCount} von {countries.length} Ländern abgeschlossen</p></CardContent></Card>
          </motion.section>

          <div className="grid gap-6 lg:grid-cols-[1.1fr_.9fr]">
            <section className="space-y-5 md:space-y-6">
              <Card className="border border-stone-200 bg-[#fffaf0]/95 shadow-[0_12px_30px_rgba(76,54,28,.08)] shadow-sm">
                <CardContent className="p-5">
                  <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between"><h2 className="flex items-center gap-2 text-2xl font-bold"><MapPin /> Länderauswahl</h2><div className="relative z-30">
                    <Search className="absolute left-3 top-3.5 h-4 w-4 text-stone-500" />
                    <input
                      value={query}
                      onChange={(event) => setQuery(event.target.value)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" && query.trim() && filteredCountries[0]) {
                          event.preventDefault();
                          chooseCountryFromSearch(filteredCountries[0], true);
                        }
                      }}
                      placeholder="Land suchen..."
                      className="w-full rounded-2xl border-2 border-stone-300 bg-white py-3 pl-9 pr-4 outline-none focus:border-amber-500 md:w-64"
                    />
                    {query.trim() && filteredCountries.length > 0 && query !== selected && (
                      <div className="absolute left-0 right-0 top-[calc(100%+6px)] max-h-64 overflow-auto rounded-2xl border-2 border-stone-300 bg-white p-2 shadow-xl">
                        {filteredCountries.slice(0, 8).map((country) => (
                          <button key={country} type="button" onClick={() => chooseCountryFromSearch(country, true)} className="block w-full rounded-xl px-3 py-2 text-left font-bold hover:bg-amber-50">
                            {country}
                          </button>
                        ))}
                      </div>
                    )}
                  </div></div>
                  <RegionCountryPicker regionRows={regionRows} collapsedRegions={collapsedRegions} toggleRegion={toggleRegion} recipes={recipes} selected={selected} setSelected={selectCountryAndJumpToForm} query={query} requiredRecipes={settings.requiredRecipesPerCountry} minAverageRating={settings.minAverageRatingForCompletion} />
                  {query && <div className="mt-4 rounded-2xl bg-white p-4"><p className="mb-2 text-sm text-stone-500">Suchergebnisse:</p><div className="flex flex-wrap gap-2">{filteredCountries.slice(0, 30).map((country) => <button key={country} onClick={() => chooseCountryFromSearch(country, true)} className="rounded-full bg-stone-100 px-3 py-1 text-sm hover:bg-stone-200">{country}</button>)}</div></div>}
                </CardContent>
              </Card>
            </section>

            <aside id="recipe-entry-card" className="scroll-mt-4 lg:sticky lg:top-6 lg:self-start">
              <Card className="border border-stone-200 bg-[#fffaf0]/95 shadow-[0_12px_30px_rgba(76,54,28,.08)] shadow-sm">
                <CardContent className="p-6">
            {formIsDirty && (
              <div className="mb-4 flex flex-col gap-2 rounded-2xl border border-amber-300 bg-amber-50 p-3 text-sm font-semibold text-amber-900 sm:flex-row sm:items-center sm:justify-between">
                <span>Ungespeicherte Änderungen</span>
                <span className="text-xs font-medium text-amber-700">Beim Verlassen wirst du gewarnt.</span>
              </div>
            )}

                  <div className="mb-5 flex items-center justify-between gap-3"><div><p className="text-sm uppercase tracking-wide text-amber-700">Ausgewähltes Land</p><h2 className="text-2xl font-black tracking-tight md:text-3xl">{selected}</h2><p className="text-sm text-stone-500">{getQualifiedRecipesCount(recipes[selected], settings.minAverageRatingForCompletion)} / {settings.requiredRecipesPerCountry} Rezepte über {settings.minAverageRatingForCompletion} Sterne</p></div>{isCountryCompleted(recipes[selected], settings.requiredRecipesPerCountry, settings.minAverageRatingForCompletion) && <CheckCircle2 className="h-9 w-9 text-emerald-500" />}</div>
                  <div className="space-y-4">
                    <div className="rounded-2xl border-2 border-amber-200 bg-amber-50/70 p-4">
                      <label className="block">
                        <span className="mb-1 block text-sm font-semibold text-stone-700">Rezept-Link</span>
                        <div className="flex flex-col gap-2 sm:flex-row">
                          <div className="relative min-w-0 flex-1">
                            <Link2 className="absolute left-3 top-3.5 h-5 w-5 text-stone-500" />
                            <input
                              type="url"
                              value={form.sourceUrl || ""}
                              onChange={(event) => setForm({ ...form, sourceUrl: event.target.value })}
                              placeholder="https://..."
                              className="w-full rounded-2xl border-2 border-stone-300 bg-white py-3 pl-11 pr-3 outline-none focus:border-amber-500"
                            />
                          </div>
                          <Button
                            type="button"
                            onClick={importRecipeFromLink}
                            disabled={importBusy || !String(form.sourceUrl || "").trim()}
                            className="rounded-2xl bg-stone-900 px-4 py-3 text-white disabled:opacity-50"
                          >
                            {importBusy ? "Importiere..." : "Rezept importieren"}
                          </Button>
                        </div>
                      </label>
                      {importMessage && <p className="mt-2 rounded-xl bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-800">{importMessage}</p>}
                      {importError && <p className="mt-2 rounded-xl bg-red-50 px-3 py-2 text-sm font-semibold text-red-700">{importError}</p>}
                    </div>

                    <label className="block"><span className="mb-1 block text-sm font-semibold text-stone-600">Gericht</span><input value={form.dish} onChange={(event) => setForm({ ...form, dish: event.target.value })} placeholder={countryHints[selected] || "z. B. Nationalgericht oder Lieblingsgericht"} className="w-full rounded-xl border border-stone-300 bg-white p-3 outline-none transition focus:border-amber-500 focus:ring-2 focus:ring-amber-100 outline-none transition focus:border-amber-500 focus:ring-2 focus:ring-amber-100 outline-none focus:border-amber-500" /></label>
                    <label className="block"><span className="mb-1 block text-sm font-semibold text-stone-600">Kategorie</span><select value={form.category || "Hauptgericht"} onChange={(event) => setForm({ ...form, category: event.target.value })} className="w-full rounded-xl border border-stone-300 bg-white p-3 outline-none transition focus:border-amber-500 focus:ring-2 focus:ring-amber-100 outline-none transition focus:border-amber-500 focus:ring-2 focus:ring-amber-100 outline-none focus:border-amber-500">{recipeCategories.map((category) => <option key={category}>{category}</option>)}</select></label>
                    <label className="block">
                      <span className="mb-1 block text-sm font-semibold text-stone-600">Bild</span>
                      <input type="file" accept="image/png,image/jpeg,image/webp,image/gif" onChange={handleImageUpload} className="w-full rounded-xl border border-stone-300 bg-white p-3 outline-none transition focus:border-amber-500 focus:ring-2 focus:ring-amber-100 outline-none transition focus:border-amber-500 focus:ring-2 focus:ring-amber-100 outline-none focus:border-amber-500" />
                      {imageError && <p className="mt-2 rounded-xl bg-red-50 px-3 py-2 text-sm font-semibold text-red-700">{imageError}</p>}
                      {form.image && <div className="mt-3 rounded-2xl border border-stone-200 bg-white p-3"><img src={form.image} alt="Rezeptvorschau" className="max-h-56 w-full rounded-xl object-cover" /><Button type="button" onClick={removeImage} variant="outline" className="mt-3 rounded-xl border-stone-300 bg-white text-stone-800 hover:bg-stone-100">Bild entfernen</Button></div>}
                    </label>
                    <div className="rounded-2xl border border-stone-200 bg-white p-4">
                      <div className="space-y-3">
                        <h3 className="text-xl font-black">Zutaten</h3>
                        <label className="flex w-full items-center justify-between gap-3 rounded-xl bg-stone-50 px-3 py-2 text-sm font-semibold text-stone-700">
                          <span>Rezept für</span>
                          <div className="flex items-center gap-2">
                            <input
                              type="number"
                              min="1"
                              max="100"
                              value={form.servings || 4}
                              onChange={(event) => setForm({ ...form, servings: Math.max(1, Number(event.target.value) || 1) })}
                              className="w-20 rounded-xl border border-stone-300 bg-[#fffaf0] px-3 py-2 text-center text-base font-bold"
                            />
                            <span>Personen</span>
                          </div>
                        </label>
                      </div>
                      <div className="mt-4 space-y-3">
                        {(Array.isArray(form.ingredients) ? form.ingredients : []).map((ingredient, index) => (
                          <div key={index} className="rounded-2xl border border-stone-200 bg-stone-50 p-3">
                            <input
                              value={ingredient.name}
                              onChange={(event) => updateIngredient(index, "name", event.target.value)}
                              placeholder="Zutat, z. B. Orangensaft"
                              className="w-full min-w-0 rounded-xl border border-stone-300 bg-[#fffaf0] px-3 py-3 text-base font-semibold"
                            />
                            <div className="mt-2 grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)_48px] gap-2">
                              <input
                                type="number"
                                min="0"
                                step="any"
                                inputMode="decimal"
                                value={ingredient.amount}
                                onChange={(event) => updateIngredient(index, "amount", event.target.value)}
                                placeholder="Menge"
                                className="min-w-0 rounded-xl border border-stone-300 bg-[#fffaf0] px-3 py-3 text-base"
                              />
                              <input
                                value={ingredient.unit}
                                onChange={(event) => updateIngredient(index, "unit", event.target.value)}
                                placeholder="Einheit"
                                className="min-w-0 rounded-xl border border-stone-300 bg-[#fffaf0] px-3 py-3 text-base"
                              />
                              <button
                                type="button"
                                onClick={() => removeIngredientRow(index)}
                                className="grid min-h-12 place-items-center rounded-xl border border-stone-300 bg-white"
                                aria-label="Zutat entfernen"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                      <Button type="button" onClick={addIngredientRow} variant="outline" className="mt-3 rounded-xl border-stone-300 bg-white">
                        <Plus className="mr-2 h-4 w-4" /> Zutat hinzufügen
                      </Button>
                    </div>

                    <label className="block"><span className="mb-1 block text-sm font-semibold text-stone-600">Zubereitung</span><textarea value={form.recipe} onChange={(event) => setForm({ ...form, recipe: event.target.value })} placeholder="Zubereitungsschritte eintragen..." rows={7} className="w-full resize-none rounded-xl border border-stone-300 bg-white p-3 outline-none transition focus:border-amber-500 focus:ring-2 focus:ring-amber-100 outline-none transition focus:border-amber-500 focus:ring-2 focus:ring-amber-100 outline-none focus:border-amber-500" /></label>
                    <div className="rounded-2xl border border-stone-200 bg-white p-3 text-sm text-stone-600">{editingRecipeId ? "Du bearbeitest ein bestehendes Rezept." : `Neues Rezept wird als erstellt von ${currentUser.displayName} gespeichert.`}</div>
                    <label className="block"><span className="mb-1 block text-sm font-semibold text-stone-600">Notizen</span><textarea value={form.notes} onChange={(event) => setForm({ ...form, notes: event.target.value })} placeholder="Wer hat gekocht? Was würdet ihr ändern?" rows={4} className="w-full resize-none rounded-xl border border-stone-300 bg-white p-3 outline-none transition focus:border-amber-500 focus:ring-2 focus:ring-amber-100 outline-none transition focus:border-amber-500 focus:ring-2 focus:ring-amber-100 outline-none focus:border-amber-500" /></label>
                    <div className="flex flex-wrap gap-3"><Button onClick={saveRecipe} className="rounded-2xl bg-amber-400 px-5 py-6 text-stone-950 hover:bg-amber-300"><Plus className="mr-2 h-4 w-4" /> {editingRecipeId ? "Änderungen speichern" : "Neues Rezept speichern"}</Button><Button onClick={editingRecipeId ? () => startDeleteRecipeChallenge() : clearRecipe} variant="outline" className="rounded-2xl border-stone-300 bg-transparent px-5 py-6 text-stone-800 hover:bg-stone-100"><Trash2 className="mr-2 h-4 w-4" /> {editingRecipeId ? "Rezept löschen" : "Zurücksetzen"}</Button></div>
                  </div>

                  <div className="mt-6 rounded-2xl border border-stone-200 bg-white p-4">
                    <h3 className="mb-3 text-lg font-black">Rezepte für {selected}</h3>
                    <div className="space-y-3">
                      {(Array.isArray(recipes[selected]) ? recipes[selected] : []).map((recipe) => (
                        <button key={recipe.id} onClick={() => openRecipe(recipe, selected)} className="w-full rounded-2xl border border-stone-200 bg-[#fffaf0] p-3 text-left transition hover:border-amber-400 hover:bg-amber-50">
                          {recipe.image && <img src={recipe.image} alt={recipe.dish} className="mb-3 h-28 w-full rounded-xl object-cover" />}
                          <div className="flex items-start justify-between gap-3"><div><p className="font-bold">{recipe.dish}</p><p className="text-xs text-stone-500">{recipe.category || "Hauptgericht"} · erstellt von {recipe.createdByName || recipe.createdBy}{recipe.sourceUrl ? " · mit Original-Link" : ""}</p></div><Button type="button" onClick={(event) => { event.stopPropagation(); editRecipe(recipe); }} variant="outline" className="rounded-xl border-stone-300 bg-white px-3 py-2 text-xs text-stone-800 hover:bg-stone-100">Bearbeiten</Button></div>
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
            className="w-full max-w-md rounded-[1.75rem] border border-stone-200 bg-[#fffaf0]/95 shadow-[0_12px_30px_rgba(76,54,28,.08)] p-6 shadow-2xl"
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
                className="w-full rounded-xl border border-stone-300 bg-white p-3 outline-none transition focus:border-amber-500 focus:ring-2 focus:ring-amber-100 outline-none transition focus:border-amber-500 focus:ring-2 focus:ring-amber-100 outline-none focus:border-amber-500"
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
          <div className="w-full max-w-md rounded-[1.75rem] border border-stone-200 bg-[#fffaf0]/95 shadow-[0_12px_30px_rgba(76,54,28,.08)] p-6 shadow-2xl">
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
      <RecipeModal
        openedRecipe={openedRecipe}
        currentUser={currentUser}
        setRating={setRating}
        onClose={closeRecipe}
        onEdit={editRecipeFromModal}
        isFavorite={Boolean(openedRecipe && favoriteRecipeIds.includes(openedRecipe.id))}
        onToggleFavorite={toggleFavorite}
        onAddToShoppingList={addRecipeToShoppingList}
        onPlanRecipe={openPlanForRecipe}
      />

      {shoppingListOpen && (
        <div className="fixed inset-0 z-[120] flex items-end justify-center bg-black/45 p-0 backdrop-blur-sm sm:items-center sm:p-4" onClick={() => setShoppingListOpen(false)}>
          <div className="max-h-[85vh] w-full max-w-2xl overflow-auto rounded-[1.75rem] border border-stone-200 bg-[#fffaf0]/95 shadow-[0_12px_30px_rgba(76,54,28,.08)] p-6 shadow-2xl" onClick={(event) => event.stopPropagation()}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm uppercase tracking-wide text-amber-700">Einkaufen</p>
                <h2 className="text-2xl font-black tracking-tight md:text-3xl">Einkaufsliste</h2>
                <p className="mt-1 text-sm text-stone-500">{combinedShoppingItems.length} Position{combinedShoppingItems.length === 1 ? "" : "en"} · gleiche Zutaten werden zusammengefasst</p>
              </div>
              <Button type="button" variant="outline" onClick={() => setShoppingListOpen(false)} className="rounded-xl bg-white">Schließen</Button>
            </div>

            <div className="mt-5 rounded-2xl border border-stone-200 bg-white p-4">
              <p className="mb-3 font-black">Manuell hinzufügen</p>
              <div className="grid gap-2 sm:grid-cols-[100px_100px_1fr_auto]">
                <input
                  inputMode="decimal"
                  value={shoppingDraft.amount}
                  onChange={(event) => setShoppingDraft((current) => ({ ...current, amount: event.target.value.replace(",", ".").replace(/[^0-9.]/g, "") }))}
                  placeholder="Menge"
                  className="min-w-0 rounded-xl border border-stone-300 bg-[#fffaf0] px-3 py-3"
                />
                <input
                  value={shoppingDraft.unit}
                  onChange={(event) => setShoppingDraft((current) => ({ ...current, unit: event.target.value }))}
                  placeholder="Einheit"
                  className="min-w-0 rounded-xl border border-stone-300 bg-[#fffaf0] px-3 py-3"
                />
                <input
                  value={shoppingDraft.name}
                  onChange={(event) => setShoppingDraft((current) => ({ ...current, name: event.target.value }))}
                  onKeyDown={(event) => { if (event.key === "Enter") addManualShoppingItem(); }}
                  placeholder="z. B. Brot, Cola, Küchenrolle..."
                  className="min-w-0 rounded-xl border border-stone-300 bg-[#fffaf0] px-3 py-3"
                />
                <Button type="button" onClick={addManualShoppingItem} disabled={!shoppingDraft.name.trim()} className="rounded-xl bg-stone-900 font-black text-white shadow-sm transition hover:bg-stone-800">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="mt-5 space-y-5">
              {Object.entries(groupedShoppingItems).map(([category, items]) => (
                <div key={category}>
                  <h3 className="mb-2 text-sm font-black uppercase tracking-wide text-amber-700">{category}</h3>
                  <div className="space-y-2">
                    {items.map((item) => (
                      <label key={item.ids.join("-")} className={`flex cursor-pointer items-center gap-3 rounded-xl border border-stone-200 bg-white p-3 ${item.checked ? "opacity-50" : ""}`}>
                        <input
                          type="checkbox"
                          checked={item.checked}
                          onChange={async () => {
                            const nextChecked = !item.checked;
                            const { error } = await supabase
                              .from("weltkochen_shopping_items")
                              .update({ checked: nextChecked })
                              .in("id", item.ids);
                            if (!error) await loadShoppingList();
                          }}
                          className="h-5 w-5"
                        />
                        <div className="min-w-0 flex-1">
                          <div className={item.checked ? "line-through" : ""}>
                            <b>{item.amount === "" ? "" : formatIngredientAmount(item.amount)} {item.unit}</b> {item.name}
                          </div>
                          <div className="text-xs text-stone-500">{item.recipeNames.join(" · ")}</div>
                        </div>
                        <div className="flex shrink-0 gap-1">
                          <button type="button" onClick={(event) => { event.preventDefault(); editCombinedShoppingItem(item); }} className="rounded-lg border border-stone-300 bg-white px-2 py-1 text-xs font-bold">Ändern</button>
                          <button type="button" onClick={(event) => { event.preventDefault(); deleteCombinedShoppingItem(item); }} className="rounded-lg border border-red-200 bg-red-50 px-2 py-1 text-xs font-bold text-red-700">×</button>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              ))}
              {!combinedShoppingItems.length && <p className="rounded-xl bg-white p-4 text-stone-500">Noch nichts auf der Einkaufsliste.</p>}
            </div>

            <div className="mt-5 flex justify-end">
              <Button type="button" variant="outline" onClick={clearShoppingList} disabled={!shoppingList.length} className="rounded-xl border-red-300 bg-red-50 text-red-700">
                <Trash2 className="mr-2 h-4 w-4" /> Liste leeren
              </Button>
            </div>
          </div>
        </div>
      )}
      {tutorialOpen && currentUser && (
        <div className="fixed inset-0 z-[200] flex items-end justify-center bg-stone-950/70 p-0 backdrop-blur-md sm:items-center sm:p-5">
          <div className="relative w-full max-w-2xl overflow-hidden rounded-t-[2rem] border border-white/10 bg-[#fffaf0] text-stone-900 shadow-[0_35px_100px_rgba(0,0,0,.35)] sm:rounded-[2rem]">
            <div className="absolute inset-x-0 top-0 h-1.5 bg-stone-200">
              <div className="h-full bg-amber-400 transition-all duration-300" style={{ width: `${((tutorialStep + 1) / tutorialSteps.length) * 100}%` }} />
            </div>
            <div className="relative overflow-hidden bg-stone-900 p-6 text-white sm:p-8">
              <div className="pointer-events-none absolute -right-14 -top-14 h-40 w-40 rounded-full bg-amber-400/15 blur-3xl" />
              <div className="relative flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.16em] text-amber-300">{tutorialSteps[tutorialStep].eyebrow} · {tutorialStep + 1}/{tutorialSteps.length}</p>
                  <h2 className="mt-2 max-w-xl text-2xl font-black tracking-tight sm:text-3xl">{tutorialSteps[tutorialStep].title}</h2>
                </div>
                <div className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-white/10 text-3xl">{tutorialSteps[tutorialStep].icon}</div>
              </div>
            </div>
            <div className="p-6 sm:p-8">
              <p className="text-base leading-7 text-stone-600">{tutorialSteps[tutorialStep].text}</p>
              <div className="mt-7 flex flex-wrap items-center gap-2">
                {tutorialSteps.map((step, index) => (
                  <button key={`${step.title}-${index}`} type="button" onClick={() => setTutorialStep(index)} className={`h-2.5 rounded-full transition-all ${index === tutorialStep ? "w-8 bg-amber-400" : "w-2.5 bg-stone-300 hover:bg-stone-400"}`} aria-label={`Tutorial Schritt ${index + 1}`} />
                ))}
              </div>
              <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
                <button type="button" onClick={() => closeTutorial(true)} className="rounded-xl px-4 py-3 text-sm font-bold text-stone-500 transition hover:bg-stone-100 hover:text-stone-800">Tutorial überspringen</button>
                <div className="flex gap-2">
                  {tutorialStep > 0 && <button type="button" onClick={() => setTutorialStep((step) => Math.max(0, step - 1))} className="flex-1 rounded-xl border border-stone-300 bg-white px-4 py-3 text-sm font-black shadow-sm hover:bg-stone-50 sm:flex-none">← Zurück</button>}
                  {tutorialStep < tutorialSteps.length - 1 ? (
                    <button type="button" onClick={() => setTutorialStep((step) => Math.min(tutorialSteps.length - 1, step + 1))} className="flex-1 rounded-xl bg-stone-900 px-5 py-3 text-sm font-black text-white shadow-sm hover:bg-stone-800 sm:flex-none">Weiter →</button>
                  ) : (
                    <button type="button" onClick={() => closeTutorial(true)} className="flex-1 rounded-xl bg-amber-400 px-5 py-3 text-sm font-black text-stone-950 shadow-sm hover:bg-amber-300 sm:flex-none">🚀 Weltreise starten</button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={restartTutorial}
        className="absolute right-3 z-[109] grid h-11 w-11 place-items-center rounded-2xl border border-stone-200 bg-white text-stone-800 shadow-lg md:hidden"
        style={{ top: Math.max(0, mobileNavTop - 54) }}
        title="Tutorial erneut starten"
        aria-label="Tutorial erneut starten"
      >
        <Sparkles className="h-5 w-5" />
      </button>

      {currentUser.role === "admin" && (
        <button
          type="button"
          onClick={() => navigateTo("admin")}
          className="absolute right-[4.1rem] z-[109] flex h-11 items-center gap-2 rounded-2xl border border-stone-200 bg-white px-3 text-xs font-black text-stone-800 shadow-lg md:hidden"
          style={{ top: Math.max(0, mobileNavTop - 54) }}
          title="Admin öffnen"
        >
          <BarChart3 className="h-4 w-4" /> Admin
        </button>
      )}

      <nav
        className="absolute left-0 right-0 z-[110] border-t border-stone-200 bg-[#fffaf0] px-2 pt-2 md:hidden"
        style={{
          top: mobileNavTop,
          minHeight: 78,
          paddingBottom: "max(.55rem, env(safe-area-inset-bottom))",
        }}
      >
        <div className="mx-auto grid max-w-lg grid-cols-5 gap-1">
          {[
            ["karte", "Karte", Globe2],
            ["details", "Rezept", BookOpen],
            ["favoriten", "Favoriten", Heart],
            ["kochplan", "Kochplan", CalendarDays],
          ].map(([target, label, Icon]) => (
            <button
              key={target}
              type="button"
              onClick={() => navigateTo(target)}
              className={`flex min-w-0 flex-col items-center gap-1 rounded-xl px-1 py-2 text-[11px] font-black transition ${page === target ? "bg-stone-900 text-white shadow-sm" : "text-stone-500"}`}
            >
              <Icon className="h-5 w-5" />
              <span className="truncate">{label}</span>
            </button>
          ))}
          <button
            type="button"
            onClick={() => setShoppingListOpen(true)}
            className="relative flex min-w-0 flex-col items-center gap-1 rounded-xl px-1 py-2 text-[11px] font-bold text-stone-500"
          >
            <ShoppingCart className="h-5 w-5" />
            <span>Einkauf</span>
            {combinedShoppingItems.length > 0 && (
              <span className="absolute right-2 top-0 grid min-h-5 min-w-5 place-items-center rounded-full bg-stone-900 px-1 text-[10px] text-white">
                {combinedShoppingItems.length > 99 ? "99+" : combinedShoppingItems.length}
              </span>
            )}
          </button>
        </div>
      </nav>

    </div>
  );
}
