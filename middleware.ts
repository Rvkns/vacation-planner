import { auth } from './auth';
import { NextResponse } from 'next/server';

export default auth((req) => {
    const { nextUrl } = req;
    const isLoggedIn = !!req.auth;

    const isAuthPage = nextUrl.pathname.startsWith('/login') ||
        nextUrl.pathname.startsWith('/register');
    const isProtectedRoute = !isAuthPage &&
        !nextUrl.pathname.startsWith('/api/register') &&
        !nextUrl.pathname.startsWith('/api/auth');

    // Redirect to login if accessing protected route while not logged in
    if (isProtectedRoute && !isLoggedIn) {
        return NextResponse.redirect(new URL('/login', nextUrl));
    }

    // Redirect to dashboard if accessing auth pages while logged in
    if (isAuthPage && isLoggedIn) {
        return NextResponse.redirect(new URL('/', nextUrl));
    }

    return NextResponse.next();
});

export const config = {
    matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
