/**
 * Online Food Order Processing System
 * Restaurant Menu Catalogue & Preset Data
 */

const MENU_CATEGORIES = [
  { id: 'all', name: 'All Items', icon: '🍽️' },
  { id: 'burgers', name: 'Gourmet Burgers', icon: '🍔' },
  { id: 'pizzas', name: 'Artisan Pizzas', icon: '🍕' },
  { id: 'asian', name: 'Bowls & Asian', icon: '🍜' },
  { id: 'beverages', name: 'Drinks & Brews', icon: '🥤' },
  { id: 'desserts', name: 'Sweet Treats', icon: '🍰' }
];

const MENU_ITEMS = [
  // Burgers
  {
    id: 'BUR-01',
    name: 'Truffle Smash Cheeseburger',
    category: 'burgers',
    price: 12.99,
    prepTime: 14, // simulated seconds
    emoji: '🍔',
    image: 'assets/images/burger-smash.jpg',
    description: 'Double Angus beef patties, aged cheddar, black truffle aioli, toasted brioche bun.',
    isVeg: false,
    isSpicy: false,
    rating: 4.9,
    badge: 'Bestseller'
  },
  {
    id: 'BUR-02',
    name: 'Crispy Peri-Peri Chicken Burger',
    category: 'burgers',
    price: 10.49,
    prepTime: 12,
    emoji: '🍗',
    image: 'assets/images/burger-chicken.jpg',
    description: 'Buttermilk fried chicken thigh, spicy peri-peri glaze, crunchy slaw & jalapeños.',
    isVeg: false,
    isSpicy: true,
    rating: 4.8,
    badge: 'Spicy'
  },
  {
    id: 'BUR-03',
    name: 'Garden Halloumi & Avocado Burger',
    category: 'burgers',
    price: 11.25,
    prepTime: 10,
    emoji: '🥑',
    image: 'assets/images/burger-halloumi.jpg',
    description: 'Grilled Cypriot halloumi, smashed hass avocado, roasted peppers & pesto mayo.',
    isVeg: true,
    isSpicy: false,
    rating: 4.7,
    badge: 'Vegetarian'
  },

  // Pizzas
  {
    id: 'PIZ-01',
    name: 'Margherita di Bufala',
    category: 'pizzas',
    price: 13.50,
    prepTime: 18,
    emoji: '🍕',
    image: 'assets/images/pizza-margherita.jpg',
    description: 'San Marzano tomato base, creamy buffalo mozzarella, fresh basil & extra virgin olive oil.',
    isVeg: true,
    isSpicy: false,
    rating: 4.9,
    badge: 'Classic'
  },
  {
    id: 'PIZ-02',
    name: 'Smoked Pepperoni & Hot Honey',
    category: 'pizzas',
    price: 15.99,
    prepTime: 16,
    emoji: '🍕',
    image: 'assets/images/pizza-pepperoni.jpg',
    description: 'Crispy cup-and-char pepperoni, hot habanero infused honey, fresh mozzarella.',
    isVeg: false,
    isSpicy: true,
    rating: 4.95,
    badge: 'Chef Choice'
  },
  {
    id: 'PIZ-03',
    name: 'Wild Forest Mushroom & Truffle',
    category: 'pizzas',
    price: 16.50,
    prepTime: 17,
    emoji: '🍄',
    image: 'assets/images/pizza-mushroom.jpg',
    description: 'Creamy garlic base, sautéed porcini & cremini mushrooms, fontina & thyme.',
    isVeg: true,
    isSpicy: false,
    rating: 4.85,
    badge: 'Gourmet'
  },

  // Asian & Bowls
  {
    id: 'ASI-01',
    name: 'Tokyo Teriyaki Chicken Rice Bowl',
    category: 'asian',
    price: 13.95,
    prepTime: 15,
    emoji: '🍚',
    image: 'assets/images/asian-teriyaki.jpg',
    description: 'Char-grilled chicken glazed in house teriyaki, steamed jasmine rice, edamame & pickled radish.',
    isVeg: false,
    isSpicy: false,
    rating: 4.8,
    badge: 'Popular'
  },
  {
    id: 'ASI-02',
    name: 'Spicy Sichuan Dan Dan Noodles',
    category: 'asian',
    price: 12.50,
    prepTime: 13,
    emoji: '🍜',
    image: 'assets/images/asian-noodles.jpg',
    description: 'Springy hand-pulled noodles, spicy sesame chili broth, minced seasoned meat, bok choy.',
    isVeg: false,
    isSpicy: true,
    rating: 4.75,
    badge: 'Spicy'
  },
  {
    id: 'ASI-03',
    name: 'Rainbow Tofu Poke Bowl',
    category: 'asian',
    price: 12.00,
    prepTime: 9,
    emoji: '🥗',
    image: 'assets/images/asian-poke.jpg',
    description: 'Organic crispy tofu, avocado, mango cubes, sea cabbage salad & citrus ponzu dressing.',
    isVeg: true,
    isSpicy: false,
    rating: 4.7,
    badge: 'Healthy'
  },

  // Beverages
  {
    id: 'BEV-01',
    name: 'Iced Caramel Cloud Macchiato',
    category: 'beverages',
    price: 4.95,
    prepTime: 6,
    emoji: '☕',
    image: 'assets/images/bev-macchiato.jpg',
    description: 'Double espresso shot over creamy cold milk, vanilla syrup, and salted caramel drizzle.',
    isVeg: true,
    isSpicy: false,
    rating: 4.9,
    badge: 'Cold'
  },
  {
    id: 'BEV-02',
    name: 'Sparkling Dragonfruit Lemonade',
    category: 'beverages',
    price: 4.25,
    prepTime: 5,
    emoji: '🍹',
    image: 'assets/images/bev-dragonfruit.jpg',
    description: 'Fresh squeezed Meyer lemon juice with vibrant red dragonfruit & mint sparkle.',
    isVeg: true,
    isSpicy: false,
    rating: 4.8,
    badge: 'Refreshing'
  },
  {
    id: 'BEV-03',
    name: 'Ceremonial Matcha Oat Latte',
    category: 'beverages',
    price: 5.20,
    prepTime: 7,
    emoji: '🍵',
    image: 'assets/images/bev-matcha.jpg',
    description: 'Stone-ground Uji matcha whisked with velvety steamed oat milk and agave nectar.',
    isVeg: true,
    isSpicy: false,
    rating: 4.85,
    badge: 'Artisan'
  },

  // Desserts
  {
    id: 'DES-01',
    name: 'Warm Belgian Molten Lava Cake',
    category: 'desserts',
    price: 6.95,
    prepTime: 11,
    emoji: '🍫',
    image: 'assets/images/des-lava-cake.jpg',
    description: 'Decadent dark chocolate sponge with molten center, accompanied by Madagascar vanilla gelato.',
    isVeg: true,
    isSpicy: false,
    rating: 4.95,
    badge: 'Decadent'
  },
  {
    id: 'DES-02',
    name: 'Churros with Salted Dulce de Leche',
    category: 'desserts',
    price: 5.80,
    prepTime: 8,
    emoji: '🥨',
    image: 'assets/images/des-churros.jpg',
    description: 'Golden cinnamon-sugar dusted Spanish churros served with warm Argentine dulce de leche.',
    isVeg: true,
    isSpicy: false,
    rating: 4.8,
    badge: 'Crispy'
  }
];

// Presets for single-click instant order generation (awesome for demo & evaluator viva)
const PRESET_ORDERS = [
  {
    name: 'Burger & Brew Lunch',
    customer: 'Sophia Martinez',
    type: 'Dine-In',
    table: 'Table 4',
    itemIds: ['BUR-01', 'BEV-01'],
    notes: 'Extra napkins please'
  },
  {
    name: 'Spicy Pizza Party',
    customer: 'David Chen',
    type: 'Takeaway',
    table: 'Takeaway Pickup',
    itemIds: ['PIZ-02', 'BEV-02', 'DES-02'],
    notes: 'Hot honey on the side'
  },
  {
    name: 'Healthy Asian Lunch',
    customer: 'Aarav Patel',
    type: 'Dine-In',
    table: 'Table 9',
    itemIds: ['ASI-03', 'BEV-03'],
    notes: 'No plastic straws'
  },
  {
    name: 'Deluxe Italian Dinner',
    customer: 'Emma Watson',
    type: 'Online Delivery',
    table: 'Apt 402, Sunset Blvd',
    itemIds: ['PIZ-01', 'PIZ-03', 'DES-01'],
    notes: 'Leave at front gate ring bell'
  }
];

// Ensure inStock property is initialized
MENU_ITEMS.forEach(item => {
  if (item.inStock === undefined) item.inStock = true;
});

function toggleItemStock(itemId) {
  const item = MENU_ITEMS.find(m => m.id === itemId);
  if (item) {
    item.inStock = !item.inStock;
    return item.inStock;
  }
  return false;
}

if (typeof window !== 'undefined') {
  window.MENU_CATEGORIES = MENU_CATEGORIES;
  window.MENU_ITEMS = MENU_ITEMS;
  window.PRESET_ORDERS = PRESET_ORDERS;
  window.toggleItemStock = toggleItemStock;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { MENU_CATEGORIES, MENU_ITEMS, PRESET_ORDERS, toggleItemStock };
}
