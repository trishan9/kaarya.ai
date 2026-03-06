import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, userEvent, within } from "storybook/test";

import { Textarea } from "./textarea";

const meta = {
  title: "UI/Textarea",
  component: Textarea,
  args: {
    "aria-label": "Message",
    placeholder: "Write your message...",
  },
} satisfies Meta<typeof Textarea>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Disabled: Story = {
  args: {
    disabled: true,
  },
};

export const Loading: Story = {
  args: {
    disabled: true,
    defaultValue: "Generating a tailored response...",
  },
};

export const TypingInteraction: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const textarea = canvas.getByRole("textbox", { name: "Message" });

    await userEvent.type(textarea, "Need help with resume feedback.");
    await expect(textarea).toHaveValue("Need help with resume feedback.");
  },
};
