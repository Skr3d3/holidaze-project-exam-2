import { login, register } from "../authApi";
import { apiAuth } from "../api";

jest.mock("../api", () => ({
  apiAuth: jest.fn(),
}));

describe("authApi", () => {
  beforeEach(() => {
    (apiAuth as jest.Mock).mockClear();
  });

  it("should call apiAuth with the correct parameters for login", async () => {
    (apiAuth as jest.Mock).mockResolvedValueOnce({
      data: {
        accessToken: "test_token",
        name: "Test User",
      },
    });

    await login("test@example.com", "password");

    expect(apiAuth).toHaveBeenCalledWith("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email: "test@example.com", password: "password" }),
    });
  });

  it("should call apiAuth with the correct parameters for register", async () => {
    await register({
      name: "Test User",
      email: "test@example.com",
      password: "password",
    });

    expect(apiAuth).toHaveBeenCalledWith("/auth/register", {
      method: "POST",
      body: JSON.stringify({
        name: "Test User",
        email: "test@example.com",
        password: "password",
      }),
    });
  });

  it("should automatically login after registration if autoLogin is true", async () => {
    (apiAuth as jest.Mock).mockResolvedValueOnce(undefined); // for register
    (apiAuth as jest.Mock).mockResolvedValueOnce({ // for login
      data: {
        accessToken: "test_token",
        name: "Test User",
      },
    });

    await register(
      {
        name: "Test User",
        email: "test@example.com",
        password: "password",
      },
      { autoLogin: true }
    );

    expect(apiAuth).toHaveBeenCalledTimes(2);
    expect(apiAuth).toHaveBeenCalledWith("/auth/login", expect.any(Object));
  });
});
