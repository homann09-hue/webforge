import { NextRequest, NextResponse } from "next/server";

export function middleware(request: NextRequest) {
  const expectedUser = process.env.ADMIN_USER;
  const expectedPassword = process.env.ADMIN_PASSWORD;

  if (!expectedUser || !expectedPassword) {
    return new NextResponse("Admin access is not configured.", { status: 503 });
  }

  const authorization = request.headers.get("authorization");
  if (authorization?.startsWith("Basic ")) {
    try {
      const credentials = atob(authorization.slice(6));
      const separator = credentials.indexOf(":");
      const user = separator >= 0 ? credentials.slice(0, separator) : "";
      const password = separator >= 0 ? credentials.slice(separator + 1) : "";

      if (user === expectedUser && password === expectedPassword) {
        return NextResponse.next();
      }
    } catch {
      // Invalid Basic Auth payload falls through to 401.
    }
  }

  return new NextResponse("Authentication required.", {
    status: 401,
    headers: { "WWW-Authenticate": 'Basic realm="WebForge Admin"' },
  });
}

export const config = {
  matcher: ["/admin/:path*"],
};
