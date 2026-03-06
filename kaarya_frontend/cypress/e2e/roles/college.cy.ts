/// <reference types="cypress" />

describe("College", () => {
  beforeEach(() => cy.loginAs("college"));

  it("overview loads", () => {
    cy.visit("/overview");
    cy.contains(/college overview|open jobs|applicants/i, { timeout: 5000 }).should("be.visible");
  });

  it("create job navigates to /jobs/new", () => {
    cy.visit("/overview");
    cy.contains("a", /create job posting/i, { timeout: 5000 }).click({ force: true });
    cy.url().should("include", "/jobs/new");
  });

  it("college settings loads", () => {
    cy.visit("/college-settings");
    cy.contains(/college|settings/i, { timeout: 5000 }).should("be.visible");
  });

  it("jobs page shows college jobs", () => {
    cy.visit("/jobs");
    cy.contains(/college jobs|create job/i, { timeout: 5000 }).should("be.visible");
  });
});
