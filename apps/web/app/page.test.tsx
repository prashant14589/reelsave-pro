/**
 * page.test.tsx
 *
 * Tests for features ported from insta-download → reelsave-pro:
 *   1. auto-download (blob fetch + anchor click) — triggerDownload()
 *   2. thumbnailUrl extraction from reel URL
 *   3. Inline video player rendered after success
 *   4. `quality` field on DownloadResult
 *   5. `downloading` state while blob is in flight
 *
 * Run: pnpm vitest (or jest) from apps/web/
 */

import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import { vi, describe, it, expect, beforeEach, afterEach } from "vitest";
import Home from "./page";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function mockFetchSuccess(downloadUrl: string, filename: string, quality = "HD") {
  global.fetch = vi.fn().mockImplementation((url: string) => {
    // /api/download → returns metadata
    if (typeof url === "string" && url.includes("/api/download")) {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ downloadUrl, filename, quality }),
      });
    }
    // blob fetch for auto-download
    return Promise.resolve({
      ok: true,
      blob: () => Promise.resolve(new Blob(["video"], { type: "video/mp4" })),
    });
  });
}

function mockFetchApiError(status = 500, message = "Server error") {
  global.fetch = vi.fn().mockResolvedValue({
    ok: false,
    status,
    json: () => Promise.resolve({ error: message }),
  });
}

// ─── Setup ────────────────────────────────────────────────────────────────────

beforeEach(() => {
  // localStorage stub (jsdom provides it but clear between tests)
  localStorage.clear();

  // URL.createObjectURL / revokeObjectURL are not in jsdom
  global.URL.createObjectURL = vi.fn(() => "blob:mock");
  global.URL.revokeObjectURL = vi.fn();

  // Stub document.body.appendChild / removeChild used by triggerDownload
  vi.spyOn(document.body, "appendChild").mockImplementation((el) => el);
  vi.spyOn(document.body, "removeChild").mockImplementation((el) => el);

  // Stub click on dynamically created anchors
  vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});

  vi.useFakeTimers();
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.useRealTimers();
});

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("triggerDownload — auto-download after success", () => {
  it("fetches the blob and triggers a link click after 500 ms", async () => {
    mockFetchSuccess(
      "https://cdn.example.com/video.mp4",
      "reelsave_abc123.mp4"
    );

    render(<Home />);
    fireEvent.change(screen.getByPlaceholderText(/instagram\.com\/reel/i), {
      target: { value: "https://www.instagram.com/reel/abc123/" },
    });
    fireEvent.click(screen.getByRole("button", { name: /download/i }));

    // wait for API call to resolve and state → "success"
    await waitFor(() => expect(global.fetch).toHaveBeenCalledTimes(1));

    // advance past the 500ms setTimeout
    act(() => {
      vi.advanceTimersByTime(600);
    });

    // blob fetch should have been triggered
    await waitFor(() => expect(global.fetch).toHaveBeenCalledTimes(2));

    const blobFetchCall = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[1];
    expect(blobFetchCall[0]).toBe("https://cdn.example.com/video.mp4");

    // anchor.click() should have been called
    expect(HTMLAnchorElement.prototype.click).toHaveBeenCalled();
  });

  it("shows 'downloading' spinner while blob fetch is in progress", async () => {
    let resolveBlobFetch!: () => void;
    global.fetch = vi.fn().mockImplementation((url: string) => {
      if (url.includes("/api/download")) {
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              downloadUrl: "https://cdn.example.com/video.mp4",
              filename: "video.mp4",
              quality: "HD",
            }),
        });
      }
      // blob fetch hangs until we resolve
      return new Promise((resolve) => {
        resolveBlobFetch = () =>
          resolve({
            ok: true,
            blob: () => Promise.resolve(new Blob(["v"], { type: "video/mp4" })),
          } as unknown as Response);
      });
    });

    render(<Home />);
    fireEvent.change(screen.getByPlaceholderText(/instagram\.com\/reel/i), {
      target: { value: "https://www.instagram.com/reel/abc123/" },
    });
    fireEvent.click(screen.getByRole("button", { name: /download/i }));

    await waitFor(() => expect(global.fetch).toHaveBeenCalledTimes(1));

    act(() => { vi.advanceTimersByTime(600); });

    // While blob is still pending, "downloading" state should show spinner text
    await waitFor(() =>
      expect(screen.getByText(/video started to download/i)).toBeInTheDocument()
    );

    // Resolve blob fetch and confirm state goes back to success
    act(() => { resolveBlobFetch(); });
    await waitFor(() =>
      expect(screen.getByText(/download complete/i)).toBeInTheDocument()
    );
  });

  it("falls back to success state if blob fetch fails", async () => {
    global.fetch = vi.fn().mockImplementation((url: string) => {
      if (url.includes("/api/download")) {
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              downloadUrl: "https://cdn.example.com/video.mp4",
              filename: "video.mp4",
            }),
        });
      }
      return Promise.resolve({ ok: false }); // blob fetch fails
    });

    render(<Home />);
    fireEvent.change(screen.getByPlaceholderText(/instagram\.com\/reel/i), {
      target: { value: "https://www.instagram.com/reel/abc123/" },
    });
    fireEvent.click(screen.getByRole("button", { name: /download/i }));

    await waitFor(() => expect(global.fetch).toHaveBeenCalledTimes(1));
    act(() => { vi.advanceTimersByTime(600); });
    await waitFor(() =>
      expect(screen.getByText(/download complete/i)).toBeInTheDocument()
    );
  });
});

describe("thumbnailUrl — extracted from reel URL", () => {
  it("shows thumbnail image after success when reel ID is present", async () => {
    mockFetchSuccess(
      "https://cdn.example.com/video.mp4",
      "reelsave_Cx1abc.mp4"
    );

    render(<Home />);
    fireEvent.change(screen.getByPlaceholderText(/instagram\.com\/reel/i), {
      target: { value: "https://www.instagram.com/reel/Cx1abc_XY/" },
    });
    fireEvent.click(screen.getByRole("button", { name: /download/i }));

    await waitFor(() => expect(global.fetch).toHaveBeenCalledTimes(1));
    act(() => { vi.advanceTimersByTime(600); });

    await waitFor(() =>
      expect(screen.getByText(/download complete/i)).toBeInTheDocument()
    );

    const thumbnail = screen.getByAltText(/video thumbnail/i) as HTMLImageElement;
    expect(thumbnail.src).toContain("Cx1abc_XY");
  });

  it("does not render thumbnail when URL has no reel ID", async () => {
    mockFetchSuccess("https://cdn.example.com/video.mp4", "video.mp4");

    render(<Home />);
    fireEvent.change(screen.getByPlaceholderText(/instagram\.com\/reel/i), {
      target: { value: "https://www.instagram.com/malformed-url/" },
    });
    fireEvent.click(screen.getByRole("button", { name: /download/i }));

    await waitFor(() => expect(global.fetch).toHaveBeenCalledTimes(1));
    act(() => { vi.advanceTimersByTime(600); });

    await waitFor(() =>
      expect(screen.getByText(/download complete/i)).toBeInTheDocument()
    );

    expect(screen.queryByAltText(/video thumbnail/i)).toBeNull();
  });
});

describe("inline video player", () => {
  it("renders a <video> element with the downloadUrl as src after success", async () => {
    mockFetchSuccess(
      "https://cdn.example.com/video.mp4",
      "reelsave_abc.mp4",
      "HD"
    );

    render(<Home />);
    fireEvent.change(screen.getByPlaceholderText(/instagram\.com\/reel/i), {
      target: { value: "https://www.instagram.com/reel/abc123/" },
    });
    fireEvent.click(screen.getByRole("button", { name: /download/i }));

    await waitFor(() => expect(global.fetch).toHaveBeenCalledTimes(1));
    act(() => { vi.advanceTimersByTime(600); });

    await waitFor(() =>
      expect(screen.getByText(/download complete/i)).toBeInTheDocument()
    );

    const video = screen.getByTestId("result-video") as HTMLVideoElement;
    expect(video.querySelector("source")?.getAttribute("src")).toBe(
      "https://cdn.example.com/video.mp4"
    );
  });
});

describe("handleReset clears all new state", () => {
  it("clears thumbnailUrl and resets to idle", async () => {
    mockFetchSuccess(
      "https://cdn.example.com/video.mp4",
      "video.mp4"
    );

    render(<Home />);
    fireEvent.change(screen.getByPlaceholderText(/instagram\.com\/reel/i), {
      target: { value: "https://www.instagram.com/reel/abc123/" },
    });
    fireEvent.click(screen.getByRole("button", { name: /download/i }));

    await waitFor(() => expect(global.fetch).toHaveBeenCalledTimes(1));
    act(() => { vi.advanceTimersByTime(600); });

    await waitFor(() =>
      expect(screen.getByText(/download complete/i)).toBeInTheDocument()
    );

    fireEvent.click(screen.getByText(/download another/i));

    expect(screen.queryByAltText(/video thumbnail/i)).toBeNull();
    expect(screen.queryByTestId("result-video")).toBeNull();
    expect(screen.getByPlaceholderText(/instagram\.com\/reel/i)).toBeInTheDocument();
  });
});
