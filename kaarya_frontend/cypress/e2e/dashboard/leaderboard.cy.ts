/// <reference types="cypress" />

describe("Leaderboard - Candidate", () => {
  beforeEach(() => {
    cy.loginAs("candidate");
    cy.visit("/leaderboard");
  });

  it("loads leaderboard page", () => {
    cy.contains(/leaderboard|ranking/i, { timeout: 5000 }).should("be.visible");
  });

  it("shows rankings or guide content", () => {
    cy.contains(/rank|score|leaderboard|how|guide|progress/i, { timeout: 5000 }).should("exist");
  });
});
