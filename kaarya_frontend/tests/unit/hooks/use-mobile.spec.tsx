import { act, renderHook } from "@testing-library/react";
import { useIsMobile } from "@/hooks/use-mobile";

describe("hooks/use-mobile", () => {
  it("reflects current matchMedia state and reacts to changes", () => {
    let listener: (() => void) | undefined;
    const mediaQuery = {
      matches: true,
      media: "(max-width: 1023px)",
      onchange: null as MediaQueryListEventMap["change"] | null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn((_event: string, cb: () => void) => {
        listener = cb;
      }),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    };

    vi.spyOn(window, "matchMedia").mockImplementation(() => {
      return mediaQuery as unknown as MediaQueryList;
    });

    const { result, unmount } = renderHook(() => useIsMobile());
    expect(result.current).toBe(true);

    mediaQuery.matches = false;
    act(() => {
      listener?.();
    });
    expect(result.current).toBe(false);

    unmount();
    expect(mediaQuery.removeEventListener).toHaveBeenCalledWith(
      "change",
      expect.any(Function),
    );
  });
});
