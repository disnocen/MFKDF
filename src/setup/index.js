/**
 * Multi-factor derived key setup
 *
 * This module exports the necessary components for setting up a multi-factor derived key.
 * It combines key derivation functions, key setup functions, and factor setup functions
 * to provide a comprehensive setup for multi-factor authentication.
 *
 * @namespace setup
 */
module.exports = {
  // Import and spread the key derivation functions from the 'kdf' module.
  // These functions are responsible for the cryptographic operations involved
  // in deriving keys from multiple factors.
  ...require("./kdf"),

  // Import and spread the key setup functions from the 'key' module.
  // These functions handle the configuration and initialization of the
  // multi-factor derived key, including setting up policies and options.
  ...require("./key"),

  // Import the factor setup functions from the 'factors' module.
  // These functions are used to configure individual factors that
  // contribute to the multi-factor key derivation process.
  factors: require("./factors"),
};
