import { afterEach, describe, expect, it, vi } from "vitest";
import { downloadTextFile, safeFilenamePart } from "./download";

afterEach(() => {
  vi.restoreAllMocks();
  document.body.replaceChildren();
});

describe("download helpers", () => {
  it("sanitizes unsafe filename segments and provides a fallback", () => {
    expect(safeFilenamePart("  Résumé / Profile #1  ")).toBe("Resume-Profile-1");
    expect(safeFilenamePart("---safe_name---")).toBe("safe_name");
    expect(safeFilenamePart("<>:\\|?*")).toBe("profile");
    expect(safeFilenamePart("a".repeat(100))).toHaveLength(60);
  });

  it("creates, clicks, and revokes a temporary download URL", () => {
    const createObjectURL = vi.fn<(blob: Blob | MediaSource) => string>(() => "blob:triad-test");
    const revokeObjectURL = vi.fn();
    Object.defineProperty(URL, "createObjectURL", {
      configurable: true,
      value: createObjectURL,
    });
    Object.defineProperty(URL, "revokeObjectURL", {
      configurable: true,
      value: revokeObjectURL,
    });

    const click = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});
    const append = vi.spyOn(document.body, "append");

    downloadTextFile("profile.json", '{"ok":true}', "application/json");

    expect(createObjectURL).toHaveBeenCalledOnce();
    const blob = createObjectURL.mock.calls[0]?.[0];
    expect(blob).toBeInstanceOf(Blob);
    expect((blob as Blob).type).toBe("application/json");
    expect(append).toHaveBeenCalledOnce();
    const anchor = append.mock.calls[0]?.[0];
    expect(anchor).toBeInstanceOf(HTMLAnchorElement);
    expect((anchor as HTMLAnchorElement).download).toBe("profile.json");
    expect((anchor as HTMLAnchorElement).rel).toBe("noopener");
    expect(click).toHaveBeenCalledOnce();
    expect(document.querySelector("a")).toBeNull();
    expect(revokeObjectURL).toHaveBeenCalledWith("blob:triad-test");
  });
});
