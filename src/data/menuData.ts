import type { MenuItem } from '../types.ts';

import heroBiryaniImg from '../assets/images/hero_biryani_feast_1794739899525.jpg';
import heroBbqImg from '../assets/images/hero_charcoal_bbq_1794739899905.jpg';
import heroFastFoodImg from '../assets/images/hero_fast_food_grill_1794739899996.jpg';

import chickenBiryaniImg from '../assets/images/menu_chicken_biryani_1794739900673.jpg';
import bbqPlatterImg from '../assets/images/menu_bbq_platter_1794739900947.jpg';
import seekhKebabImg from '../assets/images/menu_seekh_kebab_1794739901475.jpg';
import chickenWrapImg from '../assets/images/menu_chicken_wrap_1794739902157.jpg';
import zingerBurgerImg from '../assets/images/menu_zinger_burger_1794739902908.jpg';
import royalPlatterImg from '../assets/images/menu_royal_platter_1794739903053.jpg';
import pakwanDaigImg from '../assets/images/menu_pakwan_daig_1794739905392.jpg';
import zardaDessertImg from '../assets/images/menu_zarda_dessert_1794739904056.jpg';
import malaiBotiImg from '../assets/images/menu_malai_boti_1794739928860.jpg';
import loadedFriesImg from '../assets/images/menu_loaded_fries_1794739929618.jpg';
import beefBiryaniImg from '../assets/images/menu_beef_biryani_1794739929787.jpg';
import mintMargaritaImg from '../assets/images/menu_mint_margarita_1794739930308.jpg';

export interface HeroSlide {
  id: string;
  eyebrow: string;
  title: string;
  subtitle: string;
  ctaLabel: string;
  targetCategory: string;
  image: string;
}

export const HERO_SLIDES: HeroSlide[] = [
  {
    id: 'slide-biryani',
    eyebrow: 'Model Town Market, Multan',
    title: 'Royal Dum Biryani, Slow-Cooked to Perfection',
    subtitle:
      'Long-grain saffron basmati layered with tender spiced chicken, caramelized onions, and signature mint raita.',
    ctaLabel: 'Order Biryani',
    targetCategory: 'Biryani & Pulao',
    image: heroBiryaniImg,
  },
  {
    id: 'slide-bbq',
    eyebrow: 'Live Charcoal Kitchen',
    title: 'Sizzling Charcoal BBQ & Creamy Malai Boti',
    subtitle:
      'Flame-kissed chicken tikka skewers, reshmi seekh kebabs, and smoky boti served piping hot off the grill.',
    ctaLabel: 'Explore Grill',
    targetCategory: 'Charcoal BBQ',
    image: heroBbqImg,
  },
  {
    id: 'slide-fastfood',
    eyebrow: 'Dine-In · Takeaway · Delivery',
    title: 'Crispy Zinger Burgers & Signature Chicken Wraps',
    subtitle:
      'Golden-crunch chicken fillets, toasted garlic-mayo wraps, and loaded cheddar fries crafted fresh to order.',
    ctaLabel: 'Browse Fast Food',
    targetCategory: 'Wraps & Burgers',
    image: heroFastFoodImg,
  },
];

export const MENU_CATEGORIES = [
  'Platters & Deals',
  'Biryani & Pulao',
  'Charcoal BBQ',
  'Wraps & Burgers',
  'Pakwan Daig',
  'Sides & Drinks',
] as const;

export const MENU_ITEMS: MenuItem[] = [
  {
    id: 'sultan-royal-platter',
    name: 'Sultan Royal Special Platter',
    category: 'Platters & Deals',
    description: 'Biryani, 4 Malai Boti, Kebab, Roll, Samosa & Dates.',
    price: 999,
    originalPrice: 1299,
    image: royalPlatterImg,
    tag: 'Signature Deal',
    serving: 'Serves 1–2',
    popular: true,
  },
  {
    id: 'launching-week-grand-platter',
    name: 'Sultan Grand Feast Platter',
    category: 'Platters & Deals',
    description: 'Chicken Biryani, Seekh Kebab, Zarda, Raita & Drink.',
    price: 599,
    originalPrice: 810,
    image: royalPlatterImg,
    tag: 'Best Value',
    serving: 'Full Meal',
    popular: true,
  },
  {
    id: 'launching-mini-platter',
    name: 'Sultan Classic Combo Platter',
    category: 'Platters & Deals',
    description: 'Chicken Biryani, Seekh Kebab, Zarda & Soft Drink.',
    price: 359,
    originalPrice: 659,
    image: chickenBiryaniImg,
    tag: 'Saver Combo',
    serving: 'Single Meal',
    popular: true,
  },
  {
    id: 'sultan-chicken-biryani',
    name: 'Sultan Special Chicken Biryani',
    category: 'Biryani & Pulao',
    description: 'Saffron basmati rice with spiced chicken & mint raita.',
    price: 450,
    image: chickenBiryaniImg,
    tag: 'House Favorite',
    serving: 'Full Plate',
    popular: true,
  },
  {
    id: 'chicken-tikka-biryani',
    name: 'Charcoal Chicken Tikka Biryani',
    category: 'Biryani & Pulao',
    description: 'Smoky chicken tikka layered over spiced biryani rice.',
    price: 550,
    image: heroBiryaniImg,
    serving: 'Full Plate',
  },
  {
    id: 'beef-dum-biryani',
    name: 'Royal Beef Dum Biryani',
    category: 'Biryani & Pulao',
    description: 'Slow-braised boneless beef with saffron basmati.',
    price: 600,
    image: beefBiryaniImg,
    serving: 'Full Plate',
  },
  {
    id: 'special-bbq-skewers',
    name: 'Special BBQ Chicken Skewers',
    category: 'Charcoal BBQ',
    description: 'Charcoal chicken skewers, roasted veggies & mint dip.',
    price: 750,
    image: bbqPlatterImg,
    tag: 'Chef Grill',
    serving: '4 Skewers',
    popular: true,
  },
  {
    id: 'sizzling-chicken-bbq',
    name: 'Sizzling Chicken Tikka Boti',
    category: 'Charcoal BBQ',
    description: 'Cast-iron sizzling spiced boti & twin chutneys.',
    price: 680,
    image: heroBbqImg,
    serving: '12 pcs',
  },
  {
    id: 'chicken-malai-boti',
    name: 'Creamy Chicken Malai Boti',
    category: 'Charcoal BBQ',
    description: 'Mild velvety cream-marinated charcoal grilled cubes.',
    price: 780,
    image: malaiBotiImg,
    tag: 'Mild & Creamy',
    serving: '12 pcs',
    popular: true,
  },
  {
    id: 'reshmi-seekh-kebab',
    name: 'Reshmi Seekh Kebab',
    category: 'Charcoal BBQ',
    description: 'Juicy hand-minced skewers grilled over live coals.',
    price: 650,
    image: seekhKebabImg,
    serving: '4 Kebabs',
  },
  {
    id: 'special-chicken-wrap',
    name: 'Sultan Special Chicken Wrap',
    category: 'Wraps & Burgers',
    description: 'Toasted tortilla with crispy chicken & garlic mayo.',
    price: 490,
    image: chickenWrapImg,
    tag: 'Fast Food Hit',
    serving: 'Twin Halves',
    popular: true,
  },
  {
    id: 'zinger-crunch-burger',
    name: 'Zinger Crispy Crunch Burger',
    category: 'Wraps & Burgers',
    description: 'Crunchy chicken fillet, melted cheddar & fries.',
    price: 520,
    image: zingerBurgerImg,
    serving: 'With Fries',
    popular: true,
  },
  {
    id: 'loaded-cheesy-fries',
    name: 'Loaded Chicken & Cheese Fries',
    category: 'Wraps & Burgers',
    description: 'Crispy fries with cheddar sauce & chicken bites.',
    price: 380,
    image: loadedFriesImg,
    serving: 'Share Bowl',
  },
  {
    id: 'pakwan-biryani-kg',
    name: 'Pakwan Chicken Biryani (Per KG)',
    category: 'Pakwan Daig',
    description: 'Fresh Pakwan Daig biryani cooked per kilo.',
    price: 900,
    image: pakwanDaigImg,
    tag: 'Special Offer',
    serving: '1 KG (4–5 Persons)',
    popular: true,
  },
  {
    id: 'pakwan-mutton-pulao-kg',
    name: 'Pakwan Mutton Yakhni Pulao (Per KG)',
    category: 'Pakwan Daig',
    description: 'Aromatic bone-in mutton stock pulao per kilo.',
    price: 1850,
    image: pakwanDaigImg,
    serving: '1 KG (4–5 Persons)',
  },
  {
    id: 'family-bbq-biryani-box',
    name: 'Sultan Family Feast Box',
    category: 'Platters & Deals',
    description: '2 Biryani, 8 Malai Boti, 4 Kebabs, Wraps & Drink.',
    price: 2450,
    originalPrice: 2890,
    image: royalPlatterImg,
    tag: 'Family Saver',
    serving: 'Serves 4–5',
  },
  {
    id: 'shahi-zarda',
    name: 'Shahi Saffron Zarda',
    category: 'Sides & Drinks',
    description: 'Sweet saffron rice topped with khoya & nuts.',
    price: 250,
    image: zardaDessertImg,
    serving: 'Single Bowl',
  },
  {
    id: 'fresh-mint-margarita',
    name: 'Fresh Mint Margarita',
    category: 'Sides & Drinks',
    description: 'Chilled sparkling lime & crushed mint refresher.',
    price: 220,
    image: mintMargaritaImg,
    serving: 'Tall Glass',
  },
];
