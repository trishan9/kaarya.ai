import { composeStories } from "@storybook/react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import * as buttonStories from "@/components/ui/Button.stories";
import * as projectAnnotations from "../../.storybook/preview";

const { Default, Disabled, Loading } = composeStories(
  buttonStories,
  projectAnnotations,
);

describe("Button story snapshots", () => {
  it("matches default markup", () => {
    const html = renderToStaticMarkup(<Default />);
    expect(html).toMatchSnapshot();
  });

  it("matches disabled markup", () => {
    const html = renderToStaticMarkup(<Disabled />);
    expect(html).toMatchSnapshot();
  });

  it("matches loading markup", () => {
    const html = renderToStaticMarkup(<Loading />);
    expect(html).toMatchSnapshot();
  });
});
