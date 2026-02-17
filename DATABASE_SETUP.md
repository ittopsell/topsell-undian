# Multiple SQL Server Connection Setup

Dokumentasi setup koneksi ke multiple SQL Server untuk berbagai cabang/outlet.

## 📋 Struktur File

```
app/
├── config/
│   └── server-config.json          # Konfigurasi semua SQL Server
├── lib/database/
│   ├── SqlServer.ts                # Main database connection logic
│   └── test-connections.ts         # Utility untuk test semua koneksi
└── api/
    ├── users/
    │   └── route.ts                # Contoh API endpoint
    └── health/connections/
        └── route.ts                # Endpoint untuk test koneksi
```

## ⚙️ Konfigurasi (server-config.json)

```json
{
    "servers": [
        {
            "outlet_code": "MK01",
            "db_host": "localhost",
            "db_port": 1433,
            "db_name": "MK01",
            "db_user": "sa",
            "db_password": "your_password_here",
            "db_encrypt": true,
            "db_trustServerCertificate": false
        },
        {
            "outlet_code": "MK02",
            "db_host": "192.168.1.10",
            "db_port": 1433,
            "db_name": "MK02",
            "db_user": "sa",
            "db_password": "your_password_here",
            "db_encrypt": true,
            "db_trustServerCertificate": false
        }
    ]
}
```

### Parameter Penjelasan:
- `outlet_code`: Kode unik untuk identifikasi cabang (MK01, MK02, dst)
- `db_host`: IP address atau hostname SQL Server
- `db_port`: Port SQL Server (default: 1433)
- `db_name`: Nama database
- `db_user`: Username untuk login
- `db_password`: Password untuk login
- `db_encrypt`: Enkripsi koneksi (true/false)
- `db_trustServerCertificate`: Trust self-signed certificate (untuk development)

## 🔌 Menggunakan Database Functions

### 1. Ambil User dari Outlet Tertentu

```typescript
import { executeQuery } from '@/app/lib/database/SqlServer';

// Di API route atau Server Component
const users = await executeQuery('MK01', 'SELECT * FROM users');
```

### 2. Dengan Parameter

```typescript
const query = `
    SELECT * FROM users 
    WHERE id = @param0
`;
const users = await executeQuery('MK01', query, [5]);
```

### 3. Execute Stored Procedure

```typescript
import { executeStoredProcedure } from '@/app/lib/database/SqlServer';

const result = await executeStoredProcedure('MK01', 'spGetUserReport', {
    startDate: '2024-01-01',
    endDate: '2024-12-31'
});
```

### 4. Get Available Outlets

```typescript
import { getAvailableOutlets } from '@/app/lib/database/SqlServer';

const outlets = getAvailableOutlets();
// Returns: ServerConfig[]
```

### 5. Test Koneksi

```typescript
import { testConnection } from '@/app/lib/database/SqlServer';

const isConnected = await testConnection('MK01');
if (isConnected) {
    console.log('Connected!');
}
```

## 📡 API Endpoints

### Test Semua Koneksi
```bash
GET /api/health/connections
```

Response (200):
```json
{
    "status": "healthy",
    "timestamp": "2024-02-17T10:30:45.123Z",
    "results": [
        {
            "outlet": "MK01",
            "host": "localhost",
            "status": "SUCCESS",
            "message": "Connected"
        }
    ]
}
```

### Get Users dari Outlet
```bash
GET /api/users?outlet=MK01
```

Response (200):
```json
{
    "outlet": "MK01",
    "count": 5,
    "data": [
        { "id": 1, "name": "John Doe", "email": "john@example.com" },
        ...
    ]
}
```

### Create User di Outlet
```bash
POST /api/users

{
    "outlet": "MK01",
    "name": "Jane Doe",
    "email": "jane@example.com"
}
```

## 🚀 Contoh Penggunaan di Server Component

```typescript
// app/dashboard/page.tsx
import { executeQuery, getAvailableOutlets } from '@/app/lib/database/SqlServer';

export default async function DashboardPage() {
    const outlets = getAvailableOutlets();
    
    // Fetch data dari semua outlet
    const allData = await Promise.all(
        outlets.map(async (outlet) => {
            const users = await executeQuery(
                outlet.outlet_code,
                'SELECT COUNT(*) as total FROM users'
            );
            return {
                outlet: outlet.outlet_code,
                totalUsers: users[0].total
            };
        })
    );

    return (
        <div>
            <h1>Dashboard Summary</h1>
            {allData.map((data) => (
                <div key={data.outlet}>
                    <p>{data.outlet}: {data.totalUsers} users</p>
                </div>
            ))}
        </div>
    );
}
```

## 🔐 Security Best Practices

1. **Environment Variables**: Simpan password di `.env.local`
   ```bash
   # .env.local
   DB_PASSWORD_MK01=your_secure_password
   DB_PASSWORD_MK02=your_secure_password
   ```

   Update `server-config.json`:
   ```json
   {
       "db_password": "${process.env.DB_PASSWORD_MK01}"
   }
   ```

2. **Connection Pooling**: Sistem ini menggunakan connection pooling untuk efisiensi
   - Min connections: 1
   - Max connections: 10
   - Idle timeout: 30 detik

3. **Error Handling**: Semua error di-log dan di-return dengan aman

## 🧪 Testing Connection

Jalankan test untuk verifikasi semua koneksi:

```bash
curl http://localhost:3000/api/health/connections
```

## 💡 Tips

- Gunakan `outlet_code` sebagai identifier unik untuk setiap cabang
- Connection pools di-cache secara otomatis, tidak perlu reconnect setiap kali
- Gunakan `testConnection()` untuk health check
- Tutup semua koneksi dengan `closeAllConnections()` sebelum shutdown aplikasi

## ⚠️ Troubleshooting

### Koneksi Tertolak
- Cek IP address dan port SQL Server
- Verifikasi username/password
- Cek firewall settings

### Database Not Found
- Pastikan database name benar
- Verifikasi user memiliki akses ke database

### Query Timeout
- Increase timeout di options
- Optimize SQL query
- Cek network connection

## 📝 Notes

- Konfigurasi di-load dari `server-config.json` dengan absolute path
- Mendukung multiple connections dengan connection pooling
- Error handling komprehensif dengan logging

