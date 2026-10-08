import { describe, it, expect } from "vitest";
import routerOptions from "./router.options";
import { routes } from "./routes";

describe("router.options", () => {
  it("should supply the declared routes", () => {
    const supplied = (routerOptions as any).routes([]);
    expect(supplied).toBe(routes);
  });

  it("should declare auth, dashboard and wildcard routes", () => {
    const paths = routes.map((r) => r.path);
    expect(paths).toEqual(["/auth", "/", "/:pathMatch(.*)*"]);

    const dashboard = routes.find((r) => r.path === "/");
    expect(dashboard?.children?.map((r) => r.path)).toEqual([
      "",
      "cash-flows/:cashFlowId",
      "users",
      "profile",
    ]);

    const auth = routes.find((r) => r.path === "/auth");
    expect(auth?.children?.map((r) => r.path)).toEqual(["login", "register"]);
  });
});
