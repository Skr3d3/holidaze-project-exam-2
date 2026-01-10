import { api, apiAuth, apiPostJson } from "../api";

global.fetch = jest.fn();

describe("api", () => {
  beforeEach(() => {
    (fetch as jest.Mock).mockClear();
    localStorage.clear();
  });

  it("should call fetch with the correct parameters for apiAuth", async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ data: "success" }),
    });

    await apiAuth("/test");

    expect(fetch).toHaveBeenCalledWith(
      "https://v2.api.noroff.dev/test",
      expect.any(Object)
    );
  });

  it("should call fetch with the correct parameters for api", async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ data: "success" }),
    });

    await api("/test");

    expect(fetch).toHaveBeenCalledWith(
      "https://v2.api.noroff.dev/holidaze/test",
      expect.any(Object)
    );
  });

  it("should call fetch with the correct parameters for apiPostJson", async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ data: "success" }),
    });

    await apiPostJson("/test", { test: "data" });

    expect(fetch).toHaveBeenCalledWith(
      "https://v2.api.noroff.dev/holidaze/test",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ test: "data" }),
      })
    );
  });

  it("should throw an error when the fetch request is not ok", async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 404,
      statusText: "Not Found",
      json: () => Promise.resolve({ message: "Error" }),
    });

    await expect(api("/test")).rejects.toThrow("Error");
  });
});
