/// <reference types="cypress" />

describe("Saved - Candidate", () => {
  beforeEach(() => {
    cy.loginAs("candidate");
    cy.visit("/saved");
  });

  it("loads saved jobs page", () => {
    cy.contains(/saved|bookmark/i, { timeout: 5000 }).should("be.visible");
  });

  it("shows saved jobs or empty state", () => {
    cy.contains(/saved|no saved|bookmark|job/i, { timeout: 5000 }).should("be.visible");
  });
});
