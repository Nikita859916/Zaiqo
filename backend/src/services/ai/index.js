import geminiRecipeProvider from './providers/geminiRecipe.provider.js';
import { BaseAiRecipeProvider } from './aiProvider.interface.js';

const registry = new Map();

// Register default providers
registry.set(geminiRecipeProvider.name, geminiRecipeProvider);

let defaultProviderName = geminiRecipeProvider.name;

/**
 * Register a custom or secondary AI recipe provider
 * @param {BaseAiRecipeProvider} provider
 */
export const registerAiRecipeProvider = (provider) => {
  if (!provider || !(provider instanceof BaseAiRecipeProvider)) {
    throw new Error('Provider must be an instance of BaseAiRecipeProvider.');
  }
  registry.set(provider.name, provider);
};

/**
 * Unregister an AI recipe provider by name
 * @param {string} name
 */
export const unregisterAiRecipeProvider = (name) => {
  if (typeof name !== 'string') return;
  const cleanName = name.trim().toLowerCase();
  if (cleanName === 'gemini') {
    // Reset to default instance
    registry.set('gemini', geminiRecipeProvider);
  } else {
    registry.delete(cleanName);
  }
};

/**
 * Get an AI recipe provider by name
 * @param {string} name
 * @returns {BaseAiRecipeProvider|null}
 */
export const getAiRecipeProvider = (name) => {
  if (!name || typeof name !== 'string') return null;
  return registry.get(name.trim().toLowerCase()) || null;
};

/**
 * Get the currently designated default AI recipe provider
 * @returns {BaseAiRecipeProvider}
 */
export const getDefaultAiRecipeProvider = () => {
  return registry.get(defaultProviderName) || geminiRecipeProvider;
};

/**
 * Set the default AI recipe provider name
 * @param {string} name
 */
export const setDefaultAiRecipeProvider = (name) => {
  const cleanName = String(name || '').trim().toLowerCase();
  if (registry.has(cleanName)) {
    defaultProviderName = cleanName;
  }
};

/**
 * List all registered provider names
 * @returns {Array<string>}
 */
export const listAiRecipeProviders = () => {
  return Array.from(registry.keys());
};

export { BaseAiRecipeProvider, geminiRecipeProvider };
