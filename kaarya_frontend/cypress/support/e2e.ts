/// <reference types="cypress" />

import "./commands";

// Global error handler — ignore uncaught Next.js/RSC errors that are not test failures
Cypress.on("uncaught:exception", (err) => {
  if (
    err.message.includes("Hydration") ||
    err.message.includes("hydration") ||
    err.message.includes("ResizeObserver loop") ||
    err.message.includes("Non-Error promise rejection") ||
    err.message.includes("NEXT_REDIRECT") ||
    err.message.includes("ChunkLoadError") ||
    err.message.includes("cancelled") ||
    err.message.includes("NetworkError")
  ) {
    return false;
  }
  return true;
});
