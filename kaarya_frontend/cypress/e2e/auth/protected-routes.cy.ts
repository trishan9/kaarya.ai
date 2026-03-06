/// <reference types="cypress" />

describe("Protected Routes - Unauthenticated", () => {
  beforeEach(() => {
    cy.clearCookies();
  });

  it("redirects /overview to sign-in", () => {
    cy.visit("/overview");
    cy.url({ timeout: 5000 }).should("include", "/sign-in");
  });

  it("redirects /jobs to sign-in", () => {
    cy.visit("/jobs");
    cy.url({ timeout: 5000 }).should("include", "/sign-in");
  });

  it("redirects /settings to sign-in", () => {
    cy.visit("/settings");
    cy.url({ timeout: 5000 }).should("include", "/sign-in");
  });

  it("redirects /admin to sign-in", () => {
    cy.visit("/admin");
    cy.url({ timeout: 5000 }).should("include", "/sign-in");
  });

  it("redirects /interview-hub to sign-in", () => {
    cy.visit("/interview-hub");
    cy.url({ timeout: 5000 }).should("include", "/sign-in");
  });

  it("redirects /resume to sign-in", () => {
    cy.visit("/resume");
    cy.url({ timeout: 5000 }).should("include", "/sign-in");
  });
});

describe("Protected Routes - Authenticated redirect", () => {
  it("authenticated candidate visiting /sign-in redirects away", () => {
    cy.loginAs("candidate");
    cy.visit("/sign-in");
    cy.url({ timeout: 5000 }).should("not.include", "/sign-in");
  });

  it("authenticated candidate visiting /sign-up redirects away", () => {
    cy.loginAs("candidate");
    cy.visit("/sign-up");
    cy.url({ timeout: 5000 }).should("not.include", "/sign-up");
  });
});

describe("Protected Routes - Role-based", () => {
  it("admin visiting /overview redirects to /admin", () => {
    cy.loginAs("admin");
    cy.visit("/overview");
    cy.url({ timeout: 5000 }).should("include", "/admin");
  });

  it("recruiter cannot access /admin", () => {
    cy.loginAs("recruiter");
    cy.visit("/admin");
    cy.url({ timeout: 5000 }).should("not.include", "/admin");
  });

  it("college cannot access /admin", () => {
    cy.loginAs("college");
    cy.visit("/admin");
    cy.url({ timeout: 5000 }).should("not.include", "/admin");
  });
});
