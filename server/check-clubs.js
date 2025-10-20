import pkg from 'pg';
const { Client } = pkg;

const client = new Client({
  connectionString: 'postgres://leolopez-linquet@localhost:5432/clubbooking_local'
});

await client.connect();

// Check clubs table schema first
console.log('=== CLUBS TABLE SCHEMA ===');
const schemaResult = await client.query('SELECT column_name, data_type FROM information_schema.columns WHERE table_name = $1', ['clubs']);
schemaResult.rows.forEach(col => {
  console.log(`- ${col.column_name}: ${col.data_type}`);
});

// Check all clubs
console.log('\n=== ALL CLUBS ===');
const clubsResult = await client.query('SELECT * FROM clubs ORDER BY id');
clubsResult.rows.forEach(club => {
  console.log(`Club:`, club);
});

// Check if there are any user_clubs assignments (even with deleted users)
console.log('\n=== USER_CLUBS ASSIGNMENTS ===');
const userClubsResult = await client.query('SELECT uc.*, u.username, c.name as club_name FROM user_clubs uc LEFT JOIN users u ON uc.user_id = u.id LEFT JOIN clubs c ON uc.club_id = c.id ORDER BY uc.user_id');
userClubsResult.rows.forEach(assignment => {
  console.log(`User: ${assignment.username || 'DELETED'} (ID: ${assignment.user_id}), Club: ${assignment.club_name} (ID: ${assignment.club_id}), Role: ${assignment.role}`);
});

await client.end();