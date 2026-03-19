import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';

const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_NAME || 'nova_space',
});

async function createAdmin() {
  await AppDataSource.initialize();
  console.log('Database connected');

  const passwordHash = await bcrypt.hash('admin123', 10);

  // Check if admin exists
  const existing = await AppDataSource.query(
    `SELECT id FROM users WHERE username = 'admin'`
  );

  if (existing.length > 0) {
    // Update admin password and role
    await AppDataSource.query(
      `UPDATE users SET password = $1, role = 'admin', "isActive" = true WHERE username = 'admin'`,
      [passwordHash]
    );
    console.log('Admin user updated successfully');
  } else {
    // Create new admin user
    await AppDataSource.query(
      `INSERT INTO users (id, username, password, role, level, "isActive", "isVerified", points, "totalPoints", "createdAt", "updatedAt")
       VALUES (gen_random_uuid(), 'admin', $1, 'admin', 'professional', true, true, 0, 0, NOW(), NOW())`,
      [passwordHash]
    );
    console.log('Admin user created successfully');
  }

  console.log('Username: admin');
  console.log('Password: admin123');

  await AppDataSource.destroy();
}

createAdmin().catch((err) => {
  console.error('Error:', err.message);
  process.exit(1);
});