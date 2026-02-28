import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, userEvent, within } from "storybook/test";

import { Input } from "./input";

const meta = {
  title: "UI/Input",
  component: Input,
  args: {
    "aria-label": "Name",
    placeholder: "Enter your name",
  },
} satisfies Meta<typeof Input>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Disabled: Story = {
  args: {
    disabled: true,
  },
};

export const Prefilled: Story = {
  args: {
    defaultValue: "Trish Sharma",
  },
};

export const TypingInteraction: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const input = canvas.getByRole("textbox", { name: "Name" });

    await userEvent.clear(input);
    await userEvent.type(input, "Kaarya");
    await expect(input).toHaveValue("Kaarya");
  },
};
