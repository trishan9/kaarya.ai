/// <reference types="cypress" />

describe("Sign In", () => {
  beforeEach(() => {
    cy.clearCookies();
    cy.clearLocalStorage();
    cy.visit("/sign-in", { timeout: 25000 });
    cy.get("#email", { timeout: 5000 }).should("be.visible");
  });

  it("renders form with all elements", () => {
    cy.contains("h1", "Welcome back").should("be.visible");
    cy.get("#email").should("be.visible");
    cy.get("#password").should("be.visible");
    cy.get('button[type="submit"]').should("contain.text", "Sign In");
    cy.contains("a", "Forgot Password?").should("be.visible");
    cy.contains("a", "Sign Up").should("be.visible");
  });

  it("shows validation error on empty submit", () => {
    cy.get('button[type="submit"]').click();
    cy.get("#email").should("have.attr", "aria-invalid", "true");
  });

  it("rejects wrong credentials and stays on sign-in", () => {
    cy.get("#email").type("wrong@example.com");
    cy.get("#password").type("wrongpass");
    cy.get('button[type="submit"]').click();
    cy.url({ timeout: 8000 }).should("include", "/sign-in");
  });

  it("navigates to sign-up", () => {
    cy.contains("a", "Sign Up").click();
    cy.url().should("include", "/sign-up");
  });

  it("logs in as candidate and lands on overview", () => {
    cy.get("#email").type("mailtotrishan@gmail.com");
    cy.get("#password").type("Password123!!");
    cy.get('button[type="submit"]').click();
    cy.url({ timeout: 8000 }).should("include", "/overview");
  });

  it("logs in as recruiter and lands on overview", () => {
    cy.get("#email").type("trishanwagle5@gmail.com");
    cy.get("#password").type("trishan1122@S");
    cy.get('button[type="submit"]').click();
    cy.url({ timeout: 8000 }).should("include", "/overview");
  });

  it("logs in as college and lands on overview", () => {
    cy.get("#email").type("nischay@test.com");
    cy.get("#password").type("trishan1122@S");
    cy.get('button[type="submit"]').click();
    cy.url({ timeout: 8000 }).should("include", "/overview");
  });

  it("logs in as admin and redirects to admin", () => {
    cy.get("#email").type("trishan@example.com");
    cy.get("#password").type("Password123!");
    cy.get('button[type="submit"]').click();
    cy.url({ timeout: 8000 }).should("include", "/admin");
  });
});
