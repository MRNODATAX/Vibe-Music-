import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, fireEvent, render, screen } from "@testing-library/react";
import BootSplash from "@/components/BootSplash";

describe("BootSplash", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("shows the brand, the nodata.dev credit and a progress bar", () => {
    render(<BootSplash onDone={() => undefined} quick />);

    // one under the wordmark, one in the footer
    const credits = screen.getAllByRole("link", { name: /nodata\.dev/i });
    expect(credits.length).toBeGreaterThanOrEqual(2);
    credits.forEach((credit) => {
      expect(credit.getAttribute("href")).toBe("https://nodata.dev");
      expect(credit.getAttribute("rel")).toContain("noopener");
    });

    const bar = screen.getByRole("progressbar");
    expect(bar.getAttribute("aria-valuemin")).toBe("0");
    expect(bar.getAttribute("aria-valuemax")).toBe("100");
    expect(screen.getByRole("button", { name: /Lewati/i })).toBeTruthy();
  });

  it("keeps the progress value bounded and monotonic while loading", () => {
    render(<BootSplash onDone={() => undefined} quick />);

    const readings: number[] = [];
    for (let i = 0; i < 5; i += 1) {
      act(() => {
        vi.advanceTimersByTime(200);
      });
      readings.push(Number(screen.getByRole("progressbar").getAttribute("aria-valuenow")));
    }

    readings.forEach((value) => {
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThanOrEqual(100);
    });
    readings.slice(1).forEach((value, index) => {
      expect(value).toBeGreaterThanOrEqual(readings[index]);
    });
  });

  it("skips straight to the end when the skip button is pressed", () => {
    const onDone = vi.fn();
    render(<BootSplash onDone={onDone} />);

    fireEvent.click(screen.getByRole("button", { name: /Lewati/i }));

    act(() => {
      vi.advanceTimersByTime(1200);
    });

    expect(onDone).toHaveBeenCalledTimes(1);
  });

  it("also skips on a keyboard press", () => {
    const onDone = vi.fn();
    render(<BootSplash onDone={onDone} quick />);

    act(() => {
      fireEvent.keyDown(window, { key: "x" });
    });
    act(() => {
      vi.advanceTimersByTime(1200);
    });

    expect(onDone).toHaveBeenCalledTimes(1);
  });
});
