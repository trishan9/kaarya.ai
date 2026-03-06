/// <reference types="cypress" />

describe("Overview - Candidate", () => {
  beforeEach(() => {
    cy.loginAs("candidate");
    cy.visit("/overview");
  });

  it("renders Overview header", () => {
    cy.contains("Overview", { timeout: 5000 }).should("be.visible");
  });

  it("shows applications or job content", () => {
    cy.contains(/application|job|recommendation/i, { timeout: 5000 }).should("be.visible");
  });

  it("has link to jobs", () => {
    cy.get("a[href*='/jobs']", { timeout: 5000 }).should("exist");
  });
});
