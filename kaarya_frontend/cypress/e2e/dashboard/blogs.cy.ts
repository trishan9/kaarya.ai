/// <reference types="cypress" />

describe("Blogs - Candidate", () => {
  beforeEach(() => {
    cy.loginAs("candidate");
    cy.visit("/blogs");
  });

  it("loads blogs page", () => {
    cy.contains(/blog|article|resource/i, { timeout: 5000 }).should("be.visible");
  });

  it("has search or filter input", () => {
    cy.get("input", { timeout: 5000 }).should("exist");
  });

  it("shows article cards or empty state", () => {
    cy.get("body").then(($body) => {
      const $links = $body.find("a[href*='/blogs/']");
      if ($links.length) {
        cy.wrap($links).first().should("be.visible");
      } else {
        cy.contains(/blog|article|no articles/i, { timeout: 5000 }).should("be.visible");
      }
    });
  });

  it("clicking blog card navigates to article", () => {
    cy.get("a[href*='/blogs/']", { timeout: 5000 }).then(($links) => {
      if ($links.length) {
        cy.wrap($links).first().click({ force: true });
        cy.url().should("match", /\/blogs\/[^/]+/);
      }
    });
  });
});
