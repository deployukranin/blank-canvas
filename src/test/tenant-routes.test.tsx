import { describe, it, expect, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { readFileSync } from "fs";
import { resolve } from "path";

// ---------- Mocks ----------
const maybeSingleMock = vi.fn();
vi.mock("@/integrations/supabase/client", () => {
  const builder: any = {
    select: vi.fn(() => builder),
    eq: vi.fn(() => builder),
    maybeSingle: (...args: any[]) => maybeSingleMock(...args),
  };
  return {
    supabase: {
      from: vi.fn(() => builder),
      auth: {
        onAuthStateChange: vi.fn(() => ({ data: { subscription: { unsubscribe: vi.fn() } } })),
        getSession: vi.fn(() => Promise.resolve({ data: { session: null } })),
        signOut: vi.fn(),
      },
    },
  };
});

vi.mock("@/pages/NotFound", () => ({
  default: () => <div data-testid="not-found">NOT_FOUND</div>,
}));

import { TenantProvider } from "@/contexts/TenantContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { TenantGate } from "@/components/tenant/TenantGate";

const renderAt = (path: string, element: React.ReactNode) =>
  render(
    <AuthProvider>
      <MemoryRouter initialEntries={[path]}>
        <TenantProvider>
          <Routes>
            <Route path="/:slug" element={element} />
            <Route path="/:slug/:sub" element={element} />
          </Routes>
        </TenantProvider>
      </MemoryRouter>
    </AuthProvider>
  );

// ---------- App.tsx static analysis ----------
describe("App.tsx tenant routing config", () => {
  const appSrc = readFileSync(resolve(__dirname, "../App.tsx"), "utf-8");

  const publicSlugRoutes = [
    "/:slug",
    "/:slug/customs",
    "/:slug/community",
    "/:slug/ideas",
    "/:slug/vip",
    "/:slug/gallery",
    "/:slug/login",
  ];

  it.each(publicSlugRoutes)("declares %s route", (path) => {
    expect(appSrc).toContain(`path="${path}"`);
  });

  it.each(publicSlugRoutes)("does NOT wrap %s with ProtectedRoute", (path) => {
    const regex = new RegExp(
      `path="${path.replace(/\//g, "\\/")}"[^\\n]*ProtectedRoute`
    );
    expect(regex.test(appSrc)).toBe(false);
  });

  it("wraps all tenant routes with TenantGate", () => {
    const slugRouteLines = appSrc
      .split("\n")
      .filter((l) => /path="\/:slug/.test(l));
    expect(slugRouteLines.length).toBeGreaterThan(5);
    for (const line of slugRouteLines) {
      expect(line).toContain("TenantGate");
    }
  });
});

// ---------- TenantGate runtime behavior ----------
describe("TenantGate with valid slug", () => {
  it("renders children (no 404) when store exists", async () => {
    maybeSingleMock.mockResolvedValueOnce({
      data: {
        id: "store-1",
        name: "Higor",
        slug: "higorxzz",
        description: null,
        avatar_url: null,
        banner_url: null,
        status: "active",
        created_by: null,
        plan_type: "premium",
        plan_expires_at: null,
      },
      error: null,
    });

    renderAt(
      "/higorxzz",
      <TenantGate>
        <div data-testid="store-home">STORE_HOME</div>
      </TenantGate>
    );

    await waitFor(() => {
      expect(screen.getByTestId("store-home")).toBeInTheDocument();
    });
    expect(screen.queryByTestId("not-found")).not.toBeInTheDocument();
    expect(screen.queryByText(/não foi encontrada/i)).not.toBeInTheDocument();
  });

  it("renders children for /:slug/ideas without auth", async () => {
    maybeSingleMock.mockResolvedValueOnce({
      data: {
        id: "store-1",
        name: "Higor",
        slug: "higorxzz",
        description: null,
        avatar_url: null,
        banner_url: null,
        status: "trial",
        created_by: null,
        plan_type: "trial",
        plan_expires_at: new Date(Date.now() + 86_400_000).toISOString(),
      },
      error: null,
    });

    renderAt(
      "/higorxzz/ideas",
      <TenantGate>
        <div data-testid="ideas-page">IDEAS</div>
      </TenantGate>
    );

    await waitFor(() => {
      expect(screen.getByTestId("ideas-page")).toBeInTheDocument();
    });
    expect(screen.queryByText(/não foi encontrada/i)).not.toBeInTheDocument();
  });

  it("shows 404 only when slug truly does not exist", async () => {
    maybeSingleMock.mockResolvedValueOnce({ data: null, error: null });

    renderAt(
      "/doesnotexist",
      <TenantGate>
        <div data-testid="store-home">STORE_HOME</div>
      </TenantGate>
    );

    await waitFor(() => {
      expect(screen.getByText(/não foi encontrada/i)).toBeInTheDocument();
    });
    expect(screen.queryByTestId("store-home")).not.toBeInTheDocument();
  });
});
