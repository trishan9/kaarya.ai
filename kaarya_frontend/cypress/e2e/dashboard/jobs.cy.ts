/// <reference types="cypress" />

describe("Jobs - Candidate", () => {
  beforeEach(() => {
    cy.loginAs("candidate");
    cy.visit("/jobs");
  });

  it("loads jobs page", () => {
    cy.contains(/Explore Jobs|Internships|job/i, { timeout: 5000 }).should("be.visible");
  });

  it("search form works", () => {
    cy.get('form[action="/jobs"] input[name="search"]', { timeout: 5000 }).clear().type("dev");
    cy.get('form[action="/jobs"] button[type="submit"]').click();
    cy.url().should("include", "search=dev");
  });

  it("location filter works", () => {
    cy.get('form[action="/jobs"] input[name="location"]', { timeout: 5000 }).clear().type("Kathmandu");
    cy.get('form[action="/jobs"] button[type="submit"]').click();
    cy.url().should("include", "location=Kathmandu");
  });

  it("job cards or empty state visible", () => {
    cy.contains(/job|internship|no jobs|no results/i, { timeout: 5000 }).should("be.visible");
  });
});
