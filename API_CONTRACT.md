# Frontend–Backend API Contract

This document defines how the Svelte frontend communicates with the backend recommendation system for the recipe data storytelling project.

The frontend is responsible for collecting user choices from the interactive kitchen interface.  
The backend is responsible for preprocessing the recipe CSV, matching a suitable recipe, and returning the selected recipe together with storytelling outputs.

---

## 1. Endpoint

### Request

```http
POST /api/recommend-recipe
```

During local development, the frontend uses the base URL from:

```env
VITE_API_BASE_URL=http://localhost:8000
```

So the local request URL is usually:

```text
http://localhost:8000/api/recommend-recipe
```

---

## 2. Frontend request payload

The frontend sends the user persona and selected filter values.

```json
{
  "persona": "busy-student",
  "filters": {
    "dish_type": "lunch-dinner",
    "format": "food",
    "nutrition_goal": "high-protein",
    "cooking_time": "15-30",
    "effort": "very-simple",
    "ingredient_groups": ["legumes", "grains-starches"],
    "avoid_ingredients": ["pork"]
  }
}
```

---

## 3. Request fields

### 3.1 `persona`

Selected by the user from the Profile question.

Allowed values:

```text
busy-student
fitness-focused
budget-conscious
comfort-food
family
```

Meaning:

| Value | Meaning |
|---|---|
| `busy-student` | Quick, cheap, realistic meals |
| `fitness-focused` | Protein and nutrition focused |
| `budget-conscious` | Affordable pantry-friendly meals |
| `comfort-food` | Cozy and satisfying meals |
| `family` | Shareable and family-friendly meals |

---

### 3.2 `filters.dish_type`

Selected from the Dish Type question.

Allowed values:

```text
breakfast
lunch-dinner
snack-appetizer
dessert
soup-salad
bread-bakery
```

Suggested CSV matching source:

```text
search_terms, tags, name
```

Suggested matching rules:

| Value | Matching keywords |
|---|---|
| `breakfast` | breakfast, brunch |
| `lunch-dinner` | dinner, lunch, main-dish, main |
| `snack-appetizer` | snack, appetizer, finger-food |
| `dessert` | dessert, cake, cookie, pie, brownie, candy |
| `soup-salad` | soup, stew, chili, salad |
| `bread-bakery` | bread, muffin, biscuit, rolls, quick-bread |

---

### 3.3 `filters.format`

Selected from the Food or Drink question.

Allowed values:

```text
food
drink
smoothie
no-preference
```

Suggested CSV matching source:

```text
search_terms, tags, name
```

Suggested matching rules:

| Value | Matching rule |
|---|---|
| `food` | Default category |
| `drink` | beverage, drink, cocktail, punch, tea, coffee |
| `smoothie` | smoothie, shake |
| `no-preference` | No filter |

---

### 3.4 `filters.nutrition_goal`

Selected from the Nutrition Goal question.

Allowed values:

```text
high-protein
low-calorie
low-fat
low-sugar
balanced-meal
no-nutrition-priority
```

Suggested CSV source:

```text
nutrition
```

Nutrition value order in the original CSV:

```text
[
  calories,
  total fat PDV,
  sugar PDV,
  sodium PDV,
  protein PDV,
  saturated fat PDV,
  carbohydrates PDV
]
```

Suggested matching rules:

| Value | Rule |
|---|---|
| `high-protein` | protein PDV >= 50 |
| `low-calorie` | calories <= 350 |
| `low-fat` | total fat PDV <= 20 and saturated fat PDV <= 15 |
| `low-sugar` | sugar PDV <= 10 |
| `balanced-meal` | 250–650 calories, protein PDV >= 15, no extreme fat/sugar/sodium |
| `no-nutrition-priority` | No filter |

---

### 3.5 `filters.cooking_time`

Selected from the Cooking Time question.

Allowed values:

```text
0-15
15-30
30-60
no-limit
```

Suggested CSV source:

```text
minutes
```

Suggested matching rules:

| Value | Rule |
|---|---|
| `0-15` | minutes <= 15 |
| `15-30` | 16 <= minutes <= 30 |
| `30-60` | 31 <= minutes <= 60 |
| `no-limit` | No filter |

Recipes above 60 or 90 minutes can be excluded from the main demo dataset because the original dataset contains extreme time outliers.

---

### 3.6 `filters.effort`

Selected from the Effort question.  
In the frontend, this question is assigned to the pot / pan object.

Allowed values:

```text
very-simple
few-dishes
standard-cooking
full-cooking
```

Suggested CSV sources:

```text
n_ingredients, n_steps, minutes
```

Suggested matching rules:

| Value | Rule |
|---|---|
| `very-simple` | n_ingredients <= 6, n_steps <= 6, minutes <= 30 |
| `few-dishes` | n_steps <= 8, preferably easy / one-dish tags |
| `standard-cooking` | n_ingredients <= 12, n_steps <= 15, minutes <= 60 |
| `full-cooking` | No strict filter, but still exclude extreme recipes |

---

### 3.7 `filters.ingredient_groups`

Selected from the Ingredients question.

Allowed values:

```text
poultry
meat
seafood
eggs-dairy
legumes
grains-starches
vegetables-fruit
```

The frontend also has a `not-sure` option, but it is not sent to the backend.  
If the user selects `not-sure`, the frontend sends:

```json
"ingredient_groups": []
```

Suggested CSV source:

```text
ingredients
```

Suggested ingredient grouping rules:

| Value | Keywords |
|---|---|
| `poultry` | chicken, turkey, duck |
| `meat` | beef, pork, lamb, ham, bacon, sausage |
| `seafood` | fish, salmon, tuna, shrimp, crab, scallop |
| `eggs-dairy` | egg, milk, cheese, yogurt, butter, cream |
| `legumes` | beans, lentils, chickpeas, tofu, tempeh, peas |
| `grains-starches` | rice, pasta, noodles, potato, bread, oats, flour, tortilla |
| `vegetables-fruit` | onion, tomato, carrot, spinach, mushroom, apple, banana, lemon |

---

### 3.8 `filters.avoid_ingredients`

Selected from the Allergy / Ingredients to Avoid question.

Allowed values:

```text
nuts
dairy
gluten-wheat
seafood
eggs
soy
pork
```

The frontend also has a `no-allergy` option, but it is not sent to the backend.  
If the user selects `no-allergy`, the frontend sends:

```json
"avoid_ingredients": []
```

Suggested CSV source:

```text
ingredients
```

Suggested exclusion rules:

| Value | Exclusion keywords |
|---|---|
| `nuts` | peanut, almond, walnut, pecan, cashew, pistachio, hazelnut |
| `dairy` | milk, cheese, butter, cream, yogurt, sour cream, whey |
| `gluten-wheat` | wheat, flour, bread, pasta, noodles, barley, rye |
| `seafood` | fish, shrimp, crab, lobster, scallop, clam, oyster, salmon, tuna |
| `eggs` | egg, eggs, mayonnaise |
| `soy` | soy sauce, tofu, soy milk, edamame, tempeh, miso |
| `pork` | pork, bacon, ham, prosciutto, pancetta, lard, pepperoni |

---

## 4. Expected backend response

The backend should return one matched recipe, match reasons, and two story outputs.

```json
{
  "selected_recipe": {
    "id": "recipe-001",
    "name": "Mediterranean Chickpea Rice Bowl",
    "description": "A quick high-protein meal for a busy student week.",
    "minutes": 20,
    "ingredients": ["chickpeas", "rice", "tomatoes", "cucumber"],
    "nutrition": {
      "calories": 420,
      "fat_pdv": 18,
      "sugar_pdv": 8,
      "sodium_pdv": 22,
      "protein_pdv": 55,
      "saturated_fat_pdv": 10,
      "carbohydrates_pdv": 16
    },
    "tags": {
      "dish_type": ["lunch-dinner"],
      "format": ["food"],
      "nutrition_goal": ["high-protein"],
      "cooking_time": ["15-30"],
      "effort": ["very-simple"],
      "ingredient_groups": ["legumes", "grains-starches"],
      "avoid_safe_for": ["pork-free"]
    }
  },
  "match_reasons": [
    "Matches your high-protein goal",
    "Fits within 15–30 minutes",
    "Avoids pork ingredients"
  ],
  "human_story": "This recipe is selected because it fits the user's profile, time limit, nutrition goal, and allergy restrictions.",
  "llm_story": "After a long day, this meal gives the user a practical and comforting way to eat well without spending too much time in the kitchen."
}
```

---

## 5. Response field requirements

### `selected_recipe`

Required.

| Field | Type | Description |
|---|---|---|
| `id` | string or number | Unique recipe ID |
| `name` | string | Recipe name |
| `description` | string | Short recipe description |
| `minutes` | number | Cooking time in minutes |
| `ingredients` | array of strings | Ingredient list |
| `nutrition` | object | Parsed nutrition values |
| `tags` | object | Backend-generated recipe tags |

---

### `selected_recipe.nutrition`

Required.

| Field | Type | Description |
|---|---|---|
| `calories` | number | Calories |
| `fat_pdv` | number | Total fat percentage daily value |
| `sugar_pdv` | number | Sugar percentage daily value |
| `sodium_pdv` | number | Sodium percentage daily value |
| `protein_pdv` | number | Protein percentage daily value |
| `saturated_fat_pdv` | number | Saturated fat percentage daily value |
| `carbohydrates_pdv` | number | Carbohydrates percentage daily value |

---

### `match_reasons`

Required.

An array of short human-readable reasons explaining why this recipe was selected.

Example:

```json
[
  "Matches your high-protein goal",
  "Fits within 15–30 minutes",
  "Avoids pork ingredients"
]
```

---

### `human_story`

Required.

A curated or manually written recipe storytelling paragraph.

---

### `llm_story`

Required.

An LLM-generated recipe storytelling paragraph based on:

```text
persona
selected recipe
nutrition values
ingredients
match reasons
```

---

## 6. Frontend behavior

The frontend will:

1. Collect user answers from the interactive kitchen interface.
2. Build the request payload.
3. Send a POST request to `/api/recommend-recipe`.
4. Show a loading state while waiting.
5. Display the returned recipe story in a modal.
6. Show an error message if the request fails.

If the backend is not running locally, the frontend will show:

```text
Failed to generate recipe story. Please try again.
```

---

## 7. CORS requirement

During local development, the frontend usually runs on:

```text
http://localhost:5173
```

The backend usually runs on:

```text
http://localhost:8000
```

Because these are different ports, the backend must allow CORS from the frontend origin.

For FastAPI, the backend can use:

```python
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

---

## 8. Notes

The frontend should not parse the raw CSV directly.

The backend or preprocessing script should handle:

- cleaning the CSV
- parsing nutrition values
- generating broad recipe tags
- grouping ingredients
- filtering allergies or avoided ingredients
- selecting 100–150 useful demo recipes
- matching user answers to recipes
- returning the selected recipe and story outputs