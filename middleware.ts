import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

const protectedPaths = ["/dashboard", "/classroom"];
const authPaths = ["/login", "/register"];

export async function middleware(request: NextRequest) {
    const token = await getToken({ req: request });
    const { pathname } = request.nextUrl;

    // Redirect authenticated users away from auth pages
    if (authPaths.some((path) => pathname.startsWith(path))) {
        if (token) {
            return NextResponse.redirect(new URL("/dashboard", request.url));
        }
        return NextResponse.next();
    }

    // Protect dashboard and classroom routes
    if (protectedPaths.some((path) => pathname.startsWith(path))) {
        if (!token) {
            const loginUrl = new URL("/login", request.url);
            loginUrl.searchParams.set("callbackUrl", pathname);
            return NextResponse.redirect(loginUrl);
        }
    }

    return NextResponse.next();
}

export const config = {
    matcher: ["/dashboard/:path*", "/classroom/:path*", "/login", "/register"],
};
