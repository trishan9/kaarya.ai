import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, userEvent, within } from "storybook/test";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "./tabs";

type TabsDemoProps = {
  variant?: "default" | "line";
  disableSecondTab?: boolean;
};

function TabsDemo({ disableSecondTab = false, variant = "default" }: TabsDemoProps) {
  return (
    <Tabs className="w-[420px]" defaultValue="overview">
      <TabsList variant={variant}>
        <TabsTrigger value="overview">Overview</TabsTrigger>
        <TabsTrigger disabled={disableSecondTab} value="settings">
          Settings
        </TabsTrigger>
      </TabsList>
      <TabsContent value="overview">
        <p className="text-sm">Overview content</p>
      </TabsContent>
      <TabsContent value="settings">
        <p className="text-sm">Settings content</p>
      </TabsContent>
    </Tabs>
  );
}

const meta = {
  title: "UI/Tabs",
  component: TabsDemo,
} satisfies Meta<typeof TabsDemo>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const LineVariant: Story = {
  args: {
    variant: "line",
  },
};

export const Disabled: Story = {
  args: {
    disableSecondTab: true,
  },
};

export const ToggleInteraction: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const settingsTab = canvas.getByRole("tab", { name: "Settings" });

    await userEvent.click(settingsTab);
    await expect(canvas.getByText("Settings content")).toBeVisible();
  },
};
