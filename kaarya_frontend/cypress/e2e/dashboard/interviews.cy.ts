/// <reference types="cypress" />

describe("Interview Hub - Candidate", () => {
  beforeEach(() => {
    cy.loginAs("candidate");
    cy.visit("/interview-hub");
  });

  it("loads interview hub", () => {
    cy.contains(/interview hub|ai interview/i, { timeout: 5000 }).should("be.visible");
  });

  it("shows rating or interview content", () => {
    cy.contains(/rating|score|interview|mock|practice|start/i, { timeout: 5000 }).should("be.visible");
  });
});

describe("My Interviews - Candidate", () => {
  beforeEach(() => {
    cy.loginAs("candidate");
    cy.visit("/interviews");
  });

  it("loads my interviews page", () => {
    cy.contains(/interview/i, { timeout: 5000 }).should("be.visible");
  });

  it("has Create Interview button or link", () => {
    cy.contains("a, button", /create|new interview/i, { timeout: 5000 }).should("exist");
  });

  it("Create Interview navigates to create page", () => {
    cy.contains("a", /create|new interview/i, { timeout: 5000 }).first().click({ force: true });
    cy.url().should("include", "/interviews/create");
  });
});

describe("Create Interview - Candidate", () => {
  beforeEach(() => {
    cy.loginAs("candidate");
    cy.visit("/interviews/create");
  });

  it("loads create interview page", () => {
    cy.contains(/create|new interview|build.*interview/i, { timeout: 5000 }).should("be.visible");
  });

  it("shows form fields", () => {
    cy.contains(/role|position|topic|interview|voice|workflow/i, { timeout: 5000 }).should("be.visible");
  });
});
