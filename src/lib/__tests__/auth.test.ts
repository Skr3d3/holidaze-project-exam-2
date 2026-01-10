describe("auth", () => {
  const originalEnv = process.env;
  let auth: {
    saveAuth: (token: string, user: any) => void;
    getToken: () => string | null;
    getUser: <T = any>() => T | null;
    clearAuth: () => void;
    authHeaders: () => { [key: string]: string };
  };

  beforeEach(() => {
    localStorage.clear();
    jest.resetModules();
    process.env = {
      ...originalEnv,
      REACT_APP_API_KEY: "test_key",
    };
    auth = require("../auth");
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it("should save authentication data to localStorage", () => {
    const token = "test_token";
    const user = { name: "Test User" };

    auth.saveAuth(token, user);

    expect(localStorage.getItem("holidaze_token")).toBe(token);
    expect(localStorage.getItem("holidaze_user")).toBe(JSON.stringify(user));
  });

  it("should retrieve the token from localStorage", () => {
    const token = "test_token";
    localStorage.setItem("holidaze_token", token);

    expect(auth.getToken()).toBe(token);
  });

  it("should retrieve user data from localStorage", () => {
    const user = { name: "Test User" };
    localStorage.setItem("holidaze_user", JSON.stringify(user));

    expect(auth.getUser()).toEqual(user);
  });

  it("should return null if no user data is in localStorage", () => {
    expect(auth.getUser()).toBeNull();
  });

  it("should clear authentication data from localStorage", () => {
    localStorage.setItem("holidaze_token", "test_token");
    localStorage.setItem("holidaze_user", JSON.stringify({ name: "Test User" }));

    auth.clearAuth();

    expect(localStorage.getItem("holidaze_token")).toBeNull();
    expect(localStorage.getItem("holidaze_user")).toBeNull();
  });

  it("should return the correct authorization headers", () => {
    const token = "test_token";
    localStorage.setItem("holidaze_token", token);

    const headers = auth.authHeaders();

    expect(headers).toEqual({
      Authorization: `Bearer ${token}`,
      "X-Noroff-API-Key": "test_key",
    });
  });

  it("should return the correct headers when no token is present", () => {
    const headers = auth.authHeaders();
    expect(headers).toEqual({
      "X-Noroff-API-Key": "test_key",
    });
  });
});
