import { NextResponse } from 'next/server';

// Standardized error response helper
export function apiError(message: string, status: number = 500, details?: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
    return NextResponse.json({ error: message, details }, { status });
}
