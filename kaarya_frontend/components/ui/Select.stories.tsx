import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, fn, userEvent, within } from "storybook/test";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./select";

type SelectDemoProps = {
  disabled?: boolean;
  size?: "sm" | "default";
  defaultValue?: string;
  onValueChange?: (value: string) => void;
};

function SelectDemo({
  defaultValue,
  disabled = false,
  onValueChange,
  size = "default",
}: SelectDemoProps) {
  return (
    <Select defaultValue={defaultValue} disabled={disabled} onValueChange={onValueChange}>
      <SelectTrigger aria-label="Framework" className="w-56" size={size}>
        <SelectValue placeholder="Select a framework" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="nextjs">Next.js</SelectItem>
        <SelectItem value="react">React</SelectItem>
        <SelectItem value="vite">Vite</SelectItem>
      </SelectContent>
    </Select>
  );
}

const meta = {
  title: "UI/Select",
  component: SelectDemo,
} satisfies Meta<typeof SelectDemo>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Disabled: Story = {
  args: {
    disabled: true,
  },
};

export const SizeExamples: Story = {
  render: () => (
    <div className="flex flex-col gap-4">
      <SelectDemo size="default" />
      <SelectDemo size="sm" />
    </div>
  ),
};

export const ToggleAndSelectInteraction: Story = {
  args: {
    onValueChange: fn(),
  },
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);
    const trigger = canvas.getByRole("combobox", { name: "Framework" });

    await userEvent.click(trigger);

    const page = within(canvasElement.ownerDocument.body);
    const option = await page.findByRole("option", { name: "Next.js" });
    await userEvent.click(option);

    await expect(trigger).toHaveTextContent("Next.js");
    await expect(args.onValueChange).toHaveBeenCalledWith("nextjs");
  },
};
