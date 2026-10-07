import React, { useState } from 'react';
import { Plus, X, Sparkles } from 'lucide-react';
import { GROCERY_CATEGORIES, categorizeIngredient } from '../../services/groceryService';

export default function AddGroceryItemForm({ onAdd, onCancel }) {
  const [name, setName] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [unit, setUnit] = useState('pieces');
  const [category, setCategory] = useState('Vegetables');
  const [hasManuallySelectedCategory, setHasManuallySelectedCategory] = useState(false);

  const handleNameChange = (e) => {
    const newName = e.target.value;
    setName(newName);

    // Auto-predict category if user hasn't explicitly chosen one
    if (!hasManuallySelectedCategory && newName.trim().length > 1) {
      const predicted = categorizeIngredient(newName);
      setCategory(predicted);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) return;

    onAdd({
      name: name.trim(),
      quantity: quantity.trim() || '1',
      unit: unit.trim(),
      category: category,
    });

    // Reset form
    setName('');
    setQuantity('1');
    setUnit('pieces');
    setCategory('Vegetables');
    setHasManuallySelectedCategory(false);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="p-4 sm:p-5 bg-white rounded-2xl border border-emerald-200/90 shadow-sm space-y-4"
    >
      <div className="flex items-center justify-between pb-2 border-b border-slate-100">
        <div className="flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
          <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
            Add New Grocery Item
          </span>
        </div>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
            aria-label="Close add form"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
        {/* Ingredient Name */}
        <div className="sm:col-span-5">
          <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
            Ingredient Name
          </label>
          <input
            type="text"
            value={name}
            onChange={handleNameChange}
            placeholder="e.g. Greek yogurt, Spinach, Tomato"
            className="w-full bg-slate-50 border border-slate-200 hover:border-slate-300 focus:border-emerald-500 focus:bg-white rounded-xl px-3 py-2 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all shadow-2xs"
            required
            autoFocus
          />
        </div>

        {/* Quantity */}
        <div className="sm:col-span-2">
          <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
            Quantity
          </label>
          <input
            type="text"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            placeholder="e.g. 2, 250"
            className="w-full bg-slate-50 border border-slate-200 hover:border-slate-300 focus:border-emerald-500 focus:bg-white rounded-xl px-3 py-2 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all shadow-2xs"
            required
          />
        </div>

        {/* Unit */}
        <div className="sm:col-span-2">
          <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
            Unit
          </label>
          <input
            type="text"
            value={unit}
            onChange={(e) => setUnit(e.target.value)}
            placeholder="pieces, g, cup..."
            className="w-full bg-slate-50 border border-slate-200 hover:border-slate-300 focus:border-emerald-500 focus:bg-white rounded-xl px-3 py-2 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all shadow-2xs"
          />
        </div>

        {/* Category */}
        <div className="sm:col-span-3">
          <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
            Category
          </label>
          <select
            value={category}
            onChange={(e) => {
              setCategory(e.target.value);
              setHasManuallySelectedCategory(true);
            }}
            className="w-full bg-slate-50 border border-slate-200 hover:border-slate-300 focus:border-emerald-500 focus:bg-white rounded-xl px-2.5 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all shadow-2xs cursor-pointer"
          >
            {GROCERY_CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-end gap-2 pt-1">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="px-3.5 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 text-xs font-semibold cursor-pointer transition-colors"
          >
            Cancel
          </button>
        )}
        <button
          type="submit"
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs hover:shadow-sm cursor-pointer transition-all"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add to List</span>
        </button>
      </div>
    </form>
  );
}
