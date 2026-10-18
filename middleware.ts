import { NextResponse, type NextRequest } from "next/server";

// Demo mode: tạm thời không yêu cầu Supabase session để mở khu vực học tập.
// Khi tích hợp xác thực thật, thay middleware này bằng kiểm tra session.
export function middleware(_request: NextRequest) {
  return NextResponse.next();
}

export const config = { matcher: ["/learn/:path*", "/login", "/register"] };
