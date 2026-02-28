import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { BookmarkToggleButton } from "@/components/bookmark/bookmark-toggle-button";

const {
  saveJobBookmarkMock,
  unsaveJobBookmarkMock,
  saveInterviewBookmarkMock,
  unsaveInterviewBookmarkMock,
  toastSuccessMock,
  toastErrorMock,
} = vi.hoisted(() => ({
  saveJobBookmarkMock: vi.fn(),
  unsaveJobBookmarkMock: vi.fn(),
  saveInterviewBookmarkMock: vi.fn(),
  unsaveInterviewBookmarkMock: vi.fn(),
  toastSuccessMock: vi.fn(),
  toastErrorMock: vi.fn(),
}));

vi.mock("@/lib/actions/bookmark-actions", () => ({
  saveJobBookmark: saveJobBookmarkMock,
  unsaveJobBookmark: unsaveJobBookmarkMock,
  saveInterviewBookmark: saveInterviewBookmarkMock,
  unsaveInterviewBookmark: unsaveInterviewBookmarkMock,
}));

vi.mock("sonner", () => ({
  toast: {
    success: toastSuccessMock,
    error: toastErrorMock,
  },
}));

describe("BookmarkToggleButton", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("saves a job bookmark and emits success callback/toast", async () => {
    saveJobBookmarkMock.mockResolvedValue({ success: true });
    const onSavedChange = vi.fn();

    render(
      <BookmarkToggleButton
        entityType="job"
        entityId="job-1"
        onSavedChange={onSavedChange}
      />,
    );

    const button = screen.getByRole("button");
    expect(button).toHaveAttribute("aria-pressed", "false");

    await userEvent.click(button);

    await waitFor(() => {
      expect(saveJobBookmarkMock).toHaveBeenCalledWith("job-1");
      expect(onSavedChange).toHaveBeenCalledWith(true);
      expect(toastSuccessMock).toHaveBeenCalledWith("Job saved successfully");
    });
  });

  it("reverts state and shows error toast on failure", async () => {
    saveJobBookmarkMock.mockResolvedValue({
      success: false,
      message: "Failed to save bookmark",
    });

    render(<BookmarkToggleButton entityType="job" entityId="job-2" />);
    const button = screen.getByRole("button");

    await userEvent.click(button);

    await waitFor(() => {
      expect(toastErrorMock).toHaveBeenCalledWith("Failed to save bookmark");
      expect(button).toHaveAttribute("aria-pressed", "false");
    });
  });

  it("unsaves interview bookmark when initially saved", async () => {
    unsaveInterviewBookmarkMock.mockResolvedValue({ success: true });

    render(
      <BookmarkToggleButton
        entityType="interview"
        entityId="int-1"
        initialSaved
        showSuccessToast={false}
      />,
    );

    const button = screen.getByRole("button");
    expect(button).toHaveAttribute("aria-pressed", "true");
    await userEvent.click(button);

    await waitFor(() => {
      expect(unsaveInterviewBookmarkMock).toHaveBeenCalledWith("int-1");
      expect(toastSuccessMock).not.toHaveBeenCalled();
      expect(button).toHaveAttribute("aria-pressed", "false");
    });
  });

  it("supports interview save and job unsave success toasts", async () => {
    saveInterviewBookmarkMock.mockResolvedValue({ success: true });
    unsaveJobBookmarkMock.mockResolvedValue({ success: true });

    const { rerender } = render(
      <BookmarkToggleButton entityType="interview" entityId="int-2" />,
    );

    await userEvent.click(screen.getByRole("button"));
    await waitFor(() => {
      expect(saveInterviewBookmarkMock).toHaveBeenCalledWith("int-2");
      expect(toastSuccessMock).toHaveBeenCalledWith("Interview saved successfully");
    });

    rerender(
      <BookmarkToggleButton entityType="job" entityId="job-4" initialSaved />,
    );
    await userEvent.click(screen.getByRole("button"));
    await waitFor(() => {
      expect(unsaveJobBookmarkMock).toHaveBeenCalledWith("job-4");
      expect(toastSuccessMock).toHaveBeenCalledWith("Job removed from saved");
    });
  });

  it("shows default error message when response has no message", async () => {
    saveInterviewBookmarkMock.mockResolvedValue({ success: false });

    render(<BookmarkToggleButton entityType="interview" entityId="int-3" />);
    await userEvent.click(screen.getByRole("button"));

    await waitFor(() => {
      expect(toastErrorMock).toHaveBeenCalledWith("Unable to update bookmark");
    });
  });

  it("does not trigger calls when disabled", async () => {
    render(
      <BookmarkToggleButton entityType="job" entityId="job-3" disabled />,
    );

    await userEvent.click(screen.getByRole("button"));

    expect(saveJobBookmarkMock).not.toHaveBeenCalled();
    expect(unsaveJobBookmarkMock).not.toHaveBeenCalled();
    expect(saveInterviewBookmarkMock).not.toHaveBeenCalled();
    expect(unsaveInterviewBookmarkMock).not.toHaveBeenCalled();
  });

  it("does not trigger calls when entityId is empty", async () => {
    render(<BookmarkToggleButton entityType="job" entityId="" />);

    await userEvent.click(screen.getByRole("button"));

    expect(saveJobBookmarkMock).not.toHaveBeenCalled();
    expect(toastErrorMock).not.toHaveBeenCalled();
  });
});
