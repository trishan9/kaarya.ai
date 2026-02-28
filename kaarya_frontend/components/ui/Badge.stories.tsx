import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { Badge } from "./badge";

const meta = {
  title: "UI/Badge",
  component: Badge,
  args: {
    children: "New",
  },
} satisfies Meta<typeof Badge>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Destructive: Story = {
  args: {
    variant: "destructive",
    children: "Rejected",
  },
};

export const Variants: Story = {
  render: () => (
    <div className="flex flex-wrap items-center gap-3">
      <Badge variant="default">Default</Badge>
      <Badge variant="secondary">Secondary</Badge>
      <Badge variant="destructive">Destructive</Badge>
      <Badge variant="outline">Outline</Badge>
    </div>
  ),
};
