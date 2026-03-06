import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ResourcesWorkspace } from "@/app/(protected)/(dashboard)/resources/_components/resources-workspace";
import { Role, type TResourceCourse } from "@/lib/definitions";

const {
  routerMock,
  createResourceCourseMock,
  updateResourceCourseMock,
  deleteResourceCourseMock,
  toastMock,
} = vi.hoisted(() => ({
  routerMock: {
    push: vi.fn(),
    replace: vi.fn(),
    refresh: vi.fn(),
    back: vi.fn(),
  },
  createResourceCourseMock: vi.fn(),
  updateResourceCourseMock: vi.fn(),
  deleteResourceCourseMock: vi.fn(),
  toastMock: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock("next/navigation", () => ({
  useRouter: () => routerMock,
}));

vi.mock("next/link", () => ({
  default: ({
    href,
    children,
    ...props
  }: {
    href: string;
    children: React.ReactNode;
  }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

vi.mock("sonner", () => ({
  toast: toastMock,
}));

vi.mock("@/lib/actions/resource-actions", () => ({
  createResourceCourse: createResourceCourseMock,
  updateResourceCourse: updateResourceCourseMock,
  deleteResourceCourse: deleteResourceCourseMock,
}));

const buildCourse = (overrides?: Partial<TResourceCourse>): TResourceCourse =>
  ({
    id: "course-1",
    title: "Backend Mastery",
    description: "Master backend architecture.",
    category: "Learn",
    generationMode: "learn",
    difficulty: "intermediate",
    targetRoles: ["Backend Engineer"],
    visibility: "private",
    source: "candidate",
    learningOutcomes: [],
    chapters: [
      {
        title: "Chapter 1",
        overview: null,
        estimatedMinutes: 30,
        material: [],
        sections: [],
        learningObjectives: [],
        coreConcepts: [],
        interviewQuestions: [],
        practicePrompts: [],
        youtubeVideos: [],
      },
      {
        title: "Chapter 2",
        overview: null,
        estimatedMinutes: 30,
        material: [],
        sections: [],
        learningObjectives: [],
        coreConcepts: [],
        interviewQuestions: [],
        practicePrompts: [],
        youtubeVideos: [],
      },
    ],
    customVideoUrls: [],
    includeVideoRecommendations: true,
    aiGenerated: true,
    createdBy: "user-1",
    createdAt: "2026-02-01T00:00:00.000Z",
    updatedAt: "2026-02-01T00:00:00.000Z",
    isOwner: true,
    ...overrides,
  }) as TResourceCourse;

describe("ResourcesWorkspace integration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    const storage = new Map<string, string>();
    vi.stubGlobal("localStorage", {
      getItem: (key: string) => storage.get(key) ?? null,
      setItem: (key: string, value: string) => {
        storage.set(key, value);
      },
      removeItem: (key: string) => {
        storage.delete(key);
      },
      clear: () => {
        storage.clear();
      },
    });
    createResourceCourseMock.mockResolvedValue({
      success: true,
      data: {
        id: "course-new",
      },
    });
    updateResourceCourseMock.mockResolvedValue({
      success: true,
    });
    deleteResourceCourseMock.mockResolvedValue({
      success: true,
    });
    vi.spyOn(window, "confirm").mockReturnValue(true);
  });

  it(
    "generates a new resource course and routes to detail page",
    async () => {
      const user = userEvent.setup();
      render(
        <ResourcesWorkspace
          role={Role.USER}
          myCourses={[]}
          publicCourses={[]}
          recruiterWorkspaces={[]}
          collegeWorkspaces={[]}
        />,
      );

      await user.click(screen.getByRole("button", { name: /generate new resource/i }));

      await user.type(screen.getByLabelText("Course Name"), "System Design Bootcamp");
      await user.type(
        screen.getByLabelText("Target Roles (comma separated)"),
        "Backend Engineer, Platform Engineer",
      );

      await user.click(screen.getByRole("button", { name: "Generate Course" }));

      await waitFor(() => {
        expect(createResourceCourseMock).toHaveBeenCalledWith(
          expect.objectContaining({
            title: "System Design Bootcamp",
            targetRoles: ["Backend Engineer", "Platform Engineer"],
            generationMode: "learn",
            visibility: "private",
          }),
        );
        expect(toastMock.success).toHaveBeenCalledWith("Course generated successfully.");
        expect(routerMock.push).toHaveBeenCalledWith("/resources/course-new");
      });
    },
    15000,
  );

  it("runs visibility toggle, regenerate, and delete actions for owned course", async () => {
    window.localStorage.setItem("kaarya_resource_completion_course-1", JSON.stringify([0, 1]));

    const user = userEvent.setup();
    render(
      <ResourcesWorkspace
        role={Role.USER}
        myCourses={[buildCourse()]}
        publicCourses={[]}
        recruiterWorkspaces={[]}
        collegeWorkspaces={[]}
      />,
    );

    expect(screen.getByText("100%")).toBeInTheDocument();

    await user.click(screen.getByTitle("Share publicly"));
    await waitFor(() => {
      expect(updateResourceCourseMock).toHaveBeenCalledWith("course-1", {
        visibility: "public",
      });
    });

    await user.click(screen.getByTitle("Regenerate course"));
    await waitFor(() => {
      expect(updateResourceCourseMock).toHaveBeenCalledWith("course-1", {
        regenerateContent: true,
      });
    });

    await user.click(screen.getByTitle("Delete course"));
    await waitFor(() => {
      expect(deleteResourceCourseMock).toHaveBeenCalledWith("course-1");
      expect(routerMock.refresh).toHaveBeenCalled();
    });
  });
});
