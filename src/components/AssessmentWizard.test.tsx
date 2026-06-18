import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { AssessmentWizard } from "./AssessmentWizard";

describe("AssessmentWizard", () => {
  it("requires a choice before moving forward", async () => {
    const user = userEvent.setup();
    render(<AssessmentWizard userName="Tester" onComplete={vi.fn()} onAbort={vi.fn()} />);
    await user.click(screen.getByRole("button", { name: /continue/i }));
    expect(screen.getByRole("alert")).toHaveTextContent(/choose the response/i);
  });
});
