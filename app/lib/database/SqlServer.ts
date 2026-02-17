import sql from 'mssql';
import serverConfig from '@/app/config/server-config.json';

// Type definitions
export interface ServerConfig {
    outlet_code: string;
    db_host: string;
    db_port: number;
    db_name: string;
    db_user: string;
    db_password: string;
    db_encrypt: boolean;
    db_trustServerCertificate: boolean;
}

// Store connections
const connectionPools: { [key: string]: sql.ConnectionPool } = {};

/**
 * Get or create a connection pool for a specific outlet/branch
 * @param outletCode - Outlet code (e.g., 'MK01', 'MK02')
 */
export async function getConnection(outletCode: string): Promise<sql.ConnectionPool> {
    // Check if connection already exists and is connected
    if (connectionPools[outletCode]) {
        return connectionPools[outletCode];
    }

    // Find server config for this outlet
    const serverConfigData = serverConfig as { servers: ServerConfig[] };
    const config = serverConfigData.servers.find(
        (server) => server.outlet_code === outletCode
    );

    if (!config) {
        throw new Error(`Server configuration not found for outlet: ${outletCode}`);
    }

    // Create connection pool
    const pool = new sql.ConnectionPool({
        server: config.db_host,
        port: config.db_port,
        database: config.db_name,
        user: process.env.AGENT_DB_USER || config.db_user,
        password: process.env.AGENT_DB_PASSWORD || config.db_password,
        options: {
            encrypt: config.db_encrypt,
            trustServerCertificate: config.db_trustServerCertificate,
            tdsVersion: '7_1'
        },
        pool: {
            min: 1,
            max: 5,
            idleTimeoutMillis: 30000
        }
    });

    // Handle connection errors
    pool.on('error', (err) => {
        console.error(`Connection pool error for ${outletCode}:`, err);
    });

    // Connect to database
    await pool.connect();
    connectionPools[outletCode] = pool;
    console.log(`✓ Connected to database: ${outletCode} (${config.db_host})`);

    return pool;
}

/**
 * Execute query on a specific outlet database
 */
export async function executeQuery<T = any>(
    outletCode: string,
    query: string,
    params?: any[]
): Promise<T[]> {
    try {
        const pool = await getConnection(outletCode);
        const request = pool.request();

        // Add parameters if provided
        if (params && params.length > 0) {
            params.forEach((param, index) => {
                request.input(`param${index}`, param);
            });
        }

        const result = await request.query(query);
        return result.recordset as T[];
    } catch (error) {
        console.error(`Query execution error for ${outletCode}:`, error);
        throw error;
    }
}

/**
 * Execute query with stored procedure on a specific outlet database
 */
export async function executeStoredProcedure<T = any>(
    outletCode: string,
    procedureName: string,
    inputs?: any
): Promise<T[]> {
    try {
        const pool = await getConnection(outletCode);
        const request = pool.request();

        // Add input parameters if provided
        if (inputs) {
            Object.entries(inputs).forEach(([key, value]) => {
                request.input(key, value);
            });
        }

        const result = await request.execute(procedureName);
        return result.recordset as T[];
    } catch (error) {
        console.error(`Stored procedure execution error for ${outletCode}:`, error);
        throw error;
    }
}

/**
 * Get all available outlets from config
 */
export function getAvailableOutlets(): ServerConfig[] {
    const serverConfigData = serverConfig as { servers: ServerConfig[] };
    return serverConfigData.servers;
}

/**
 * Close all connections
 */
export async function closeAllConnections(): Promise<void> {
    for (const [outletCode, pool] of Object.entries(connectionPools)) {
        try {
            await pool.close();
            console.log(`✓ Closed connection: ${outletCode}`);
        } catch (error) {
            console.error(`Error closing connection ${outletCode}:`, error);
        }
    }
    Object.keys(connectionPools).forEach((key) => delete connectionPools[key]);
}

/**
 * Test connection to a specific outlet
 */
export async function testConnection(outletCode: string): Promise<boolean> {
    try {
        const pool = await getConnection(outletCode);
        const result = await pool.request().query('SELECT 1 as test');
        return result.recordset.length > 0;
    } catch (error) {
        console.error(`Connection test failed for ${outletCode}:`, error);
        return false;
    }
}

// eslint-disable-next-line import/no-anonymous-default-export
export default {
    getConnection,
    executeQuery,
    executeStoredProcedure,
    getAvailableOutlets,
    closeAllConnections,
    testConnection
};
