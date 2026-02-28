/// <reference types="cypress" />

describe("Applications - Candidate", () => {
  beforeEach(() => {
    cy.loginAs("candidate");
    cy.visit("/applications");
  });

  it("loads applications page", () => {
    cy.contains(/my applications|applications/i, { timeout: 5000 }).should("be.visible");
  });

  it("shows status columns or empty state", () => {
    cy.contains(/applied|reviewing|shortlisted|no application/i, { timeout: 5000 }).should("exist");
  });
});
