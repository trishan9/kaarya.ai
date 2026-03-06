import { defineConfig } from "cypress";

export default defineConfig({
  projectId: "rh6q7j",
  e2e: {
    baseUrl: "http://localhost:3001",
    specPattern: "cypress/e2e/**/*.cy.{ts,tsx}",
    supportFile: "cypress/support/e2e.ts",
    videosFolder: "cypress/videos",
    screenshotsFolder: "cypress/screenshots",
    viewportWidth: 1280,
    viewportHeight: 800,
    defaultCommandTimeout: 5000,
    pageLoadTimeout: 20000,
    requestTimeout: 15000,
    responseTimeout: 15000,
    env: {
      candidateEmail: "mailtotrishan@gmail.com",
      candidatePassword: "Password123!!",
      recruiterEmail: "trishanwagle5@gmail.com",
      recruiterPassword: "trishan1122@S",
      collegeEmail: "nischay@test.com",
      collegePassword: "trishan1122@S",
      adminEmail: "trishan@example.com",
      adminPassword: "Password123!",
    },
    retries: 0,
  },
});
