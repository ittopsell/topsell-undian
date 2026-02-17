/**
 * Database connection tester utility
 * Run this to verify all outlet connections
 */

import { getAvailableOutlets, testConnection, closeAllConnections } from '@/app/lib/database/SqlServer';

export async function testAllConnections() {
    try {
        const outlets = getAvailableOutlets();
        console.log('\n🔍 Testing all database connections...\n');

        const results: Array<{
            outlet: string;
            host: string;
            status: string;
            message?: string;
        }> = [];

        for (const config of outlets) {
            try {
                console.log(`Testing ${config.outlet_code} (${config.db_host})...`);
                const isConnected = await testConnection(config.outlet_code);

                if (isConnected) {
                    console.log(`✓ ${config.outlet_code}: Connected successfully\n`);
                    results.push({
                        outlet: config.outlet_code,
                        host: config.db_host,
                        status: 'SUCCESS',
                        message: 'Connected'
                    });
                } else {
                    console.log(`✗ ${config.outlet_code}: Connection failed\n`);
                    results.push({
                        outlet: config.outlet_code,
                        host: config.db_host,
                        status: 'FAILED',
                        message: 'Connection test returned false'
                    });
                }
            } catch (error) {
                const message = error instanceof Error ? error.message : 'Unknown error';
                console.log(`✗ ${config.outlet_code}: Error - ${message}\n`);
                results.push({
                    outlet: config.outlet_code,
                    host: config.db_host,
                    status: 'ERROR',
                    message
                });
            }
        }

        // Summary
        console.log('═══════════════════════════════════════════════════════════');
        console.log('CONNECTION TEST SUMMARY');
        console.log('═══════════════════════════════════════════════════════════');
        results.forEach((result) => {
            const icon = result.status === 'SUCCESS' ? '✓' : '✗';
            console.log(`${icon} ${result.outlet} (${result.host}): ${result.status}`);
            if (result.message && result.status !== 'SUCCESS') {
                console.log(`  └─ ${result.message}`);
            }
        });

        const successCount = results.filter((r) => r.status === 'SUCCESS').length;
        console.log(`\nTotal: ${successCount}/${results.length} connections successful`);
        console.log('═══════════════════════════════════════════════════════════\n');

        return results;
    } catch (error) {
        console.error('Error testing connections:', error);
        throw error;
    } finally {
        await closeAllConnections();
    }
}

// Export for use in API routes
export default testAllConnections;
