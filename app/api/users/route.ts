import { NextRequest, NextResponse } from 'next/server';
import { executeQuery, testConnection } from '@/app/lib/database/SqlServer';

/**
 * GET /api/users?outlet=MK01
 * Get users from specific outlet database
 */
export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams;
        const outlet = searchParams.get('outlet') || 'MK01';

        // Test connection first
        const isConnected = await testConnection(outlet);
        if (!isConnected) {
            return NextResponse.json(
                { error: `Failed to connect to database: ${outlet}` },
                { status: 503 }
            );
        }

        // Execute query
        const users = await executeQuery(
            outlet,
            'SELECT * FROM [users] ORDER BY id DESC'
        );

        return NextResponse.json({
            outlet,
            count: users.length,
            data: users
        });
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        return NextResponse.json(
            { error: message },
            { status: 500 }
        );
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { passkey } = body;
        if (!passkey) {
            return NextResponse.json(
                { error: 'Passkey is required' },
                { status: 400 }
            );
        }

        // Test connection first
        const isConnected = await testConnection("TKK");
        if (!isConnected) {
            return NextResponse.json(
                { error: `Failed to connect to database: TKK` },
                { status: 503 }
            );
        }

        // Execute query        const result = await executeQuery(
        const result = await executeQuery("TKK",
    "SELECT kode, nama, outlet, isAktif FROM [kasir] WHERE PassKey = @param0",
    [passkey]);

        if (result.length === 0) {
            return NextResponse.json(
                { error: 'Kasir not found' },
                { status: 404 }
            );
        }

        if (result[0].isAktif === false) {
            return NextResponse.json(
                { error: 'kasir is not active' },
                { status: 401 }
            );
        }

        return NextResponse.json({
            message: 'Successfully retrieved kasir',
            kode : result[0]?.kode || null,
            nama : result[0]?.nama || null,
            outlet : result[0]?.outlet || null
        });
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        return NextResponse.json(
            { error: message },
            { status: 500 }
        );
    }
}
