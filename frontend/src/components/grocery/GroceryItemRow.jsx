import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Check,
  Trash2,
  Edit3,
  X,
  Tag,
  BookOpen,
} from 'lucide-react';
import { GROCERY_CATEGORIES } from '../../services/groceryService';

export default function GroceryItemRow({
  item,
  onToggle,
  onDelete,
  onUpdate,
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(item.name);
  const [quantity, setQuantity] = useState(item.quantity);
  const [unit, setUnit] = useState(item.unit || '');
  const [category, setCategory] = useState(item.category || 'Other');

  const handleSave = (e) => {
    e.preventDefault();
    if (!name.trim()) return;

    onUpdate(item.id, {
      name: name.trim(),
      quantity: quantity,
      unit: unit.trim(),
      category: category,
    });
    setIsEditing(false);
  };

  const handleCancel = () => {
    setName(item.name);
    setQuantity(item.quantity);
    setUnit(item.unit || '');
    setCategory(item.category || 'Other');
    setIsEditing(false);
  };

  if (isEditing) {
    return (
      <motion.form
        initial={{ opacity: 0, y: -4 }}
        animate={{ opacity: 1, y: 0 }}
        onSubmit={handleSave}
        className="p-3.5 bg-emerald-50/50 rounded-2xl border border-emerald-200/80 shadow-xs space-y-3"
      >
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5">
          <div className="sm:col-span-5">
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
              Ingredient Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-emerald-500 shadow-2xs"
              required
            />
          </div>

          <div className="sm:col-span-2">
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
              Qty
            </label>
            <input
              type="text"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-emerald-500 shadow-2xs"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
              Unit
            </label>
            <input
              type="text"
              value={unit}
              placeholder="g, pieces..."
              onChange={(e) => setUnit(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-emerald-500 shadow-2xs"
            />
          </div>

          <div className="sm:col-span-3">
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
              Category
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-emerald-500 shadow-2xs"
            >
              {GROCERY_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 pt-1">
          <button
            type="button"
            onClick={handleCancel}
            className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 text-xs font-semibold cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs cursor-pointer"
          >
            Save Changes
          </button>
        </div>
      </motion.form>
    );
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.2 }}
      className={`group flex items-center justify-between gap-3 p-3 sm:p-3.5 rounded-2xl border transition-all ${
        item.completed
          ? 'bg-slate-50/80 border-slate-200/60 opacity-60'
          : 'bg-white border-slate-200/80 hover:border-emerald-200 hover:shadow-2xs'
      }`}
    >
      {/* Left: Checkbox & Name */}
      <div className="flex items-center gap-3 min-w-0 flex-1">
        {/* Custom Rounded Checkbox */}
        <button
          type="button"
          onClick={() => onToggle(item.id)}
          className={`w-5 h-5 rounded-lg border flex items-center justify-center transition-all cursor-pointer shrink-0 ${
            item.completed
              ? 'bg-emerald-600 border-emerald-600 text-white shadow-2xs'
              : 'border-slate-300 hover:border-emerald-500 bg-white'
          }`}
          aria-label={item.completed ? `Mark ${item.name} as uncompleted` : `Mark ${item.name} as completed`}
        >
          {item.completed && <Check className="w-3.5 h-3.5 stroke-[2.5]" />}
        </button>

        {/* Details */}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span
              onClick={() => onToggle(item.id)}
              className={`text-xs sm:text-sm font-semibold cursor-pointer select-none transition-all truncate ${
                item.completed
                  ? 'line-through text-slate-400'
                  : 'text-slate-800 hover:text-emerald-950'
              }`}
            >
              {item.name}
            </span>

            {/* Quantity and Unit Pill */}
            <span
              className={`inline-flex items-center text-[11px] font-bold px-2 py-0.5 rounded-md shrink-0 ${
                item.completed
                  ? 'bg-slate-100 text-slate-400'
                  : 'bg-emerald-50 text-emerald-800 border border-emerald-100'
              }`}
            >
              {item.quantity} {item.unit}
            </span>
          </div>

          {/* Source Attribution (subtle, clean) */}
          {item.sources && item.sources.length > 0 && (
            <div className="flex items-center gap-1.5 mt-0.5 text-[10px] text-slate-400 truncate">
              <BookOpen className="w-3 h-3 text-slate-400 shrink-0" />
              <span className="truncate">
                {item.sources.length === 1
                  ? `Source: ${item.sources[0]}`
                  : `Sources: ${item.sources.join(', ')}`}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Right: Category badge & Actions */}
      <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
        <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-semibold text-slate-500 bg-slate-100/90 px-2 py-0.5 rounded-md">
          <Tag className="w-2.5 h-2.5 text-slate-400" />
          <span>{item.category || 'Other'}</span>
        </span>

        {/* Edit Button */}
        <button
          type="button"
          onClick={() => setIsEditing(true)}
          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
          title="Edit item"
          aria-label={`Edit ${item.name}`}
        >
          <Edit3 className="w-3.5 h-3.5" />
        </button>

        {/* Delete Button */}
        <button
          type="button"
          onClick={() => onDelete(item.id)}
          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
          title="Delete item"
          aria-label={`Delete ${item.name}`}
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </motion.div>
  );
}
