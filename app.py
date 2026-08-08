
from __future__ import annotations

import ast
import json
import os
import random
import re
from functools import lru_cache
from typing import Optional

import pandas as pd
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field


HUMAN_STORIES = {
    31490: """Thinking pizza is only for a quick dinner? Here’s a bit different pizza for a wonderful morning! It has all you need for a traditional pizza and breakfast: eggs, milk, sausages, etc. Might it be hard to make with all these ingredients? It only takes 9 steps and you can easily fit this cooking into just 30 minutes! Following this recipe you will only take in 173.4 calories as well as a warm, fulfilled feeling of the whole resting day!

Roll out of bed and start making yourself a delicious yet bit different morning pizza right now! 😆""",

    37654: """If you are cooking a quick dessert for your family while also maintaining it low calorie, I can highly recommend this banana pineapple freeze! It is a very healthy mixture of fresh fruits like banana, lemon, orange and pineapple. This is a great way to entertain the sweet tooth of your family in a nutritional way. This recipe has only 48 calories per 100 grams and very low content of sugars, carbohydrates and fat. It also follows your restriction of no dairy for a very simple recipe. Gather your ingredients after coming back from a busy work day and just blend them all in, nothing more to think about. Enjoy your dessert! 🍍🍌""",

    338753: """If you have just arrived home after attending a lecture or exhausted from back to back group projects, with only thirty minutes before the next class you need a quick comforting meal with no pork, no hassle🤷. Just prepare two slices of sourdough and stack them high with sharp cheddar, silky mozzarella, provolone, Swiss, and a dusting of parmesan. As the sandwich sizzles in the skillet, the cheeses melt into a rich, golden blanket.

One crunchy, gooey bite is all it takes to recharge. Fully satisfied and energized, you can head back out, ready to conquer the rest of the day. ✌️"""
}

RECIPES_CSV = os.getenv(
    "RECIPES_CSV",
    os.path.expanduser("~/Downloads/RAW_recipes_with_search_terms.csv"),
)
HF_TOKEN = os.getenv("HF_TOKEN", "")
STORY_MODEL = os.getenv("STORY_MODEL", "meta-llama/Llama-3.1-8B-Instruct")
MAX_RECIPES = int(os.getenv("MAX_RECIPES", "40000"))
LLM_STORIES_FILE = os.getenv("LLM_STORIES_FILE", "output_gpt_oss_120b.json")

_LLM_STORIES: dict[int, str] = {}


def _load_llm_stories() -> None:
    global _LLM_STORIES
    path = LLM_STORIES_FILE
    if not os.path.exists(path):
        print(f"[llm] stories file not found at {path} — llm_story will be empty")
        return
    with open(path) as f:
        data = json.load(f)
    _LLM_STORIES = {int(item["recipe_id"]): item["llm_story"] for item in data}
    print(f"[llm] loaded {len(_LLM_STORIES)} pre-generated stories from {path}")


_load_llm_stories()


GOALS = {"build muscle", "lose weight", "eat healthier", "save money"}
SKILLS = {"beginner", "intermediate", "advanced"}
BUDGETS = {"low", "medium", "high"}   # kept for optional use


ALLERGEN_SYNONYMS = {
    "nuts": ["nut", "almond", "cashew", "walnut", "pecan", "pistachio",
             "hazelnut", "macadamia", "peanut"],
    "peanut": ["peanut"],
    "dairy": ["milk", "butter", "cheese", "cream", "yogurt", "yoghurt",
              "ghee", "custard", "whey"],
    "milk": ["milk", "butter", "cheese", "cream", "yogurt", "yoghurt", "whey"],
    "egg": ["egg"], "eggs": ["egg"],
    "gluten": ["wheat", "flour", "bread", "pasta", "barley", "rye",
               "cracker", "breadcrumb"],
    "gluten-wheat": ["wheat", "flour", "bread", "pasta", "barley", "rye",
                     "cracker", "breadcrumb"],
    "shellfish": ["shrimp", "prawn", "crab", "lobster", "clam", "mussel",
                  "oyster", "scallop"],
    "seafood": ["fish", "salmon", "tuna", "cod", "tilapia", "anchovy",
                "sardine", "shrimp", "prawn", "crab", "lobster"],
    "soy": ["soy", "tofu", "edamame", "miso", "tempeh"],
    "pork": ["pork", "bacon", "ham", "sausage", "prosciutto", "pancetta",
             "chorizo", "lard", "pepperoni"],
    "beef": ["beef", "steak"],
    "shrimp": ["shrimp", "prawn"],
}

DISH_TYPE_TAGS = {
    "breakfast":      ["breakfast", "brunch"],
    "lunch-dinner":   ["main-dish", "lunch", "dinner-party", "main-course"],
    "lunch/dinner":   ["main-dish", "lunch", "dinner-party", "main-course"],
    "snack":          ["snacks", "appetizers"],
    "snack-appetizer":["snacks", "appetizers", "finger-food"],
    "dessert":        ["desserts", "cake", "cookie", "pie", "brownie"],
    "soup-salad":     ["soups-stews", "salads"],
    "bread-bakery":   ["breads", "quick-breads", "muffins"],
}

INGREDIENT_CATEGORY = {
    "grains-starches":    ["rice", "pasta", "bread", "potato", "quinoa", "oats",
                           "couscous", "flour", "noodle", "barley", "tortilla"],
    "legumes-plant-protein": ["beans", "lentil", "chickpea", "tofu", "tempeh",
                              "peas", "edamame", "black beans"],
    "legumes":            ["beans", "lentil", "chickpea", "tofu", "tempeh", "peas"],
    "vegetables":         ["tomato", "onion", "carrot", "spinach", "broccoli",
                           "pepper", "zucchini", "lettuce", "mushroom"],
    "vegetables-fruit":   ["tomato", "onion", "carrot", "spinach", "apple",
                           "banana", "lemon", "mushroom"],
    "fruits":             ["apple", "banana", "lemon", "orange", "berry",
                           "mango", "lime", "pineapple"],
    "dairy":              ["milk", "cheese", "yogurt", "butter", "cream"],
    "eggs-dairy":         ["egg", "milk", "cheese", "yogurt", "butter", "cream"],
    "meat-poultry":       ["chicken", "beef", "turkey", "pork", "lamb"],
    "poultry":            ["chicken", "turkey", "duck"],
    "meat":               ["beef", "pork", "lamb", "ham", "bacon", "sausage"],
    "seafood":            ["fish", "salmon", "shrimp", "tuna", "cod"],
    "eggs":               ["egg"],
    "nuts-seeds":         ["almond", "walnut", "peanut", "cashew", "seed", "pecan"],
}


_GOAL_MAP = {
    "high-protein":          "build muscle",
    "build-muscle":          "build muscle",
    "muscle":                "build muscle",
    "protein":               "build muscle",
    "low-calorie":           "lose weight",
    "weight-loss":           "lose weight",
    "lose-weight":           "lose weight",
    "low-cal":               "lose weight",
    "balanced-meal":         "eat healthier",
    "healthy":               "eat healthier",
    "eat-healthier":         "eat healthier",
    "balanced":              "eat healthier",
    "wellness":              "eat healthier",
    "no-nutrition-priority": "eat healthier",
    "low-fat":               "eat healthier",
    "low-sugar":             "eat healthier",
    "budget":                "save money",
    "cheap":                 "save money",
    "save-money":            "save money",
}


_EFFORT_MAP = {
    "very-simple":    "beginner",
    "simple":         "beginner",
    "easy":           "beginner",
    "beginner":       "beginner",
    "quick":          "beginner",
    "few-dishes":     "intermediate",
    "medium":         "intermediate",
    "moderate":       "intermediate",
    "intermediate":   "intermediate",
    "standard-cooking": "intermediate",
    "complex":        "advanced",
    "hard":           "advanced",
    "advanced":       "advanced",
    "full-cooking":   "advanced",
    "chef":           "advanced",
}


_DISH_MAP = {
    "breakfast":       "breakfast",
    "brunch":          "breakfast",
    "lunch-dinner":    "lunch-dinner",
    "lunch/dinner":    "lunch-dinner",
    "lunch":           "lunch-dinner",
    "dinner":          "lunch-dinner",
    "main":            "lunch-dinner",
    "snack":           "snack",
    "snacks":          "snack",
    "snack-appetizer": "snack-appetizer",
    "appetizer":       "snack-appetizer",
    "dessert":         "dessert",
    "desserts":        "dessert",
    "sweet":           "dessert",
    "soup-salad":      "soup-salad",
    "soup":            "soup-salad",
    "salad":           "soup-salad",
    "bread-bakery":    "bread-bakery",
    "bread":           "bread-bakery",
}


NUTR_CAL, NUTR_PROTEIN = 0, 4


class NutritionRaw(BaseModel):
    """Food.com nutrition — all except calories are % daily value."""
    calories: Optional[float] = None
    total_fat_pct_dv: Optional[float] = None
    sugar_pct_dv: Optional[float] = None
    sodium_pct_dv: Optional[float] = None
    protein_pct_dv: Optional[float] = None
    saturated_fat_pct_dv: Optional[float] = None
    carbohydrates_pct_dv: Optional[float] = None


class RecipeStory(BaseModel):
    recipe_id: int
    name: str
    description: str = ""
    tags: list[str] = []
    minutes: int = 0
    n_steps: int = 0
    tagline: str
    ingredients: list[str]
    nutrition_raw: NutritionRaw
    why_it_fits: list[str]
    human_story: str | None = None
    llm_story: str = ""        # pre-generated story; empty if none available



class Profile(BaseModel):
    persona: str = "busy student"
    dish_type: Optional[str] = None
    goal: str = "eat healthier"
    max_time: int = 60
    want_ingredients: list[str] = Field(default_factory=list)
    skill: str = "intermediate"
    avoid: list[str] = Field(default_factory=list)



class FrontendAnswers(BaseModel):
    model_config = {"extra": "allow"}
    dishType: Optional[str] = None
    nutritionGoal: Optional[str] = None
    time: Optional[str] = None
    ingredients: list[str] = Field(default_factory=list)
    avoid: list[str] = Field(default_factory=list)
    effort: Optional[str] = None


class FrontendRequest(BaseModel):
    model_config = {"extra": "allow"}
    persona: Optional[str] = None
    answers: FrontendAnswers = Field(default_factory=FrontendAnswers)


def _norm(s: Optional[str]) -> str:
    return (s or "").strip().lower().replace("_", "-").replace(" ", "-")


def _time_to_minutes(t: Optional[str]) -> int:
    """'15-30' -> 30 (upper bound). Forgiving of plain numbers or junk."""
    if not t:
        return 60
    digits = [int(x) for x in re.findall(r"\d+", str(t))]
    if not digits:
        return 60
    upper = max(digits)
    return upper if upper > 0 else 60


def _expand_ingredient_categories(items: list[str]) -> list[str]:
    out: list[str] = []
    for it in items:
        key = _norm(it)
        out.extend(INGREDIENT_CATEGORY.get(key, [it.strip().lower()]))
    return out


def _expand_avoid(terms: list[str]) -> list[str]:
    out: list[str] = []
    for t in terms:
        t = _norm(t)
        if not t:
            continue
        out.extend(ALLERGEN_SYNONYMS.get(t, [t]))
    return sorted(set(out))


def frontend_to_profile(req: FrontendRequest) -> Profile:
    a = req.answers
    persona = (_norm(req.persona) or "busy-student").replace("-", " ")
    dish = _DISH_MAP.get(_norm(a.dishType))
    goal = _GOAL_MAP.get(_norm(a.nutritionGoal), "eat healthier")
    skill = _EFFORT_MAP.get(_norm(a.effort), "intermediate")
    return Profile(
        persona=persona,
        dish_type=dish,
        goal=goal,
        max_time=_time_to_minutes(a.time),
        want_ingredients=_expand_ingredient_categories(a.ingredients),
        skill=skill,
        avoid=[x.strip().lower() for x in a.avoid if x and x.strip()],
    )


_SAMPLE = [
    {"id": 338753, "name": "5 Cheese Grilled Cheese",
     "minutes": 20, "n_steps": 6,
     "ingredients": ["sourdough bread", "butter", "parmesan cheese",
                     "swiss cheese", "provolone cheese", "mozzarella cheese",
                     "cheddar cheese"],
     "steps": ["Spread butter on bread.", "Pat in parmesan.", "Place in skillet.",
               "Add cheese slices.", "Cook until golden.", "Sandwich and serve."],
     "nutrition": [1123.2, 102.0, 6.0, 96.0, 117.0, 199.0, 23.0],
     "tags": ["30-minutes-or-less", "lunch", "high-protein"],
     "description": "A decadent five-cheese grilled cheese sandwich."},
    {"id": 62078, "name": "Zucchini Puffs",
     "minutes": 15, "n_steps": 6,
     "ingredients": ["zucchini", "cheddar cheese", "hot pepper sauce",
                     "mayonnaise", "salt", "pepper"],
     "steps": ["Mix ingredients.", "Spoon onto tray.", "Bake until golden.",
               "Cool briefly.", "Serve warm.", "Enjoy."],
     "nutrition": [101.3, 11.0, 8.0, 6.0, 9.0, 16.0, 1.0],
     "tags": ["15-minutes-or-less", "snacks", "low-carb"],
     "description": "Light and crispy zucchini bites."},
    {"id": 31490, "name": "Breakfast Pizza",
     "minutes": 30, "n_steps": 9,
     "ingredients": ["pizza crust", "sausage patty", "eggs", "milk",
                     "salt", "pepper", "cheese"],
     "steps": ["Pre-bake crust.", "Cook sausage.", "Scramble eggs with milk.",
               "Season.", "Layer sausage.", "Add eggs.", "Top with cheese.",
               "Bake.", "Serve."],
     "nutrition": [173.4, 18.0, 2.0, 17.0, 22.0, 35.0, 1.0],
     "tags": ["30-minutes-or-less", "breakfast", "high-protein"],
     "description": "A protein-rich breakfast pizza perfect for gym mornings."},
    {"id": 37654, "name": "Banana Pineapple Freeze",
     "minutes": 10, "n_steps": 3,
     "ingredients": ["banana", "orange juice", "lemon juice",
                     "crushed pineapple", "cinnamon"],
     "steps": ["Blend all ingredients.", "Pour into mould.", "Freeze until set."],
     "nutrition": [48.0, 0.0, 0.0, 0.0, 1.0, 0.0, 3.0],
     "tags": ["15-minutes-or-less", "desserts", "low-calorie", "vegan"],
     "description": "A refreshing frozen fruit dessert."},
]


def _parse_list(val):
    if isinstance(val, list):
        return val
    try:
        out = ast.literal_eval(val)
        return out if isinstance(out, list) else []
    except (ValueError, SyntaxError):
        return []


@lru_cache(maxsize=1)
def load_recipes() -> pd.DataFrame:
    if RECIPES_CSV and os.path.exists(RECIPES_CSV):
        df = pd.read_csv(RECIPES_CSV, nrows=MAX_RECIPES)
        df["ingredients"] = df["ingredients"].apply(_parse_list)
        df["steps"] = df["steps"].apply(_parse_list)
        df["nutrition"] = df["nutrition"].apply(_parse_list)
        df["tags"] = df["tags"].apply(_parse_list)
        if "search_terms" in df.columns:
            df["search_terms"] = df["search_terms"].apply(_parse_list)
        else:
            df["search_terms"] = [[] for _ in range(len(df))]

        
        df = df[df["ingredients"].map(len).between(4, 20)]
        df = df[df["n_steps"] >= 3]
        df = df[df["minutes"].between(5, 240)]

        
        def _plausible(n):
            if not isinstance(n, list) or len(n) < 7:
                return False
            cals, _fat, sugar, sodium, protein, _sat, carbs = n[:7]
            if cals <= 0 or cals > 1500:
                return False
            if protein > 120 or sugar > 200 or sodium > 200 or carbs > 150:
                return False
            return True
        df = df[df["nutrition"].apply(_plausible)]

        
        COMPONENT_TAGS = {"sauces", "condiments-etc", "savory-sauces",
                          "salad-dressings", "spreads", "marinades-and-rubs"}
        COMPONENT_WORDS = ("dough", "sauce", "marinade", "dressing",
                           "rub ", "spice mix", "seasoning mix", "batter",
                           "glaze", "frosting", "icing", "syrup")

        def _is_component(row):
            tags = row["tags"] if isinstance(row["tags"], list) else []
            if any(t in COMPONENT_TAGS for t in tags):
                return True
            return any(w in str(row["name"]).lower() for w in COMPONENT_WORDS)

        df = df[~df.apply(_is_component, axis=1)]
        df = df.reset_index(drop=True)
        print(f"[data] loaded {len(df)} recipes from {RECIPES_CSV}")
        return df

    print("[data] RECIPES_CSV not found — using built-in 4-recipe sample")
    return pd.DataFrame(_SAMPLE)




def _nutr(row, idx):
    n = row["nutrition"]
    return float(n[idx]) if isinstance(n, list) and len(n) > idx else None


def _difficulty(row) -> str:
    s = int(row["n_steps"])
    return "Easy" if s <= 6 else ("Medium" if s <= 12 else "Hard")



def select_recipe(profile: Profile):
    df = load_recipes()
    reasons: list[str] = []
    mask = pd.Series(True, index=df.index)

    
    mask &= df["minutes"] <= profile.max_time
    reasons.append(f"Time \u2264 {profile.max_time} min")

    
    if profile.dish_type and "tags" in df.columns:
        wanted_tags = DISH_TYPE_TAGS.get(profile.dish_type.lower().strip(), [])
        if wanted_tags:
            mask &= df["tags"].apply(
                lambda tags: any(t in tags for t in wanted_tags))
            reasons.append(f"Dish type: {profile.dish_type}")

    want = [w.lower().strip() for w in profile.want_ingredients if w.strip()]
    if want:
        def has_any(ings):
            joined = " ".join(ings).lower()
            return any(w in joined for w in want)
        filtered = df[df["ingredients"].apply(has_any)]
        if not filtered.empty:
            mask &= df["ingredients"].apply(has_any)
            reasons.append("Includes preferred ingredients")

    
    raw_avoid = [a for a in profile.avoid if a.strip()]
    avoid = _expand_avoid(raw_avoid)
    if avoid:
        def is_clean(ings):
            joined = " ".join(ings).lower()
            return not any(a in joined for a in avoid)
        mask &= df["ingredients"].apply(is_clean)
        reasons.append("No " + ", ".join(raw_avoid))

    
    skill_cap = {"beginner": 6, "intermediate": 12, "advanced": 999}
    cap = skill_cap.get(profile.skill, 999)
    mask &= df["n_steps"] <= cap
    reasons.append(f"{profile.skill.capitalize()}-friendly steps")

    candidates = df[mask]

    if candidates.empty:
        relaxed = df[df["minutes"] <= profile.max_time]
        candidates = relaxed if not relaxed.empty else df
        reasons.append("(some filters relaxed to find a match)")

    if profile.goal == "build muscle":
        candidates = candidates.assign(
            _p=candidates.apply(lambda r: _nutr(r, NUTR_PROTEIN) or 0, axis=1))
        candidates = candidates.sort_values("_p", ascending=False)
        reasons.append("Protein goal: ranked high-protein first")
    elif profile.goal == "lose weight":
        candidates = candidates.assign(
            _c=candidates.apply(lambda r: _nutr(r, NUTR_CAL) or 1e9, axis=1))
        candidates = candidates.sort_values("_c", ascending=True)
        reasons.append("Weight goal: ranked lower-calorie first")
    elif profile.goal == "save money":
        candidates = candidates.assign(_k=candidates["ingredients"].map(len))
        candidates = candidates.sort_values("_k", ascending=True)
        reasons.append("Save-money goal: ranked fewer-ingredient first")

    return candidates.iloc[0], reasons



def _story_prompt(profile: Profile, recipe) -> str:
    return (
        "You are a warm, encouraging cooking companion for Recipe Story AI. "
        "The recipe has ALREADY been chosen — do NOT change it or invent facts. "
        "Write a short, emotionally engaging paragraph explaining why this recipe "
        "fits the user. Include the real nutrition numbers provided.\n\n"
        f"User: {profile.persona}; goal = {profile.goal}; "
        f"dish type = {profile.dish_type or 'any'}; has {profile.max_time} min; "
        f"{profile.skill} cook; avoids {', '.join(profile.avoid) or 'nothing'}.\n"
        f"Recipe: {recipe['name']}\n"
        f"Ingredients: {', '.join(list(recipe['ingredients'])[:8])}\n"
        f"Nutrition: {recipe['nutrition']}\n"
    )


def _call_llm(prompt: str) -> Optional[str]:
    if not HF_TOKEN:
        return None
    try:
        from huggingface_hub import InferenceClient
        client = InferenceClient(model=STORY_MODEL, token=HF_TOKEN)
        resp = client.chat_completion(
            messages=[{"role": "user", "content": prompt}],
            max_tokens=350, temperature=0.8,
        )
        return resp.choices[0].message.content.strip()
    except Exception as e:
        print(f"[llm] live call failed ({type(e).__name__}: {e})")
        return None


def _template_tagline(profile: Profile, recipe) -> str:
    dish = f"{profile.dish_type} " if profile.dish_type else ""
    return (f"A {int(recipe['minutes'])}-minute {dish}meal"
            f" for a {profile.persona}.")


def _template_why(profile: Profile, recipe) -> list[str]:
    why = [
        f"Ready in {int(recipe['minutes'])} minutes — fits your "
        f"{profile.max_time}-minute limit",
        f"{profile.skill.capitalize()}-friendly with "
        f"{int(recipe['n_steps'])} simple steps",
    ]
    if profile.avoid:
        why.append(f"Avoids {', '.join(profile.avoid)}, matching your preference")
    p = _nutr(recipe, NUTR_PROTEIN)
    if profile.goal == "build muscle" and p:
        why.append("Higher-protein pick to support your muscle goal")
    else:
        why.append(f"Chosen to support your goal: {profile.goal}")
    return why



def build_story(profile: Profile, recipe, reasons: list[str]) -> RecipeStory:
    tagline = _template_tagline(profile, recipe)
    why = _template_why(profile, recipe)

    # Try live LLM first, then fall back to template tagline
    live = _call_llm(_story_prompt(profile, recipe)) if HF_TOKEN else None

    # Nutrition object
    n = recipe["nutrition"] if isinstance(recipe["nutrition"], list) else []
    def _n(i): return float(n[i]) if len(n) > i else None
    nutrition_raw = NutritionRaw(
        calories=_n(0), total_fat_pct_dv=_n(1), sugar_pct_dv=_n(2),
        sodium_pct_dv=_n(3), protein_pct_dv=_n(4),
        saturated_fat_pct_dv=_n(5), carbohydrates_pct_dv=_n(6),
    )

    def _get(key, default):
        try:
            val = recipe[key]
        except (KeyError, IndexError):
            return default
        if val is None or (isinstance(val, float) and pd.isna(val)):
            return default
        return val

    recipe_id = int(recipe["id"])

    llm_story = (
        _LLM_STORIES.get(recipe_id)
        or live
        or ""
    )
    human_story = HUMAN_STORIES.get(
        recipe_id,
        "No human-written story available yet."
    )
    return RecipeStory(
        recipe_id=recipe_id,
        name=str(recipe["name"]),
        description=str(_get("description", "")),
        tags=list(_get("tags", [])),
        minutes=int(_get("minutes", 0) or 0),
        n_steps=int(_get("n_steps", 0) or 0),
        tagline=tagline,
        ingredients=list(recipe["ingredients"]),
        nutrition_raw=nutrition_raw,
        why_it_fits=why,
        llm_story=llm_story,
        human_story=human_story,
    )



app = FastAPI(title="Recipe Story AI — backend", version="0.3")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def root():
    df = load_recipes()
    return {
        "status": "running",
        "recipes_loaded": len(df),
        "llm_stories_preloaded": len(_LLM_STORIES),
        "live_llm": "configured" if HF_TOKEN else "template-fallback",
    }


@app.post("/api/recommend-recipe", response_model=RecipeStory)
def recommend_recipe(req: FrontendRequest):
    """Primary endpoint — matches the frontend's API contract."""
    profile = frontend_to_profile(req)
    try:
        chosen, reasons = select_recipe(profile)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"selection failed: {e}")
    return build_story(profile, chosen, reasons)


@app.post("/recipe", response_model=RecipeStory)
def recipe_alias(req: FrontendRequest):
    """Alias — same logic, shorter URL for testing."""
    return recommend_recipe(req)



class RatingRequest(BaseModel):
    recipe_id: int
    clarity: int = Field(ge=1, le=5)
    helpfulness: int = Field(ge=1, le=5)
    warmth: int = Field(ge=1, le=5)
    comment: str = ""


_RATINGS: list[dict] = []


@app.post("/evaluate/rating")
def submit_rating(req: RatingRequest):
    _RATINGS.append(req.model_dump())
    n = len(_RATINGS)
    avg = {k: round(sum(r[k] for r in _RATINGS) / n, 2)
           for k in ("clarity", "helpfulness", "warmth")}
    return {"saved": True, "count": n, "averages": avg}