import fs from 'fs';
import path from 'path';
import pool from './database';

export const runMigrations = async () => {
  try {
    console.log('🗄️  Running database migrations...');
    
    // Check if migrations already ran
    try {
      const { rows } = await pool.query("SELECT 1 FROM information_schema.tables WHERE table_name = 'users'");
      if (rows.length > 0) {
        console.log('✅ Database tables already exist, skipping migrations');
        return;
      }
    } catch (error) {
      // Continue with migrations
    }
    
    const schemaPath = path.join(__dirname, 'schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');
    
    // Execute the entire schema
    await pool.query(schema);
    console.log('✅ Database migrations completed successfully');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    // Don't throw - let the server start anyway
    console.log('⚠️  Continuing without migrations...');
  }
};

export const seedDatabase = async () => {
  try {
    console.log('🌱 Seeding database with initial data...');
    
    // Check if users already exist
    const { rows: existingUsers } = await pool.query('SELECT COUNT(*) FROM users');
    if (parseInt(existingUsers[0].count) > 0) {
      console.log('📊 Database already contains data, skipping seed');
      return;
    }

    const bcrypt = await import('bcryptjs');
    const hashedPassword = await bcrypt.hash('password123', 12);

    // Create users
    const { rows: users } = await pool.query(`
      INSERT INTO users (email, username, password, role, points, badges) VALUES
      ('alice@example.com', 'alice', $1, 'USER', 50, ARRAY['Early Bird', 'Task Master']),
      ('bob@example.com', 'bob', $1, 'USER', 30, ARRAY['Team Player']),
      ('admin@example.com', 'admin', $1, 'ADMIN', 100, ARRAY['Admin', 'Founder'])
      RETURNING id, email, username, role, points
    `, [hashedPassword]);

    console.log(`👥 Created ${users.length} users`);

    // Create groups
    const { rows: groups } = await pool.query(`
      INSERT INTO groups (name, description, creator_id) VALUES
      ('Software Testing Study Group', 'A group for studying software testing concepts and practices', $1),
      ('Mathematics Study Circle', 'Collaborative math problem solving', $2)
      RETURNING id, name
    `, [users[0].id, users[1].id]);

    console.log(`👥 Created ${groups.length} groups`);

    // Add group members
    await pool.query(`
      INSERT INTO group_members (user_id, group_id, role) VALUES
      ($1, $3, 'ADMIN'),
      ($2, $3, 'USER'),
      ($2, $4, 'ADMIN'),
      ($1, $4, 'USER')
    `, [users[0].id, users[1].id, groups[0].id, groups[1].id]);

    // Create sample tasks
    const { rows: tasks } = await pool.query(`
      INSERT INTO tasks (title, description, status, priority, creator_id, assignee_id, group_id, category, points) VALUES
      ('Complete Unit Testing Exercise', 'Finish the unit testing assignment for chapter 3', 'IN_PROGRESS', 'HIGH', $1, $1, $3, 'Assignment', 20),
      ('Review Pull Request', 'Review the new authentication feature PR', 'OPEN', 'MEDIUM', $2, $2, $3, 'Review', 15),
      ('Study for Exam', 'Prepare for software engineering exam next week', 'OPEN', 'URGENT', $1, $1, NULL, 'Study', 25),
      ('Team Meeting Notes', 'Prepare agenda and notes for weekly team meeting', 'DONE', 'LOW', $2, $2, $4, 'Meeting', 10),
      ('Database Design', 'Design the database schema for the final project', 'OVERDUE', 'HIGH', $1, $2, $4, 'Project', 30)
      RETURNING id, title
    `, [users[0].id, users[1].id, groups[0].id, groups[1].id]);

    console.log(`📋 Created ${tasks.length} tasks`);
    console.log('✅ Database seeding completed successfully!');

  } catch (error) {
    console.error('❌ Seeding failed:', error);
    throw error;
  }
};
