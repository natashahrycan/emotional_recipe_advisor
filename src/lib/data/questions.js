import avatar from '$lib/assets/kitchen/avatar.png';
import chopboard from '$lib/assets/kitchen/chopboard.png';
import clock from '$lib/assets/kitchen/clock.png';
import goalBoard from '$lib/assets/kitchen/goal_board.png';
import recipeBook from '$lib/assets/kitchen/recipe_book.png';
import recycleBin from '$lib/assets/kitchen/recycle_bin.png';
import refridge from '$lib/assets/kitchen/refridge.png';
import stewpotFrypan from '$lib/assets/kitchen/stewpot_frypan.png';
import winebottle from '$lib/assets/kitchen/winebottle.png';

export const hotspots = [
  {
    id: 'profile',
    label: 'Profile',
    stepLabel: 'Who',
    asset: avatar,
    answerKey: 'userType',
    type: 'single',
    question: 'Who are we cooking for?',
    helper: 'This decides the tone and context of the recipe story.',
    options: [
      { label: 'Busy student', value: 'busy-student' },
      { label: 'Fitness-focused person', value: 'fitness-focused' },
      { label: 'Budget-conscious cook', value: 'budget-conscious' },
      { label: 'Comfort food lover', value: 'comfort-food' },
      { label: 'Cooking for family', value: 'family' }
    ],
    hitbox: { x: 0, y: 260, w: 390, h: 620 }
  },
  {
    id: 'dishType',
    label: 'Dish Type',
    stepLabel: 'Dish',
    asset: chopboard,
    answerKey: 'dishType',
    type: 'single',
    question: 'What kind of dish do you want to eat?',
    helper: 'Choose the meal situation you want the recipe to fit.',
    options: [
      { label: 'Breakfast', value: 'breakfast' },
      { label: 'Lunch / Dinner', value: 'lunch-dinner' },
      { label: 'Snack / Appetizer', value: 'snack-appetizer' },
      { label: 'Dessert', value: 'dessert' },
      { label: 'Soup / Salad', value: 'soup-salad' },
      { label: 'Bread / Bakery', value: 'bread-bakery' }
    ],
    hitbox: { x: 410, y: 485, w: 190, h: 130 }
  },
  {
    id: 'format',
    label: 'Food or Drink',
    stepLabel: 'Format',
    asset: winebottle,
    answerKey: 'format',
    type: 'single',
    question: 'Are you looking for food or drink?',
    helper: 'This separates meals, drinks, smoothies, and flexible options.',
    options: [
      { label: 'Food', value: 'food' },
      { label: 'Drink', value: 'drink' },
      { label: 'Smoothie', value: 'smoothie' },
      { label: 'No preference', value: 'no-preference' }
    ],
    hitbox: { x: 378, y: 305, w: 85, h: 180 }
  },
  {
    id: 'nutritionGoal',
    label: 'Nutrition Goal',
    stepLabel: 'Goal',
    asset: goalBoard,
    answerKey: 'nutritionGoal',
    type: 'single',
    question: 'What nutrition goal are you trying to hit?',
    helper: 'The goal board controls the main recommendation direction.',
    options: [
      { label: 'High protein', value: 'high-protein' },
      { label: 'Low calorie', value: 'low-calorie' },
      { label: 'Low fat', value: 'low-fat' },
      { label: 'Low sugar', value: 'low-sugar' },
      { label: 'Balanced meal', value: 'balanced-meal' },
      { label: 'No nutrition priority', value: 'no-nutrition-priority' }
    ],
    hitbox: { x: 500, y: 230, w: 280, h: 185 }
  },
  {
    id: 'cookingTime',
    label: 'Cooking Time',
    stepLabel: 'Time',
    asset: clock,
    answerKey: 'cookingTime',
    type: 'single',
    question: 'How much time do you want to spend cooking?',
    helper: 'The clock filters recipes by realistic cooking time.',
    options: [
      { label: '0–15 min', value: '0-15' },
      { label: '15–30 min', value: '15-30' },
      { label: '30–60 min', value: '30-60' },
      { label: 'No limit', value: 'no-limit' }
    ],
    hitbox: { x: 600, y: 65, w: 150, h: 140 }
  },
  {
    id: 'effort',
    label: 'Effort',
    stepLabel: 'Effort',
    asset: stewpotFrypan,
    answerKey: 'effort',
    type: 'single',
    question: 'How much cooking effort are you okay with?',
    helper: 'The pot controls how simple or complex the cooking process should be.',
    options: [
      { label: 'Very simple', value: 'very-simple' },
      { label: 'Few dishes to wash', value: 'few-dishes' },
      { label: 'Standard cooking', value: 'standard-cooking' },
      { label: 'I do not mind cooking', value: 'full-cooking' }
    ],
    hitbox: { x: 615, y: 430, w: 350, h: 170 }
  },
  {
    id: 'ingredients',
    label: 'Ingredients',
    stepLabel: 'Ingredients',
    asset: refridge,
    answerKey: 'ingredients',
    type: 'multi',
    question: 'What ingredients do you already have?',
    helper: 'Choose broad ingredient groups instead of small individual ingredients.',
    options: [
      { label: 'Poultry', value: 'poultry' },
      { label: 'Meat', value: 'meat' },
      { label: 'Seafood', value: 'seafood' },
      { label: 'Eggs / dairy', value: 'eggs-dairy' },
      { label: 'Legumes', value: 'legumes' },
      { label: 'Grains / starches', value: 'grains-starches' },
      { label: 'Vegetables / fruit', value: 'vegetables-fruit' },
      { label: 'Not sure', value: 'not-sure' }
    ],
    hitbox: { x: 0, y: 120, w: 230, h: 650 }
  },
  {
    id: 'allergies',
    label: 'Allergies',
    stepLabel: 'Avoid',
    asset: recycleBin,
    answerKey: 'allergies',
    type: 'multi',
    question: 'Do you have allergies or ingredients to avoid?',
    helper: 'The recycle bin removes unsafe or unwanted ingredients from the recommendation.',
    options: [
      { label: 'Nuts', value: 'nuts' },
      { label: 'Dairy', value: 'dairy' },
      { label: 'Gluten / wheat', value: 'gluten-wheat' },
      { label: 'Seafood', value: 'seafood' },
      { label: 'Eggs', value: 'eggs' },
      { label: 'Soy', value: 'soy' },
      { label: 'Pork', value: 'pork' },
      { label: 'No allergy', value: 'no-allergy' }
    ],
    hitbox: { x: 1045, y: 545, w: 150, h: 260 }
  },
  {
    id: 'recipeBook',
    label: 'Recipe Book',
    stepLabel: 'Result',
    asset: recipeBook,
    answerKey: null,
    type: 'review',
    question: 'Review your choices',
    helper: 'Open the recipe book when you are ready to generate the recipe data story.',
    options: [],
    hitbox: { x: 815, y: 350, w: 230, h: 150 }
  }
];

export const requiredAnswerKeys = [
  'userType',
  'dishType',
  'nutritionGoal',
  'cookingTime',
  'effort',
  'allergies'
];

export function getOptionLabel(answerKey, value) {
  for (const hotspot of hotspots) {
    if (hotspot.answerKey !== answerKey) continue;
    const option = hotspot.options.find((item) => item.value === value);
    if (option) return option.label;
  }
  return value;
}

export function getHotspotById(id) {
  return hotspots.find((hotspot) => hotspot.id === id);
}