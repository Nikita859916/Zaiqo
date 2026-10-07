import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShoppingCart,
  Plus,
  Trash2,
  CheckCircle2,
  ArrowLeft,
  ChefHat,
  Filter,
  Layers,
  Sparkles,
  X,
  RotateCcw,
  Calendar,
} from 'lucide-react';
import GroceryItemRow from './GroceryItemRow';
import AddGroceryItemForm from './AddGroceryItemForm';
import {
  GROCERY_CATEGORIES,
  loadGroceryList,
  addManualItem,
  updateGroceryItem,
  deleteGroceryItem,
  toggleGroceryItem,
  clearCompletedItems,
  clearAllItems,
} from '../../services/groceryService';

export default function GroceryListView({
  onBackToChat,
  onOpenRecipeStudio,
  onOpenMealPlanner,
  initialNotice = null,
}) {
  const [items, setItems] = useState([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [confirmationNotice, setConfirmationNotice] = useState(initialNotice);

  // Load items on mount
  useEffect(() => {
    setItems(loadGroceryList());
  }, []);

  // Update confirmation notice if prop changes
  useEffect(() => {
    if (initialNotice) {
      setConfirmationNotice(initialNotice);
    }
  }, [initialNotice]);

  const remainingCount = items.filter((item) => !item.completed).length;
  const completedCount = items.filter((item) => item.completed).length;

  const handleToggle = (id) => {
    const updated = toggleGroceryItem(id);
    setItems(updated);
  };

  const handleDelete = (id) => {
    const updated = deleteGroceryItem(id);
    setItems(updated);
  };

  const handleUpdate = (id, updates) => {
    const updated = updateGroceryItem(id, updates);
    setItems(updated);
  };

  const handleAddItem = (itemData) => {
    const updated = addManualItem(itemData);
    setItems(updated);
    setShowAddForm(false);
    setConfirmationNotice(`Added "${itemData.name}" to your grocery list.`);
  };

  const handleClearCompleted = () => {
    const updated = clearCompletedItems();
    setItems(updated);
  };

  const handleClearAll = () => {
    if (items.length === 0) return;
    const confirmed = window.confirm('Are you sure you want to clear your entire grocery list?');
    if (confirmed) {
      const updated = clearAllItems();
      setItems(updated);
    }
  };

  // Filter items by category if not 'All'
  const filteredItems = selectedCategory === 'All'
    ? items
    : items.filter((item) => (item.category || 'Other') === selectedCategory);

  // Group filtered items by category
  const groupedCategories = GROCERY_CATEGORIES.map((cat) => {
    const categoryItems = filteredItems.filter(
      (item) => (item.category || 'Other') === cat
    );
    return {
      category: cat,
      items: categoryItems,
    };
  }).filter((group) => group.items.length > 0);

  return (
    <div className="flex flex-col h-full bg-[#FAFAF9] rounded-3xl overflow-hidden">
      {/* Top Header Bar */}
      <div className="bg-white border-b border-slate-200/90 px-4 sm:px-6 py-4 flex flex-wrap items-center justify-between gap-3 shrink-0">
        {/* Left: Back Navigation & Title */}
        <div className="flex items-center gap-3">
          {onBackToChat && (
            <button
              onClick={onBackToChat}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-emerald-50 text-slate-700 hover:text-emerald-800 text-xs font-semibold transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-emerald-600"
              title="Return to Zai Chat conversation"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Chat</span>
            </button>
          )}

          {onOpenRecipeStudio && (
            <button
              onClick={onOpenRecipeStudio}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors cursor-pointer"
              title="Open Recipe Studio"
            >
              <ChefHat className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Recipe Studio</span>
            </button>
          )}

          {onOpenMealPlanner && (
            <button
              onClick={onOpenMealPlanner}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors cursor-pointer"
              title="Open Meal Planner"
            >
              <Calendar className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Meal Planner</span>
            </button>
          )}

          <div className="h-4 w-px bg-slate-200 hidden sm:block" />

          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-2xs">
              <ShoppingCart className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-slate-900 leading-tight">
                  Grocery List
                </h2>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                  {remainingCount} {remainingCount === 1 ? 'item' : 'items'} remaining
                </span>
              </div>
              <span className="text-[10px] text-slate-500 font-medium">
                Organized by Supermarket Category &bull; Auto-combined
              </span>
            </div>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2">
          {completedCount > 0 && (
            <button
              onClick={handleClearCompleted}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-semibold transition-colors cursor-pointer"
              title="Clear completed items"
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span className="hidden sm:inline">Clear Completed ({completedCount})</span>
              <span className="sm:hidden">Clear ({completedCount})</span>
            </button>
          )}

          {items.length > 0 && (
            <button
              onClick={handleClearAll}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 text-xs font-medium transition-colors cursor-pointer"
              title="Clear entire grocery list"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Clear List</span>
            </button>
          )}

          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs cursor-pointer transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Item</span>
          </button>
        </div>
      </div>

      {/* Main Workspace Body */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-6">
        <div className="max-w-4xl mx-auto space-y-5">
          {/* Confirmation Notice Banner */}
          <AnimatePresence>
            {confirmationNotice && (
              <motion.div
                initial={{ opacity: 0, y: -8, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -8 }}
                className="bg-emerald-50 border border-emerald-200/90 rounded-2xl p-3.5 sm:p-4 flex items-center justify-between gap-3 text-xs sm:text-sm text-emerald-950 shadow-2xs"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-6 h-6 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  </div>
                  <span className="font-medium">{confirmationNotice}</span>
                </div>
                <button
                  onClick={() => setConfirmationNotice(null)}
                  className="p-1 text-emerald-700 hover:text-emerald-900 rounded-lg hover:bg-emerald-100 transition-colors cursor-pointer shrink-0"
                  aria-label="Dismiss message"
                >
                  <X className="w-4 h-4" />
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Collapsible Add Item Form */}
          <AnimatePresence>
            {showAddForm && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.22 }}
              >
                <AddGroceryItemForm
                  onAdd={handleAddItem}
                  onCancel={() => setShowAddForm(false)}
                />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Department / Category Quick Filter Tabs */}
          {items.length > 0 && (
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
              <button
                type="button"
                onClick={() => setSelectedCategory('All')}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  selectedCategory === 'All'
                    ? 'bg-slate-900 text-white shadow-2xs'
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                }`}
              >
                All Departments ({items.length})
              </button>
              {GROCERY_CATEGORIES.map((cat) => {
                const count = items.filter(
                  (item) => (item.category || 'Other') === cat
                ).length;
                if (count === 0) return null;
                return (
                  <button
                    type="button"
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                      selectedCategory === cat
                        ? 'bg-emerald-600 text-white shadow-2xs'
                        : 'bg-white text-slate-600 border border-slate-200 hover:border-emerald-200 hover:bg-emerald-50/40'
                    }`}
                  >
                    {cat} ({count})
                  </button>
                );
              })}
            </div>
          )}

          {/* Grocery Items List */}
          {items.length === 0 ? (
            /* Empty State */
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-3xl border border-slate-200/90 p-8 sm:p-12 text-center space-y-4 shadow-sm"
            >
              <div className="w-16 h-16 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 mx-auto shadow-2xs">
                <ShoppingCart className="w-8 h-8" />
              </div>
              <div className="space-y-1.5 max-w-sm mx-auto">
                <h3 className="text-base sm:text-lg font-bold text-slate-900">
                  Your grocery list is empty
                </h3>
                <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
                  Generate a recipe to add ingredients automatically, or add pantry items manually.
                </p>
              </div>
              <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                <button
                  onClick={() => setShowAddForm(true)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white border border-slate-200 hover:border-emerald-300 hover:bg-emerald-50/40 text-slate-700 text-xs font-semibold shadow-2xs cursor-pointer transition-all"
                >
                  <Plus className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Add Item Manually</span>
                </button>
                {onOpenRecipeStudio && (
                  <button
                    onClick={onOpenRecipeStudio}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs cursor-pointer transition-all"
                  >
                    <ChefHat className="w-3.5 h-3.5" />
                    <span>Generate a Recipe</span>
                  </button>
                )}
              </div>
            </motion.div>
          ) : (
            /* Categorized Items List */
            <div className="space-y-6">
              {groupedCategories.map((group) => (
                <div key={group.category} className="space-y-2.5">
                  {/* Category Header */}
                  <div className="flex items-center justify-between px-1">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-500" />
                      <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                        {group.category}
                      </h3>
                    </div>
                    <span className="text-[11px] font-semibold text-slate-400">
                      {group.items.length} {group.items.length === 1 ? 'item' : 'items'}
                    </span>
                  </div>

                  {/* Category Items */}
                  <div className="space-y-2">
                    {group.items.map((item) => (
                      <GroceryItemRow
                        key={item.id}
                        item={item}
                        onToggle={handleToggle}
                        onDelete={handleDelete}
                        onUpdate={handleUpdate}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
