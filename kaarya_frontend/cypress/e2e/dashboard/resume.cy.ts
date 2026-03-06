/// <reference types="cypress" />

describe("Resume - Candidate", () => {
  beforeEach(() => {
    cy.loginAs("candidate");
    cy.visit("/resume");
  });

  it("loads resume page", () => {
    cy.contains(/resume/i, { timeout: 5000 }).should("be.visible");
  });

  it("shows builder or create flow", () => {
    cy.contains(/AI-powered|create|build|target role/i, { timeout: 5000 }).should("be.visible");
  });
});
