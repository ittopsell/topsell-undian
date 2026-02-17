import { NextResponse } from 'next/server';
import testAllConnections from '@/app/lib/database/test-connections';

/**
 * GET /api/health/connections
 * Test all database connections
 */
export async function GET() {
    try {
        const results = await testAllConnections();
        const allSuccess = results.every((r) => r.status === 'SUCCESS');

        return NextResponse.json(
            {
                status: allSuccess ? 'healthy' : 'degraded',
                timestamp: new Date().toISOString(),
                results
            },
            { status: allSuccess ? 200 : 503 }
        );
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        return NextResponse.json(
            {
                status: 'unhealthy',
                error: message,
                timestamp: new Date().toISOString()
            },
            { status: 500 }
        );
    }
}
