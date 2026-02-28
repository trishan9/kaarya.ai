/// <reference types="cypress" />

describe("Inbox - Candidate", () => {
  beforeEach(() => {
    cy.loginAs("candidate");
    cy.visit("/inbox");
  });

  it("loads inbox page", () => {
    cy.contains(/inbox|message|conversation/i, { timeout: 5000 }).should("be.visible");
  });
});
