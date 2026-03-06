/// <reference types="cypress" />

describe("Sign Up", () => {
  beforeEach(() => {
    cy.clearCookies();
    cy.visit("/sign-up");
  });

  it("renders form with all elements", () => {
    cy.contains("h1", "Create your account").should("be.visible");
    cy.get("#firstName").should("be.visible");
    cy.get("#lastName").should("be.visible");
    cy.get("#email").should("be.visible");
    cy.get("#password").should("be.visible");
    cy.get("#confirmPassword").should("be.visible");
  });

  it("shows all three role tabs", () => {
    cy.contains("[role='tab']", "Candidate").should("be.visible");
    cy.contains("[role='tab']", "Recruiter").should("be.visible");
    cy.contains("[role='tab']", "College").should("be.visible");
  });

  it("Candidate tab is active by default", () => {
    cy.contains("[role='tab']", "Candidate").should("have.attr", "data-state", "active");
    cy.get('button[type="submit"]').should("contain.text", "Sign Up");
  });

  it("switching to Recruiter tab shows company fields", () => {
    cy.contains("[role='tab']", "Recruiter").click();
    cy.get("#companyName").should("be.visible");
    cy.get('button[type="submit"]').should("contain.text", "Create Recruiter Workspace");
  });

  it("switching to College tab shows college fields", () => {
    cy.contains("[role='tab']", "College").click();
    cy.get("#collegeName").should("be.visible");
    cy.get('button[type="submit"]').should("contain.text", "Create College Workspace");
  });

  it("shows validation errors on empty submit", () => {
    cy.get('button[type="submit"]').click();
    cy.get('[aria-invalid="true"]').should("have.length.greaterThan", 0);
  });

  it("shows password mismatch error", () => {
    cy.get("#firstName").type("Test");
    cy.get("#lastName").type("User");
    cy.get("#email").type("test@example.com");
    cy.get("#password").type("Password123!!");
    cy.get("#confirmPassword").type("WrongPassword99!");
    cy.get('button[type="submit"]').click();
    cy.get('[aria-invalid="true"]').should("exist");
  });

  it("navigates to sign-in when link clicked", () => {
    cy.contains("a", "Sign in").click();
    cy.url().should("include", "/sign-in");
  });
});
