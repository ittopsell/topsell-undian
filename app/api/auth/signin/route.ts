import { NextRequest, NextResponse } from 'next/server';
import { executeQuery, testConnection } from '@/app/lib/database/SqlServer';


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
    "SELECT kode, nama, outlet, isAktif FROM [kasir] WHERE PassKey = @param0 AND outlet !='SEMUA'",
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
