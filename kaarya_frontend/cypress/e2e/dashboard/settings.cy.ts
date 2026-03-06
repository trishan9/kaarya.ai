/// <reference types="cypress" />

describe("Settings - Candidate", () => {
  beforeEach(() => {
    cy.loginAs("candidate");
    cy.visit("/settings");
  });

  it("loads settings page with tabs", () => {
    cy.url().should("include", "/settings");
    cy.get("[role='tablist']", { timeout: 5000 }).should("exist");
  });

  it("can switch to Security tab", () => {
    cy.get("[role='tab']").contains(/security|password/i).click();
    cy.contains(/password/i, { timeout: 5000 }).should("be.visible");
  });
});
