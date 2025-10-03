/**
 * Initialize RegExp prototype extensions immediately upon import.
 * This ensures prototype methods are available before any other modules are loaded.
 */
import {addToPrototype} from "./global";

// Call addToPrototype immediately when this module is imported
addToPrototype();

export const initialized = true;
