/// <reference types="cypress" />

declare global {
  namespace Cypress {
    interface Chainable {
      loginAs(role: "candidate" | "recruiter" | "college" | "admin"): Chainable<void>;
      logout(): Chainable<void>;
      waitForPageLoad(): Chainable<void>;
      dismissToast(): Chainable<void>;
    }
  }
}

const CREDENTIALS: Record<string, { email: string; password: string }> = {
  candidate: {
    email: "mailtotrishan@gmail.com",
    password: "Password123!!",
  },
  recruiter: {
    email: "trishanwagle5@gmail.com",
    password: "trishan1122@S",
  },
  college: {
    email: "nischay@test.com",
    password: "trishan1122@S",
  },
  admin: {
    email: "trishan@example.com",
    password: "Password123!",
  },
};

/**
 * Login as a specific role, caching the session so subsequent calls in the
 * same spec don't re-login via the network.
 */
Cypress.Commands.add("loginAs", (role) => {
  const { email, password } = CREDENTIALS[role];

  cy.session(
    [role, email],
    () => {
      cy.visit("/sign-in");
      cy.get("#email", { timeout: 5000 }).should("be.visible").clear().type(email);
      cy.get("#password").clear().type(password);
      cy.get('button[type="submit"]').click();
      cy.url({ timeout: 8000 }).should("not.include", "/sign-in");
    },
    {
      cacheAcrossSpecs: true,
    }
  );
});

/**
 * Log out via the profile menu Logout button.
 */
Cypress.Commands.add("logout", () => {
  cy.visit("/overview");
  cy.contains("button", "Open profile menu", { timeout: 10000 }).click();
  cy.contains("button", /logout|log out/i, { timeout: 5000 }).click();
  cy.url({ timeout: 10000 }).should("include", "/sign-in");
});

/**
 * Wait until no loading spinners are visible.
 */
Cypress.Commands.add("waitForPageLoad", () => {
  cy.get('[class*="animate-spin"]', { timeout: 15000 }).should("not.exist");
});

/**
 * Dismiss any visible Sonner toast notifications.
 */
Cypress.Commands.add("dismissToast", () => {
  cy.get("body").then(($body) => {
    if ($body.find("[data-sonner-toast]").length > 0) {
      cy.get("[data-sonner-toast]").each(($toast) => {
        cy.wrap($toast).find("button[data-close-button]").click({ force: true });
      });
    }
  });
});

export {};
