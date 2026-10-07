import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  ArrowRight,
  ChefHat,
  Send,
  Sparkles,
  Bot,
  User,
  RefreshCw,
  Clock,
  ShieldCheck,
  ShoppingCart,
  MessageSquare,
  Calendar,
  LogOut,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import AppNavigation from '../components/AppNavigation';
import ZaiCharacter from '../components/ZaiCharacter';
import RecipeStudio from '../components/recipe/RecipeStudio';
import GroceryListView from '../components/grocery/GroceryListView';
import MealPlannerView from '../components/planner/MealPlannerView';
import { processUserMessage } from '../services/aiService';
import { addIngredientsFromRecipe, loadGroceryList } from '../services/groceryService';

const starterSuggestions = [
  'I want a healthy dinner',
  'I have paneer and spinach',
  'Plan my meals for five days',
  'Make a grocery list',
  'I am vegetarian',
  'Show me quick breakfast recipes',
  'What can Zaiqo do?',
];

export default function ChatPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const [isZaiHappy, setIsZaiHappy] = useState(false);
  const [activeView, setActiveView] = useState('chat'); // 'chat' | 'recipe_studio' | 'grocery_list' | 'meal_planner'
  const [recipeStudioParams, setRecipeStudioParams] = useState(null);
  const [mealPlannerParams, setMealPlannerParams] = useState(null);
  const [groceryNotice, setGroceryNotice] = useState(null);
  const [groceryRemainingCount, setGroceryRemainingCount] = useState(0);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Sync grocery remaining items count
  const refreshGroceryCount = () => {
    const list = loadGroceryList();
    setGroceryRemainingCount(list.filter((i) => !i.completed).length);
  };

  useEffect(() => {
    refreshGroceryCount();
  }, [activeView]);

  const handleOpenRecipeStudio = (params = {}) => {
    setRecipeStudioParams(params);
    setActiveView('recipe_studio');
  };

  const handleOpenGroceryList = () => {
    setActiveView('grocery_list');
    refreshGroceryCount();
  };

  const handleOpenMealPlanner = (params = {}) => {
    setMealPlannerParams(params);
    setActiveView('meal_planner');
  };

  const handleAddToGroceryList = (recipe) => {
    const updated = addIngredientsFromRecipe(recipe);
    setGroceryRemainingCount(updated.filter((i) => !i.completed).length);
    setGroceryNotice(`Added ${recipe.ingredients?.length || 'recipe'} ingredients from "${recipe.name}" to your grocery list.`);
    setActiveView('grocery_list');
  };

  // Auto-scroll to bottom of conversation
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isThinking]);

  // Handle pre-loaded initial navigation or prompt
  useEffect(() => {
    if (location.state?.openRecipeStudio) {
      setActiveView('recipe_studio');
    } else if (location.state?.openGroceryList) {
      setActiveView('grocery_list');
    } else if (location.state?.openMealPlanner) {
      setActiveView('meal_planner');
    }

    if (location.state?.initialPrompt) {
      handleSendMessage(location.state.initialPrompt);
    } else {
      const searchParams = new URLSearchParams(location.search);
      const queryPrompt = searchParams.get('q');
      if (queryPrompt && queryPrompt.trim()) {
        handleSendMessage(queryPrompt.trim());
      }
    }
  }, [location.state, location.search]);

  const handleSendMessage = async (textToSend) => {
    const text = (textToSend || inputValue).trim();
    if (!text || isThinking) return;

    const userMessage = {
      id: Date.now().toString(),
      sender: 'user',
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue('');
    setIsThinking(true);

    try {
      const response = await processUserMessage(text, messages);

      const zaiMessage = {
        id: (Date.now() + 1).toString(),
        sender: 'zai',
        text: response.message,
        action: response.actionPayload,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, zaiMessage]);
      setIsZaiHappy(true);
      setTimeout(() => setIsZaiHappy(false), 900);
    } catch {
      const errorMessage = {
        id: (Date.now() + 1).toString(),
        sender: 'zai',
        text: "I encountered a momentary connection hiccup. Please try asking again.",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsThinking(false);
      inputRef.current?.focus();
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    handleSendMessage();
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleClearChat = () => {
    setMessages([]);
    setIsZaiHappy(true);
    setTimeout(() => setIsZaiHappy(false), 600);
  };

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <div className="min-h-screen bg-[#FAFAF9] flex flex-col justify-between selection:bg-emerald-500 selection:text-white">
      {/* Top App Header */}
      <AppNavigation />

      {/* Main Chat Interface Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Zai Interactive Companion Showcase (Desktop Sticky / Mobile Compact) */}
        <aside className="lg:col-span-4 bg-white/80 backdrop-blur-md rounded-3xl border border-slate-200/80 p-5 sm:p-6 shadow-sm flex flex-col items-center text-center lg:sticky lg:top-20">
          {/* Ambient subtle glow background */}
          <div className="relative w-full flex flex-col items-center">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-emerald-400/15 rounded-full blur-2xl pointer-events-none -z-10" />

            {/* Zai Character */}
            <div className="py-2">
              <ZaiCharacter
                isThinking={isThinking}
                isHappy={isZaiHappy}
                compact={false}
                showBadges={true}
                onClick={() => {
                  setIsZaiHappy(true);
                  setTimeout(() => setIsZaiHappy(false), 700);
                }}
              />
            </div>

            <div className="mt-4 space-y-1">
              <h2 className="text-lg font-bold text-slate-900">Zai</h2>
              <p className="text-xs text-slate-500 font-medium">
                Culinary &amp; Metabolic Intelligence
              </p>
            </div>

            <p className="text-xs text-slate-600 mt-2 max-w-xs leading-relaxed">
              I curate personalized recipes from your pantry, balance macros, and rescue leftover ingredients.
            </p>

            {/* Companion Trust Micro-Tags */}
            <div className="mt-4 pt-4 border-t border-slate-100 w-full flex items-center justify-center gap-4 text-[11px] text-slate-500 font-medium">
              <span className="flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> Dietitian Logic
              </span>
              <span>&bull;</span>
              <span className="flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-emerald-600" /> Zero Waste
              </span>
            </div>
          </div>
        </aside>

        {/* Right Column: Conversation Stream OR Recipe Studio OR Grocery List OR Meal Planner */}
        <section className="lg:col-span-8 flex flex-col bg-white rounded-3xl border border-slate-200/80 shadow-sm h-[650px] sm:h-[700px] overflow-hidden">
          {activeView === 'recipe_studio' ? (
            <RecipeStudio
              initialParams={recipeStudioParams || {}}
              onBackToChat={() => setActiveView('chat')}
              onOpenGroceryList={handleOpenGroceryList}
              onAddToGroceryList={handleAddToGroceryList}
              onOpenMealPlanner={handleOpenMealPlanner}
            />
          ) : activeView === 'grocery_list' ? (
            <GroceryListView
              initialNotice={groceryNotice}
              onBackToChat={() => setActiveView('chat')}
              onOpenRecipeStudio={() => setActiveView('recipe_studio')}
              onOpenMealPlanner={handleOpenMealPlanner}
            />
          ) : activeView === 'meal_planner' ? (
            <MealPlannerView
              initialParams={mealPlannerParams || {}}
              onBackToChat={() => setActiveView('chat')}
              onOpenRecipeStudio={() => setActiveView('recipe_studio')}
              onOpenGroceryList={({ notice } = {}) => {
                if (notice) setGroceryNotice(notice);
                handleOpenGroceryList();
              }}
            />
          ) : (
            <>
              {/* Chat Panel Controls Bar */}
              <div className="px-4 sm:px-6 py-3 border-b border-slate-100 flex items-center justify-between text-xs bg-slate-50/70 shrink-0">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="font-bold text-slate-800">Ask Zai &bull; Live Culinary Session</span>
                </div>
                {messages.length > 0 && (
                  <button
                    type="button"
                    onClick={handleClearChat}
                    className="inline-flex items-center gap-1.5 text-slate-500 hover:text-slate-800 px-2.5 py-1 rounded-lg hover:bg-slate-200/60 transition-colors font-semibold cursor-pointer text-xs"
                    title="Reset conversation"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Clear Chat</span>
                  </button>
                )}
              </div>

              {/* Chat Messages Stream */}
              <div
                className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4"
                role="log"
                aria-label="Conversation messages"
              >
            {/* Empty State */}
            {messages.length === 0 && (
              <div className="h-full flex flex-col items-center justify-center text-center p-4 max-w-md mx-auto space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-200/80 flex items-center justify-center text-emerald-600 shadow-xs">
                  <Sparkles className="w-6 h-6" />
                </div>

                <div className="space-y-1.5">
                  <h3 className="text-base sm:text-lg font-bold text-slate-900">
                    How can I assist your kitchen today?
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
                    Ask for recipe ideas from your pantry, ingredient substitutions, or metabolic meal suggestions.
                  </p>
                </div>

                {/* Clickable Starter Prompt Chips */}
                <div className="w-full space-y-2 pt-2">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block text-left sm:text-center">
                    Suggested prompts
                  </span>
                  <div className="flex flex-col gap-2">
                    {starterSuggestions.map((prompt) => (
                      <button
                        key={prompt}
                        onClick={() => handleSendMessage(prompt)}
                        className="w-full text-left text-xs font-medium text-slate-700 bg-slate-50 hover:bg-emerald-50/80 hover:text-emerald-900 border border-slate-200/80 hover:border-emerald-200 px-3.5 py-2.5 rounded-xl transition-all shadow-2xs cursor-pointer flex items-center justify-between group"
                      >
                        <span className="truncate pr-2">{prompt}</span>
                        <Send className="w-3 h-3 text-slate-400 group-hover:text-emerald-600 transition-colors shrink-0" />
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Rendered Messages */}
            <AnimatePresence initial={false}>
              {messages.map((msg) => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 10, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ duration: 0.25, ease: 'easeOut' }}
                  className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[85%] sm:max-w-[78%] flex gap-2.5 items-end ${
                      msg.sender === 'user' ? 'flex-row-reverse' : 'flex-row'
                    }`}
                  >
                    {/* Sender Avatar */}
                    <div
                      className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 text-xs shadow-xs ${
                        msg.sender === 'user'
                          ? 'bg-slate-800 text-white'
                          : 'bg-emerald-600 text-white'
                      }`}
                    >
                      {msg.sender === 'user' ? (
                        <User className="w-3.5 h-3.5" />
                      ) : (
                        <Bot className="w-3.5 h-3.5" />
                      )}
                    </div>

                    {/* Message Bubble Content */}
                    <div
                      className={`rounded-2xl px-4 py-3 text-xs sm:text-sm leading-relaxed shadow-xs ${
                        msg.sender === 'user'
                          ? 'bg-emerald-600 text-white rounded-br-xs'
                          : 'bg-slate-50 border border-slate-200/90 text-slate-800 rounded-bl-xs'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-3 mb-1">
                        <span
                          className={`text-[10px] font-bold uppercase tracking-wider ${
                            msg.sender === 'user' ? 'text-emerald-200' : 'text-emerald-700'
                          }`}
                        >
                          {msg.sender === 'user' ? 'You' : 'Zai'}
                        </span>
                        <span
                          className={`text-[10px] ${
                            msg.sender === 'user' ? 'text-emerald-200/70' : 'text-slate-400'
                          }`}
                        >
                          {msg.timestamp}
                        </span>
                      </div>
                      <p className="whitespace-pre-wrap">{msg.text}</p>

                      {/* Detected Zaiqo Intent / Action Card */}
                      {msg.action && (
                        <div className="mt-2.5 pt-2 border-t border-slate-200/80 space-y-1.5">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                              Zaiqo Action
                            </span>
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${
                                msg.action.meta?.badgeClass || 'bg-slate-100 text-slate-800'
                              }`}
                            >
                              {msg.action.meta?.label || msg.action.intent}
                            </span>
                          </div>

                          {/* Action Parameters if available */}
                          {msg.action.parameters && (
                            <div className="flex flex-wrap gap-1 pt-0.5">
                              {msg.action.parameters.ingredients?.length > 0 && (
                                <span className="text-[10px] bg-white border border-slate-200 text-slate-700 px-2 py-0.5 rounded-md font-medium">
                                  Ingredients: {msg.action.parameters.ingredients.join(', ')}
                                </span>
                              )}
                              {msg.action.parameters.mealType && (
                                <span className="text-[10px] bg-white border border-slate-200 text-slate-700 px-2 py-0.5 rounded-md font-medium">
                                  Meal: {msg.action.parameters.mealType}
                                </span>
                              )}
                              {msg.action.parameters.durationDays && (
                                <span className="text-[10px] bg-white border border-slate-200 text-slate-700 px-2 py-0.5 rounded-md font-medium">
                                  Duration: {msg.action.parameters.durationDays} days
                                </span>
                              )}
                              {msg.action.parameters.dietaryPreference && (
                                <span className="text-[10px] bg-white border border-slate-200 text-slate-700 px-2 py-0.5 rounded-md font-medium">
                                  Diet: {msg.action.parameters.dietaryPreference}
                                </span>
                              )}
                              {msg.action.parameters.cookingTime && (
                                <span className="text-[10px] bg-white border border-slate-200 text-slate-700 px-2 py-0.5 rounded-md font-medium">
                                  Time: {msg.action.parameters.cookingTime}
                                </span>
                              )}
                            </div>
                          )}

                          {/* Action Summary & Feature Hook */}
                          <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
                            <span className="truncate pr-2">{msg.action.summary}</span>
                            {msg.action.intent === 'RECIPE_GENERATION' ? (
                              <button
                                onClick={() => handleOpenRecipeStudio(msg.action.parameters)}
                                className="text-[10px] font-bold text-white bg-emerald-600 hover:bg-emerald-700 px-2.5 py-1 rounded-lg shadow-2xs transition-all cursor-pointer flex items-center gap-1 shrink-0"
                              >
                                <span>{msg.action.ctaLabel || 'Generate Recipe'}</span>
                                <ArrowRight className="w-3 h-3" />
                              </button>
                            ) : msg.action.intent === 'MEAL_PLANNING' ? (
                              <button
                                onClick={() => handleOpenMealPlanner(msg.action.parameters)}
                                className="text-[10px] font-bold text-white bg-emerald-600 hover:bg-emerald-700 px-2.5 py-1 rounded-lg shadow-2xs transition-all cursor-pointer flex items-center gap-1 shrink-0"
                              >
                                <span>{msg.action.ctaLabel || 'Review Meal Plan'}</span>
                                <ArrowRight className="w-3 h-3" />
                              </button>
                            ) : msg.action.intent === 'GROCERY_LIST' ? (
                              <button
                                onClick={handleOpenGroceryList}
                                className="text-[10px] font-bold text-white bg-emerald-600 hover:bg-emerald-700 px-2.5 py-1 rounded-lg shadow-2xs transition-all cursor-pointer flex items-center gap-1 shrink-0"
                              >
                                <span>{msg.action.ctaLabel || 'Open Grocery List'}</span>
                                <ArrowRight className="w-3 h-3" />
                              </button>
                            ) : (
                              <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200/60 shrink-0">
                                {msg.action.ctaLabel}
                              </span>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {/* Thinking / Typing State Indicator */}
            {isThinking && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 8 }}
                className="flex justify-start"
              >
                <div className="flex gap-2.5 items-end">
                  <div className="w-7 h-7 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                    <Bot className="w-3.5 h-3.5" />
                  </div>
                  <div className="bg-slate-50 border border-slate-200/90 rounded-2xl rounded-bl-xs px-4 py-3 shadow-xs flex items-center gap-2">
                    <span className="text-xs font-semibold text-slate-600">Zai is thinking</span>
                    <div className="flex items-center gap-1 pt-0.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-bounce" />
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-bounce [animation-delay:0.2s]" />
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-bounce [animation-delay:0.4s]" />
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Scroll Anchor */}
            <div ref={messagesEndRef} />
          </div>

          {/* Bottom Message Input Area */}
          <div className="border-t border-slate-200/80 bg-white p-3 sm:p-4">
            <form onSubmit={handleSubmit} className="flex items-center gap-2">
              <input
                ref={inputRef}
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask Zai about ingredients, recipes, or nutrition..."
                disabled={isThinking}
                className="flex-1 bg-slate-50 border border-slate-200/90 hover:border-slate-300 focus:border-emerald-500 focus:bg-white rounded-2xl px-4 py-3 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all shadow-xs disabled:opacity-50"
              />

              <motion.button
                type="submit"
                disabled={!inputValue.trim() || isThinking}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="p-3 sm:px-4 sm:py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed text-white text-xs font-bold transition-all shadow-sm shadow-emerald-600/20 flex items-center gap-1.5 cursor-pointer"
                title="Send message"
                aria-label="Send message to Zai"
              >
                <Send className="w-4 h-4" />
                <span className="hidden sm:inline">Send</span>
              </motion.button>
            </form>

            <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 px-1">
              <span>Press Enter to send</span>
              <span>AI Culinary Assistant</span>
            </div>
          </div>
            </>
          )}
        </section>
      </main>
    </div>
  );
}
