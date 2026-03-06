/// <reference types="cypress" />

describe("Admin", () => {
  beforeEach(() => cy.loginAs("admin"));

  it("redirects to /admin from overview", () => {
    cy.visit("/overview");
    cy.url({ timeout: 5000 }).should("include", "/admin");
  });

  it("users page loads", () => {
    cy.visit("/admin/users");
    cy.contains(/users|user management/i, { timeout: 5000 }).should("be.visible");
  });

  it("shows stats or user list", () => {
    cy.visit("/admin/users");
    cy.contains(/total|user|manage|filter/i, { timeout: 5000 }).should("exist");
  });

  it("create user form has required fields", () => {
    cy.visit("/admin/users/create");
    cy.contains(/create user|new user/i, { timeout: 5000 }).should("be.visible");
    cy.contains(/email|name|role/i, { timeout: 5000 }).should("be.visible");
  });
});
