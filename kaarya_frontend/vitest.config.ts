import path from "node:path";
import { fileURLToPath } from "node:url";

import { storybookTest } from "@storybook/addon-vitest/vitest-plugin";
import { playwright } from "@vitest/browser-playwright";
import { defineConfig, type ViteUserConfig } from "vitest/config";

const dirname =
  typeof __dirname !== "undefined"
    ? __dirname
    : path.dirname(fileURLToPath(import.meta.url));

export default defineConfig(
  (async (): Promise<ViteUserConfig> => {
    const resolveConfig = {
      alias: {
        "@": path.resolve(dirname, "."),
        "server-only": path.resolve(dirname, "tests/mocks/server-only.ts"),
      },
    };

    const isStorybookVitest =
      process.env.VITEST_STORYBOOK === "true" &&
      typeof process.env.STORYBOOK_CONFIG_DIR === "string";

    if (isStorybookVitest) {
      const configDir = process.env.STORYBOOK_CONFIG_DIR as string;

      return {
        resolve: resolveConfig,
        optimizeDeps: {
          include: ["radix-ui", "@radix-ui/react-dropdown-menu", "@radix-ui/react-tabs"],
        },
        test: {
          projects: [
            {
              extends: true,
              plugins: await storybookTest({ configDir }),
              test: {
                browser: {
                  enabled: true,
                  headless: true,
                  provider: playwright({}),
                  instances: [{ browser: "chromium" }],
                },
                setupFiles: ["./.storybook/vitest.setup.ts"],
              },
            },
          ],
        },
      };
    }

    return {
      resolve: resolveConfig,
      test: {
        globals: true,
        environment: "jsdom",
        setupFiles: ["./tests/setup/vitest.setup.ts"],
        include: [
          "tests/unit/**/*.spec.ts",
          "tests/unit/**/*.spec.tsx",
          "tests/integration/**/*.spec.ts",
          "tests/integration/**/*.spec.tsx",
        ],
        coverage: {
          provider: "v8",
          reporter: ["text", "html", "lcov"],
          reportsDirectory: "./coverage/unit",
          include: [
            "lib/utils.ts",
            "lib/pagination.ts",
            "lib/workspaces.ts",
            "lib/compute-profile-rating.ts",
            "lib/date/relative-time.ts",
            "lib/session.ts",
            "lib/dal.ts",
            "lib/api/endpoints.ts",
            "lib/actions/**/*.ts",
            "hooks/use-mobile.ts",
            "components/ui/button.tsx",
            "components/bookmark/bookmark-toggle-button.tsx",
            "app/(public)/_components/NavLink.tsx",
            "app/(protected)/(dashboard)/_config/sidebar-items.ts",
            "app/(protected)/(dashboard)/leaderboard/_lib/leaderboard-utils.ts",
            "app/(protected)/admin/_lib/admin-page-utils.ts",
            "app/(protected)/(dashboard)/inbox/_components/stream-huddle-utils.ts",
            "app/(auth)/_hooks/use-sign-in.ts",
            "app/(auth)/_hooks/use-sign-up.ts",
            "app/(auth)/_hooks/use-log-out.ts",
            "app/(auth)/_hooks/use-password-reset-flow.ts",
            "app/(auth)/_schemas/index.ts",
            "app/(protected)/(dashboard)/jobs/new/_schemas/index.ts",
            "app/(protected)/(dashboard)/jobs/new/_hooks/use-create-job.ts",
            "app/(protected)/(dashboard)/college-settings/_schemas/index.ts",
            "app/(protected)/(dashboard)/college-settings/_hooks/use-college-settings.ts",
            "app/(protected)/(dashboard)/company-settings/_schemas/index.ts",
            "app/(protected)/(dashboard)/company-settings/_hooks/use-company-settings.ts",
            "app/(protected)/admin/_schemas/index.ts",
            "app/(protected)/admin/users/_hooks/use-create-user.ts",
            "app/(protected)/admin/users/_hooks/use-update-user.ts",
            "app/(protected)/(dashboard)/settings/_components/profile/_schemas/index.ts",
            "app/(protected)/(dashboard)/settings/_components/profile/_hooks/use-update-profile.ts",
          ],
          thresholds: {
            statements: 95,
            branches: 95,
            functions: 95,
            lines: 95,
          },
        },
      },
    };
  })(),
);
