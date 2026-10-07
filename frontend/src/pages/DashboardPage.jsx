import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles,
  MessageSquare,
  UtensilsCrossed,
  Calendar,
  ShoppingCart,
  User,
  ArrowRight,
  Clock,
  Flame,
  ShieldCheck,
  CheckCircle2,
  ChevronRight,
  Send,
  Heart,
  Bookmark,
  Zap,
  SlidersHorizontal,
  Check,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import AppNavigation from '../components/AppNavigation';
import ZaiCharacter from '../components/ZaiCharacter';
import { getUserProfile } from '../services/profileService';
import { loadGroceryList, toggleGroceryItem } from '../services/groceryService';

// Curated pantry recipes highlighting available ingredients: spinach, paneer, tomatoes
const PANTRY_RECIPES = [
  {
    id: 'pantry_paneer_spinach',
    name: 'Spiced Paneer & Wilted Spinach Skillet',
    match: '3/3 Ingredients',
    matchScore: '100% Match',
    time: '15 min',
    calories: '380 kcal',
    protein: '22g Protein',
    tag: 'Vegetarian',
    image: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?auto=format&fit=crop&w=800&q=80',
    description: 'Crispy seared paneer cubes tossed with fresh spinach, cumin, and garlic.',
    route: '/recipes?recipe=rec_paneer_spinach',
  },
  {
    id: 'pantry_tomato_scramble',
    name: 'Blistered Tomato & Spinach Scramble',
    match: '3/3 Ingredients',
    matchScore: '100% Match',
    time: '10 min',
    calories: '290 kcal',
    protein: '24g Protein',
    tag: 'High Protein',
    image: 'https://images.unsplash.com/photo-1525351484163-7529414344d8?auto=format&fit=crop&w=800&q=80',
    description: 'Soft-folded farm eggs with sun-ripened tomatoes, baby spinach, and oregano.',
    route: '/recipes?mealType=Breakfast',
  },
  {
    id: 'pantry_tomato_paneer',
    name: 'Slow-Simmered Tomato Basil Paneer',
    match: '3/3 Ingredients',
    matchScore: '100% Match',
    time: '20 min',
    calories: '360 kcal',
    protein: '21g Protein',
    tag: 'Indian Classic',
    image: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=800&q=80',
    description: 'Warm golden paneer simmered in a spiced tomato reduction with fresh herbs.',
    route: '/recipes?mealType=Dinner',
  },
  {
    id: 'pantry_chickpea_bowl',
    name: 'Crisp Herb Chickpea & Cucumber Bowl',
    match: '2/3 Ingredients',
    matchScore: '92% Match',
    time: '10 min',
    calories: '340 kcal',
    protein: '14g Protein',
    tag: 'Fresh Vegan',
    image: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=800&q=80',
    description: 'Zero-cook Mediterranean bowl with chickpeas, English cucumbers, and lemon tahini.',
    route: '/recipes?mealType=Lunch',
  },
];

// Curated discovery catalog with category tags for interactive filtering
const DISCOVERY_RECIPES = [
  {
    id: 'disc_salmon_bowl',
    name: 'Seared Citrus Herb Salmon Bowl',
    time: '18 min',
    calories: '480 kcal',
    protein: '38g Protein',
    categories: ['Quick', 'High Protein', 'Under 30 min'],
    image: 'https://images.unsplash.com/photo-1467003909585-2f8a72700288?auto=format&fit=crop&w=800&q=80',
    description: 'Crisp salmon fillet over quinoa with avocado and cold-pressed citrus dressing.',
    route: '/recipes?recipe=rec_avocado_citrus_bowl',
  },
  {
    id: 'disc_moong_dal',
    name: 'Creamy Coconut Green Moong Dal',
    time: '25 min',
    calories: '390 kcal',
    protein: '20g Protein',
    categories: ['Indian', 'Vegetarian', 'Under 30 min'],
    image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80',
    description: 'Spiced slow-simmered lentils tempered with ginger, cumin, and coconut cream.',
    route: '/recipes?mealType=Dinner',
  },
  {
    id: 'disc_quinoa_bowl',
    name: 'Avocado & Warm Quinoa Superbowl',
    time: '15 min',
    calories: '420 kcal',
    protein: '16g Protein',
    categories: ['Quick', 'Vegetarian', 'Under 30 min'],
    image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=800&q=80',
    description: 'Nutrient-rich tri-color quinoa, sliced avocado, baby greens, and toasted seeds.',
    route: '/recipes?mealType=Lunch',
  },
  {
    id: 'disc_paneer_tikka',
    name: 'Tandoori Spiced Paneer Tikka Skewers',
    time: '22 min',
    calories: '350 kcal',
    protein: '26g Protein',
    categories: ['Indian', 'High Protein', 'Vegetarian', 'Under 30 min'],
    image: 'https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?auto=format&fit=crop&w=800&q=80',
    description: 'Marinated paneer cubes roasted with bell peppers, onion, and aromatic garam masala.',
    route: '/recipes?recipe=rec_paneer_spinach',
  },
  {
    id: 'disc_artichoke_bean',
    name: 'Mediterranean Artichoke & White Bean Sauté',
    time: '14 min',
    calories: '310 kcal',
    protein: '15g Protein',
    categories: ['Quick', 'Vegetarian', 'Under 30 min'],
    image: 'https://images.unsplash.com/photo-1543339308-43e59d6b73a6?auto=format&fit=crop&w=800&q=80',
    description: 'Tender cannellini beans tossed with hearts of palm, artichoke, and lemon oregano oil.',
    route: '/recipes?mealType=Lunch',
  },
  {
    id: 'disc_turmeric_soup',
    name: 'Golden Turmeric Lentil Soup with Greens',
    time: '28 min',
    calories: '370 kcal',
    protein: '19g Protein',
    categories: ['Indian', 'Vegetarian', 'Under 30 min'],
    image: 'https://images.unsplash.com/photo-1547496502-affa22d38842?auto=format&fit=crop&w=800&q=80',
    description: 'Healing golden soup infused with fresh turmeric root, cumin, and baby spinach.',
    route: '/recipes?mealType=Dinner',
  },
];

const FILTER_PILLS = ['All', 'Quick', 'High Protein', 'Indian', 'Under 30 min', 'Vegetarian'];

export default function DashboardPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [groceryItems, setGroceryItems] = useState([]);
  const [quickQuery, setQuickQuery] = useState('');
  const [isZaiHappy, setIsZaiHappy] = useState(false);
  const [activeFilter, setActiveFilter] = useState('All');
  const [savedRecipeIds, setSavedRecipeIds] = useState(() => {
    try {
      const raw = localStorage.getItem('zaiqo_saved_recipes');
      return raw ? JSON.parse(raw) : ['pantry_paneer_spinach', 'disc_salmon_bowl'];
    } catch {
      return ['pantry_paneer_spinach', 'disc_salmon_bowl'];
    }
  });

  useEffect(() => {
    let isMounted = true;
    if (user) {
      Promise.resolve(getUserProfile(user.id, user))
        .then((p) => {
          if (isMounted) setProfile(p);
        })
        .catch(() => {});
      const items = loadGroceryList();
      setGroceryItems(items);
    }
    return () => {
      isMounted = false;
    };
  }, [user]);

  const getTimeGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const handleQuickAsk = (e) => {
    e.preventDefault();
    if (!quickQuery.trim()) return;
    setIsZaiHappy(true);
    setTimeout(() => {
      navigate(`/zai?q=${encodeURIComponent(quickQuery.trim())}`);
    }, 250);
  };

  const handlePromptClick = (promptText) => {
    setIsZaiHappy(true);
    setTimeout(() => {
      navigate(`/zai?q=${encodeURIComponent(promptText)}`);
    }, 250);
  };

  const handleToggleGrocery = (id) => {
    const updated = toggleGroceryItem(id);
    setGroceryItems(updated);
  };

  const toggleSaveRecipe = (recipeId, e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setSavedRecipeIds((prev) => {
      const next = prev.includes(recipeId)
        ? prev.filter((id) => id !== recipeId)
        : [...prev, recipeId];
      try {
        localStorage.setItem('zaiqo_saved_recipes', JSON.stringify(next));
      } catch {
        // ignore
      }
      return next;
    });
  };

  const pendingGroceryItems = groceryItems.filter((i) => !i.completed);
  const firstName = user?.name ? user.name.split(' ')[0] : 'there';

  const filteredDiscovery = activeFilter === 'All'
    ? DISCOVERY_RECIPES
    : DISCOVERY_RECIPES.filter((r) => r.categories.includes(activeFilter));

  return (
    <div className="min-h-screen bg-[#FAFBF7] text-[#24301F] flex flex-col justify-between selection:bg-[#284A12] selection:text-[#FAFBF7]">
      {/* Top Unified Navigation */}
      <AppNavigation />

      {/* Main Dashboard Space */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-9 space-y-9">
        
        {/* ================================================== */}
        {/* 1. HERO SECTION: Large rounded container, Deep Forest */}
        {/* ================================================== */}
        <section className="bg-gradient-to-br from-[#284A12] via-[#335619] to-[#1C370B] text-[#FAFBF7] rounded-[28px] sm:rounded-[36px] p-6 sm:p-10 lg:p-12 shadow-[0_12px_36px_rgba(40,74,18,0.18)] border border-[#3C641E]/40 relative overflow-hidden">
          {/* Subtle Organic Lighting Glow */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-[#78A83A]/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-1/4 w-72 h-72 bg-[#D8E8B5]/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="space-y-3 max-w-2xl">
              <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-[#D8E8B5] text-xs font-semibold">
                <Sparkles className="w-3.5 h-3.5 text-[#D8E8B5]" />
                <span>Personalized Food &amp; Wellness Companion</span>
              </div>
              
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-[#FAFBF7] leading-tight">
                {getTimeGreeting()}, {firstName}!
              </h1>
              
              <p className="text-[#E2ECCB] text-xs sm:text-sm lg:text-base leading-relaxed font-normal">
                Your pantry ingredients, personalized recipes, and nutrition architecture are synchronized. Zai is ready to inspire what you eat today.
              </p>
            </div>

            {/* Organic Floating Pantry Sync Badge */}
            <div className="relative flex items-center gap-3.5 bg-white/10 backdrop-blur-md px-5 py-3.5 rounded-[22px] border border-white/20 shrink-0 self-start lg:self-center shadow-lg">
              <div className="w-11 h-11 rounded-2xl bg-[#D8E8B5] flex items-center justify-center text-[#284A12] font-bold shadow-xs">
                <Zap className="w-5 h-5" />
              </div>
              <div>
                <span className="block text-[10px] uppercase font-bold tracking-wider text-[#D8E8B5]">
                  Pantry Synced
                </span>
                <span className="text-sm sm:text-base font-bold text-[#FAFBF7]">
                  96% Nutritional Match
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* ================================================== */}
        {/* 2. ZAI SECTION: Untouched Zai bot, elevated stage */}
        {/* ================================================== */}
        <section className="bg-white rounded-[28px] sm:rounded-[32px] border border-[#E4EAD9] p-6 sm:p-8 lg:p-9 shadow-[0_4px_24px_rgba(40,74,18,0.04)] relative overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-center">
            
            {/* Left: Animated Zai Companion Stage (Character visually & functionally untouched) */}
            <div className="lg:col-span-4 flex flex-col items-center justify-center text-center p-5 bg-gradient-to-b from-[#F1F4E6]/90 via-[#FAFBF7] to-[#F1F4E6]/60 rounded-[24px] border border-[#D8E8B5]/90 relative">
              <div className="w-32 h-32 sm:w-36 sm:h-36 relative flex items-center justify-center">
                <ZaiCharacter
                  isThinking={false}
                  isHappy={isZaiHappy}
                  compact={false}
                  showBadges={false}
                />
              </div>

              <div className="mt-3.5 space-y-1">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#D8E8B5] text-[#284A12] text-xs font-bold">
                  <span className="h-2 w-2 rounded-full bg-[#284A12] animate-pulse" />
                  <span>Zai AI Companion</span>
                </div>
                <h3 className="text-xs font-semibold text-[#557342]">Always Active &amp; Learning</h3>
              </div>
            </div>

            {/* Right: Companion Dialogue & Fast Kitchen Search */}
            <div className="lg:col-span-8 space-y-4">
              <div className="space-y-1.5">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#557342]">
                  Ask Zai
                </span>
                <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-[#24301F] tracking-tight">
                  What would you like to nourish yourself with today?
                </h2>
                <p className="text-xs sm:text-sm text-[#71806A] leading-relaxed">
                  Ask for personalized meals, ingredient substitutions, zero-waste recipes, or instant macro calculations.
                </p>
              </div>

              {/* Fast Natural Input */}
              <form onSubmit={handleQuickAsk} className="relative flex items-center pt-1">
                <input
                  type="text"
                  value={quickQuery}
                  onChange={(e) => setQuickQuery(e.target.value)}
                  placeholder="Ask Zai: 'High protein dinner under 25 mins' or 'What can I cook with spinach?'"
                  className="w-full pl-5 pr-28 py-3.5 bg-[#FAFBF7] border border-[#D8E8B5] rounded-full text-xs sm:text-sm text-[#24301F] placeholder:text-[#71806A]/70 focus:outline-none focus:ring-2 focus:ring-[#78A83A]/30 focus:border-[#284A12] focus:bg-white transition-all shadow-xs"
                />
                <button
                  type="submit"
                  className="absolute right-1.5 px-5 py-2.5 bg-[#284A12] hover:bg-[#38621C] text-[#FAFBF7] rounded-full text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <span>Ask</span>
                  <Send className="w-3 h-3" />
                </button>
              </form>

              {/* Starter Quick Prompt Pills */}
              <div className="space-y-2 pt-1">
                <span className="text-[11px] font-semibold text-[#71806A] block">
                  Quick Prompts:
                </span>
                <div className="flex flex-wrap gap-2">
                  {[
                    'High protein dinner under 25 mins',
                    'I have spinach and paneer',
                    'Plan 5 days of vegetarian meals',
                    'Generate grocery list for salmon bowl',
                  ].map((prompt, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handlePromptClick(prompt)}
                      className="px-3.5 py-1.5 rounded-full bg-[#FAFBF7] hover:bg-[#D8E8B5]/70 text-[#24301F] hover:text-[#284A12] text-xs font-medium transition-colors border border-[#D8E8B5] cursor-pointer text-left shadow-2xs"
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ================================================== */}
        {/* 3. ZAI'S PICK FOR YOU: Highly visual editorial spotlight */}
        {/* ================================================== */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#557342]">
                Editorial Recommendation
              </span>
              <h2 className="text-xl sm:text-2xl font-bold text-[#24301F] tracking-tight">
                Zai&apos;s Pick for You
              </h2>
            </div>
            <span className="hidden sm:inline-block text-xs font-semibold text-[#71806A]">
              Calibrated to your metabolic taste
            </span>
          </div>

          <div className="bg-white rounded-[28px] border border-[#E4EAD9] p-4 sm:p-6 lg:p-7 shadow-[0_8px_30px_rgba(40,74,18,0.06)] hover:shadow-[0_16px_40px_rgba(40,74,18,0.12)] transition-all">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-center">
              
              {/* Editorial Large Food Photo */}
              <div className="lg:col-span-7 relative rounded-[24px] overflow-hidden aspect-[16/10] sm:aspect-[16/9] group cursor-pointer"
                   onClick={() => navigate('/recipes?recipe=rec_paneer_spinach')}>
                <img
                  src="https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&w=1200&q=80"
                  alt="Creamy Spinach Paneer Bowl"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-80" />
                
                {/* Floating pill tags on image */}
                <div className="absolute top-4 left-4 flex items-center gap-2">
                  <span className="px-3 py-1 rounded-full bg-[#284A12]/90 backdrop-blur-md text-[#D8E8B5] text-[11px] font-bold uppercase tracking-wider border border-[#78A83A]/30">
                    Signature Choice
                  </span>
                  <span className="px-3 py-1 rounded-full bg-white/90 backdrop-blur-md text-[#24301F] text-[11px] font-bold">
                    Pantry Ready
                  </span>
                </div>

                <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between text-white">
                  <div className="flex items-center gap-3 text-xs font-semibold">
                    <span className="flex items-center gap-1 bg-black/40 backdrop-blur-md px-2.5 py-1 rounded-full">
                      <Clock className="w-3.5 h-3.5 text-[#D8E8B5]" />
                      24 min
                    </span>
                    <span className="flex items-center gap-1 bg-black/40 backdrop-blur-md px-2.5 py-1 rounded-full">
                      <Flame className="w-3.5 h-3.5 text-amber-300" />
                      410 kcal
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={(e) => toggleSaveRecipe('zai_pick_spinach_paneer', e)}
                    className="p-2.5 rounded-full bg-white/90 backdrop-blur-md text-[#24301F] hover:bg-white hover:text-rose-600 transition-colors cursor-pointer shadow-md"
                    title="Save Recipe"
                    aria-label="Save Recipe"
                  >
                    <Heart
                      className={`w-4 h-4 ${
                        savedRecipeIds.includes('zai_pick_spinach_paneer')
                          ? 'fill-rose-500 text-rose-500'
                          : 'text-[#24301F]'
                      }`}
                    />
                  </button>
                </div>
              </div>

              {/* Editorial Details & Action */}
              <div className="lg:col-span-5 space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full bg-[#D8E8B5] text-[#284A12] text-[11px] font-bold">
                      High Protein
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full bg-[#F1F4E6] text-[#557342] text-[11px] font-semibold border border-[#D8E8B5]">
                      Vegetarian
                    </span>
                  </div>
                  <h3 className="text-2xl sm:text-3xl font-extrabold text-[#24301F] tracking-tight">
                    Creamy Spinach Paneer Bowl
                  </h3>
                  <p className="text-xs sm:text-sm text-[#71806A] leading-relaxed">
                    Tender seared paneer cubes folded into slow-wilted baby spinach, aromatic cumin, toasted seeds, and a velvety spiced yogurt glaze. Calibrated for steady all-afternoon vitality.
                  </p>
                </div>

                {/* Macro Capsule Grid */}
                <div className="grid grid-cols-3 gap-2.5 py-2">
                  <div className="p-3 bg-[#FAFBF7] rounded-[18px] border border-[#E4EAD9] text-center">
                    <span className="block text-[10px] font-bold uppercase text-[#71806A]">Protein</span>
                    <span className="text-sm font-extrabold text-[#284A12]">26g</span>
                  </div>
                  <div className="p-3 bg-[#FAFBF7] rounded-[18px] border border-[#E4EAD9] text-center">
                    <span className="block text-[10px] font-bold uppercase text-[#71806A]">Carbs</span>
                    <span className="text-sm font-extrabold text-[#284A12]">18g</span>
                  </div>
                  <div className="p-3 bg-[#FAFBF7] rounded-[18px] border border-[#E4EAD9] text-center">
                    <span className="block text-[10px] font-bold uppercase text-[#71806A]">Healthy Fats</span>
                    <span className="text-sm font-extrabold text-[#284A12]">24g</span>
                  </div>
                </div>

                {/* Cook Action */}
                <div className="pt-2 flex items-center gap-3">
                  <Link
                    to="/recipes?recipe=rec_paneer_spinach"
                    className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-full bg-[#284A12] hover:bg-[#38621C] text-[#FAFBF7] text-xs sm:text-sm font-bold transition-all shadow-sm hover:shadow-md cursor-pointer"
                  >
                    <span>Cook This Recipe</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>

                  <button
                    type="button"
                    onClick={(e) => toggleSaveRecipe('zai_pick_spinach_paneer', e)}
                    className="p-3 rounded-full bg-[#F1F4E6] hover:bg-[#E3EBCF] text-[#284A12] transition-colors border border-[#D8E8B5] cursor-pointer"
                    title="Bookmark recipe"
                  >
                    <Bookmark
                      className={`w-4 h-4 ${
                        savedRecipeIds.includes('zai_pick_spinach_paneer')
                          ? 'fill-[#284A12] text-[#284A12]'
                          : 'text-[#284A12]'
                      }`}
                    />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ================================================== */}
        {/* 4. FROM YOUR PANTRY: Signature personalized feature */}
        {/* ================================================== */}
        <section className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-[#D8E8B5] text-[#284A12] text-[11px] font-bold uppercase tracking-wider mb-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Pantry Intelligence</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-[#24301F] tracking-tight">
                From your pantry
              </h2>
              <p className="text-xs sm:text-sm text-[#71806A] mt-0.5">
                You already have <strong className="text-[#24301F] font-semibold">spinach</strong>, <strong className="text-[#24301F] font-semibold">paneer</strong>, and <strong className="text-[#24301F] font-semibold">tomatoes</strong>. Here are some things you can make:
              </p>
            </div>

            <Link
              to="/recipes?mealType=Dinner"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-[#284A12] hover:text-[#38621C] group self-start sm:self-auto cursor-pointer"
            >
              <span>Explore all pantry ideas</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

          {/* 4 Large Rounded Pantry Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {PANTRY_RECIPES.map((recipe) => {
              const isSaved = savedRecipeIds.includes(recipe.id);
              return (
                <motion.div
                  key={recipe.id}
                  whileHover={{ y: -6 }}
                  transition={{ type: 'spring', stiffness: 320, damping: 20 }}
                  className="bg-white rounded-[24px] border border-[#E4EAD9] overflow-hidden shadow-[0_4px_20px_rgba(40,74,18,0.05)] hover:shadow-[0_12px_32px_rgba(40,74,18,0.12)] transition-all flex flex-col justify-between group cursor-pointer"
                  onClick={() => navigate(recipe.route)}
                >
                  <div>
                    {/* Food Photo Container */}
                    <div className="relative aspect-[4/3] w-full overflow-hidden bg-[#FAFBF7]">
                      <img
                        src={recipe.image}
                        alt={recipe.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
                        loading="lazy"
                      />
                      {/* Match Badge */}
                      <div className="absolute top-3 left-3">
                        <span className="px-2.5 py-1 rounded-full bg-[#284A12]/90 backdrop-blur-md text-[#D8E8B5] text-[10px] font-bold tracking-wide shadow-xs">
                          {recipe.matchScore}
                        </span>
                      </div>

                      {/* Bookmark Save Button */}
                      <button
                        type="button"
                        onClick={(e) => toggleSaveRecipe(recipe.id, e)}
                        className="absolute top-3 right-3 p-2 rounded-full bg-white/90 backdrop-blur-md text-[#24301F] hover:bg-white hover:text-rose-600 transition-all cursor-pointer shadow-xs"
                        title="Save recipe"
                        aria-label="Save recipe"
                      >
                        <Heart
                          className={`w-3.5 h-3.5 ${
                            isSaved ? 'fill-rose-500 text-rose-500' : 'text-[#24301F]'
                          }`}
                        />
                      </button>

                      {/* Cooking Time Overlay Pill */}
                      <div className="absolute bottom-3 left-3">
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-black/50 backdrop-blur-md text-white text-[10px] font-semibold">
                          <Clock className="w-3 h-3 text-[#D8E8B5]" />
                          {recipe.time}
                        </span>
                      </div>
                    </div>

                    {/* Card Content Details */}
                    <div className="p-4 sm:p-5 space-y-2">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="font-bold text-[#557342] uppercase tracking-wider text-[10px]">
                          {recipe.tag}
                        </span>
                        <span className="text-[#71806A] font-semibold">{recipe.protein}</span>
                      </div>

                      <h3 className="text-base font-bold text-[#24301F] line-clamp-1 group-hover:text-[#284A12] transition-colors">
                        {recipe.name}
                      </h3>

                      <p className="text-xs text-[#71806A] line-clamp-2 leading-relaxed">
                        {recipe.description}
                      </p>
                    </div>
                  </div>

                  {/* Card Bottom Meta Bar */}
                  <div className="px-4 sm:px-5 pb-4 pt-2 border-t border-[#F1F4E6] flex items-center justify-between">
                    <span className="text-[11px] font-semibold text-[#557342]">
                      {recipe.calories}
                    </span>
                    <span className="text-xs font-bold text-[#284A12] flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                      View Recipe
                      <ChevronRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </section>

        {/* ================================================== */}
        {/* 5. FOOD DISCOVERY: Discover something delicious */}
        {/* ================================================== */}
        <section className="space-y-5">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-3">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#557342]">
                Curated Culinary Exploration
              </span>
              <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-[#24301F] tracking-tight">
                Discover something delicious
              </h2>
              <p className="text-xs sm:text-sm text-[#71806A] mt-0.5">
                Recipes picked around your taste, goals and ingredients.
              </p>
            </div>

            {/* Filter Pills */}
            <div className="flex flex-wrap items-center gap-2">
              {FILTER_PILLS.map((pill) => {
                const isActive = activeFilter === pill;
                return (
                  <button
                    key={pill}
                    type="button"
                    onClick={() => setActiveFilter(pill)}
                    className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all duration-150 cursor-pointer ${
                      isActive
                        ? 'bg-[#284A12] text-[#FAFBF7] shadow-xs'
                        : 'bg-white text-[#71806A] border border-[#E4EAD9] hover:bg-[#F1F4E6] hover:text-[#24301F]'
                    }`}
                  >
                    {pill}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Large Image-Focused Recipe Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <AnimatePresence mode="popLayout">
              {filteredDiscovery.map((recipe) => {
                const isSaved = savedRecipeIds.includes(recipe.id);
                return (
                  <motion.div
                    key={recipe.id}
                    layout
                    initial={{ opacity: 0, scale: 0.96 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.96 }}
                    transition={{ duration: 0.2 }}
                    whileHover={{ y: -6 }}
                    className="bg-white rounded-[26px] border border-[#E4EAD9] overflow-hidden shadow-[0_4px_24px_rgba(40,74,18,0.05)] hover:shadow-[0_16px_36px_rgba(40,74,18,0.12)] transition-all flex flex-col justify-between group cursor-pointer"
                    onClick={() => navigate(recipe.route)}
                  >
                    <div>
                      {/* Visual Food Photography Header */}
                      <div className="relative aspect-[16/10] w-full overflow-hidden bg-[#FAFBF7]">
                        <img
                          src={recipe.image}
                          alt={recipe.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-600 ease-out"
                          loading="lazy"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-60" />

                        {/* Category Tags */}
                        <div className="absolute top-3.5 left-3.5 flex flex-wrap gap-1.5">
                          {recipe.categories.slice(0, 2).map((cat) => (
                            <span
                              key={cat}
                              className="px-2.5 py-0.5 rounded-full bg-white/90 backdrop-blur-md text-[#284A12] text-[10px] font-bold shadow-xs"
                            >
                              {cat}
                            </span>
                          ))}
                        </div>

                        {/* Save Bookmark Action */}
                        <button
                          type="button"
                          onClick={(e) => toggleSaveRecipe(recipe.id, e)}
                          className="absolute top-3.5 right-3.5 p-2 rounded-full bg-white/90 backdrop-blur-md text-[#24301F] hover:bg-white hover:text-rose-600 transition-all cursor-pointer shadow-xs"
                          title="Save Recipe"
                          aria-label="Save Recipe"
                        >
                          <Heart
                            className={`w-4 h-4 ${
                              isSaved ? 'fill-rose-500 text-rose-500' : 'text-[#24301F]'
                            }`}
                          />
                        </button>

                        {/* Time & Calorie Tag Overlay */}
                        <div className="absolute bottom-3.5 left-3.5 flex items-center gap-2">
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-black/60 backdrop-blur-md text-white text-[11px] font-semibold">
                            <Clock className="w-3 h-3 text-[#D8E8B5]" />
                            {recipe.time}
                          </span>
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-black/60 backdrop-blur-md text-white text-[11px] font-semibold">
                            <Flame className="w-3 h-3 text-amber-300" />
                            {recipe.calories}
                          </span>
                        </div>
                      </div>

                      {/* Card Body */}
                      <div className="p-5 space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-[11px] font-bold text-[#557342]">
                            {recipe.protein}
                          </span>
                          <span className="text-[11px] text-[#71806A]">
                            Dietitian Balanced
                          </span>
                        </div>

                        <h3 className="text-lg font-bold text-[#24301F] group-hover:text-[#284A12] transition-colors leading-snug">
                          {recipe.name}
                        </h3>

                        <p className="text-xs text-[#71806A] line-clamp-2 leading-relaxed">
                          {recipe.description}
                        </p>
                      </div>
                    </div>

                    {/* Bottom Link Bar */}
                    <div className="px-5 pb-5 pt-2 border-t border-[#F1F4E6] flex items-center justify-between">
                      <span className="text-xs font-semibold text-[#557342]">
                        Tap for ingredients
                      </span>
                      <span className="text-xs font-bold text-[#284A12] flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                        Explore
                        <ChevronRight className="w-4 h-4" />
                      </span>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        </section>

        {/* ================================================== */}
        {/* 6. CORE PILLARS: Culinary Studio, Planner, Grocery, Account */}
        {/* ================================================== */}
        <section className="space-y-4 pt-2">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#557342]">
                Kitchen Intelligence
              </span>
              <h2 className="text-xl sm:text-2xl font-bold text-[#24301F] tracking-tight">
                Daily Nutrition Hub
              </h2>
            </div>
            <span className="text-xs font-semibold text-[#71806A] hidden sm:inline">
              Integrated with your live plan
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            
            {/* Pillar 1: Recipe Generation */}
            <motion.div
              whileHover={{ y: -6 }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              className="bg-white rounded-[24px] border border-[#E4EAD9] p-5 sm:p-6 shadow-[0_4px_20px_rgba(40,74,18,0.04)] hover:shadow-[0_12px_32px_rgba(40,74,18,0.10)] transition-all flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-[#F1F4E6] text-[#284A12] flex items-center justify-center border border-[#D8E8B5] shadow-xs">
                  <UtensilsCrossed className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#557342]">
                    Culinary Studio
                  </span>
                  <h3 className="text-lg font-bold text-[#24301F]">Recipe Generation</h3>
                  <p className="text-xs text-[#71806A] mt-1 leading-relaxed">
                    Generate dietitian-crafted recipes tailored to your pantry and diet.
                  </p>
                </div>

                {/* Quick Meal Type Buttons */}
                <div className="grid grid-cols-2 gap-1.5 pt-2">
                  {['Breakfast', 'Lunch', 'Dinner', 'Snack'].map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => navigate(`/recipes?mealType=${m}`)}
                      className="py-1.5 px-2 bg-[#FAFBF7] hover:bg-[#F1F4E6] text-[#24301F] hover:text-[#284A12] rounded-xl text-xs font-semibold border border-[#E4EAD9] transition-colors text-center cursor-pointer"
                    >
                      {m}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-4 border-t border-[#F1F4E6] mt-4">
                <Link
                  to="/recipes"
                  className="w-full inline-flex items-center justify-between text-xs font-bold text-[#284A12] hover:text-[#38621C] group"
                >
                  <span>Open Recipe Studio</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
            </motion.div>

            {/* Pillar 2: Meal Planner Snapshot */}
            <motion.div
              whileHover={{ y: -6 }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              className="bg-white rounded-[24px] border border-[#E4EAD9] p-5 sm:p-6 shadow-[0_4px_20px_rgba(40,74,18,0.04)] hover:shadow-[0_12px_32px_rgba(40,74,18,0.10)] transition-all flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-[#F1F4E6] text-[#284A12] flex items-center justify-center border border-[#D8E8B5] shadow-xs">
                  <Calendar className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#557342]">
                    Nutrition Architecture
                  </span>
                  <h3 className="text-lg font-bold text-[#24301F]">Meal Planner</h3>
                  <p className="text-xs text-[#71806A] mt-1 leading-relaxed">
                    Synchronize breakfasts, lunches, and dinners across 3 to 7 days.
                  </p>
                </div>

                {/* Status Preview */}
                <div className="bg-[#FAFBF7] rounded-2xl p-3 border border-[#E4EAD9] space-y-1.5 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-[#24301F]">5-Day Vitality Plan</span>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#D8E8B5] text-[#284A12]">
                      Active
                    </span>
                  </div>
                  <div className="text-[11px] text-[#71806A]">
                    Calibrated for balanced energy &bull; 2,100 kcal target
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-[#F1F4E6] mt-4">
                <Link
                  to="/meal-planner"
                  className="w-full inline-flex items-center justify-between text-xs font-bold text-[#284A12] hover:text-[#38621C] group"
                >
                  <span>View Full Meal Plan</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
            </motion.div>

            {/* Pillar 3: Grocery List */}
            <motion.div
              whileHover={{ y: -6 }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              className="bg-white rounded-[24px] border border-[#E4EAD9] p-5 sm:p-6 shadow-[0_4px_20px_rgba(40,74,18,0.04)] hover:shadow-[0_12px_32px_rgba(40,74,18,0.10)] transition-all flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-[#F1F4E6] text-[#284A12] flex items-center justify-center border border-[#D8E8B5] shadow-xs">
                  <ShoppingCart className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#557342]">
                    Pantry Checklist
                  </span>
                  <h3 className="text-lg font-bold text-[#24301F]">Grocery List</h3>
                  <p className="text-xs text-[#71806A] mt-1 leading-relaxed">
                    Smart grocery items sorted by supermarket aisle with pantry matching.
                  </p>
                </div>

                {/* Mini Grocery Items List */}
                <div className="space-y-1.5 pt-1">
                  {pendingGroceryItems.slice(0, 3).map((item) => (
                    <div
                      key={item.id}
                      onClick={() => handleToggleGrocery(item.id)}
                      className="flex items-center justify-between p-2 rounded-xl bg-[#FAFBF7] hover:bg-[#F1F4E6] border border-[#E4EAD9] text-xs transition-colors cursor-pointer"
                    >
                      <span className="text-[#24301F] font-medium truncate max-w-[140px]">
                        {item.name}
                      </span>
                      <span className="text-[10px] text-[#71806A] font-semibold">{item.category}</span>
                    </div>
                  ))}
                  {pendingGroceryItems.length === 0 && (
                    <div className="p-3 text-center text-xs text-[#71806A] bg-[#FAFBF7] rounded-xl border border-[#E4EAD9]">
                      All groceries checked!
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-4 border-t border-[#F1F4E6] mt-4">
                <Link
                  to="/grocery"
                  className="w-full inline-flex items-center justify-between text-xs font-bold text-[#284A12] hover:text-[#38621C] group"
                >
                  <span>
                    {pendingGroceryItems.length > 0
                      ? `${pendingGroceryItems.length} items to pick up`
                      : 'Open Grocery Studio'}
                  </span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
            </motion.div>

            {/* Pillar 4: Account & Wellness Preferences */}
            <motion.div
              whileHover={{ y: -6 }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              className="bg-white rounded-[24px] border border-[#E4EAD9] p-5 sm:p-6 shadow-[0_4px_20px_rgba(40,74,18,0.04)] hover:shadow-[0_12px_32px_rgba(40,74,18,0.10)] transition-all flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-[#F1F4E6] text-[#284A12] flex items-center justify-center border border-[#D8E8B5] shadow-xs">
                  <User className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#557342]">
                    Profile &amp; Settings
                  </span>
                  <h3 className="text-lg font-bold text-[#24301F]">Account Preferences</h3>
                  <p className="text-xs text-[#71806A] mt-1 leading-relaxed">
                    Tailor your dietary restrictions, spice level, and wellness goals.
                  </p>
                </div>

                {/* Preferences Summary */}
                <div className="bg-[#FAFBF7] rounded-2xl p-3 border border-[#E4EAD9] space-y-1.5 text-xs">
                  <div className="flex flex-wrap gap-1">
                    {(profile?.foodPreferences || ['Vegetarian']).map((pref, i) => (
                      <span
                        key={i}
                        className="px-2 py-0.5 rounded-md bg-white border border-[#D8E8B5] text-[10px] font-semibold text-[#24301F]"
                      >
                        {pref}
                      </span>
                    ))}
                    <span className="px-2 py-0.5 rounded-md bg-[#D8E8B5] text-[10px] font-semibold text-[#284A12]">
                      Spice: {profile?.spicePreference || 'Medium'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-[#F1F4E6] mt-4">
                <Link
                  to="/account"
                  className="w-full inline-flex items-center justify-between text-xs font-bold text-[#284A12] hover:text-[#38621C] group"
                >
                  <span>Edit Profile &amp; Goals</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
            </motion.div>
          </div>
        </section>

        {/* ================================================== */}
        {/* 7. WELLNESS GUIDANCE & RECOMMENDATIONS */}
        {/* ================================================== */}
        <section className="bg-gradient-to-tr from-[#F1F4E6] via-white to-[#F1F4E6]/60 rounded-[28px] border border-[#E4EAD9] p-6 sm:p-8 shadow-[0_4px_24px_rgba(40,74,18,0.03)]">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#D8E8B5] text-[#284A12] text-[11px] font-bold uppercase tracking-wider mb-1">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Personalized Recommendations</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-[#24301F] tracking-tight">
                Wellness Recommendations for {firstName}
              </h2>
            </div>

            <Link
              to="/zai"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#284A12] hover:bg-[#38621C] text-[#FAFBF7] text-xs font-semibold transition-colors cursor-pointer self-start md:self-auto shadow-xs"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Discuss with Zai</span>
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 sm:p-5 rounded-[20px] bg-white border border-[#E4EAD9] space-y-2">
              <div className="flex items-center gap-2 text-[#284A12] font-bold text-xs">
                <Clock className="w-4 h-4 text-[#78A83A]" />
                <span>Circadian Metabolic Window</span>
              </div>
              <p className="text-xs text-[#71806A] leading-relaxed">
                Your highest metabolic efficiency occurs between 12:00 PM and 2:30 PM. Focus larger macro-dense meals during this period.
              </p>
            </div>

            <div className="p-4 sm:p-5 rounded-[20px] bg-white border border-[#E4EAD9] space-y-2">
              <div className="flex items-center gap-2 text-[#284A12] font-bold text-xs">
                <Heart className="w-4 h-4 text-[#78A83A]" />
                <span>Digestive Fiber Balance</span>
              </div>
              <p className="text-xs text-[#71806A] leading-relaxed">
                Incorporating prebiotic fiber like chia and artichoke with your {profile?.foodPreferences?.[0] || 'Vegetarian'} plan will optimize microbiome resilience.
              </p>
            </div>

            <div className="p-4 sm:p-5 rounded-[20px] bg-white border border-[#E4EAD9] space-y-2">
              <div className="flex items-center gap-2 text-[#284A12] font-bold text-xs">
                <Flame className="w-4 h-4 text-[#78A83A]" />
                <span>Zero-Waste Pantry Rescue</span>
              </div>
              <p className="text-xs text-[#71806A] leading-relaxed">
                Have fresh greens approaching expiry? Ask Zai for a 15-minute rescue soup or sauté to retain 98% of micronutrient density.
              </p>
            </div>
          </div>
        </section>
      </main>

      {/* Subtle Warm Footer */}
      <footer className="py-5 text-center text-xs text-[#71806A] border-t border-[#E5EAD8] mt-8 bg-[#FAFBF7]">
        <span>Zaiqo &bull; Personalized AI-Powered Food &amp; Wellness Platform</span>
      </footer>
    </div>
  );
}
