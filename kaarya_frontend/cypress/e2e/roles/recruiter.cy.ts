/// <reference types="cypress" />

describe("Recruiter", () => {
  beforeEach(() => cy.loginAs("recruiter"));

  it("overview loads with stats", () => {
    cy.visit("/overview");
    cy.contains(/recruiter overview|open jobs|applicants/i, { timeout: 5000 }).should("be.visible");
  });

  it("create job navigates to /jobs/new", () => {
    cy.visit("/overview");
    cy.contains("a", /create job posting/i, { timeout: 5000 }).click({ force: true });
    cy.url().should("include", "/jobs/new");
  });

  it("jobs page shows company jobs", () => {
    cy.visit("/jobs");
    cy.contains(/company jobs|create job/i, { timeout: 5000 }).should("be.visible");
  });

  it("company settings loads", () => {
    cy.visit("/company-settings");
    cy.contains(/company|settings/i, { timeout: 5000 }).should("be.visible");
  });
});
