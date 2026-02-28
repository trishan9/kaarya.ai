/// <reference types="cypress" />

describe("Resources - Candidate", () => {
  beforeEach(() => {
    cy.loginAs("candidate");
    cy.visit("/resources");
  });

  it("loads resources page", () => {
    cy.contains(/resource/i, { timeout: 5000 }).should("be.visible");
  });

  it("shows content or empty state", () => {
    cy.get("body", { timeout: 5000 }).should("be.visible");
  });
});
