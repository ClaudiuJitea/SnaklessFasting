import * as SQLite from 'expo-sqlite';
import i18n from '../i18n';

let db = null;
let isInitializing = false;

// Initialize database connection with better error handling
const initDatabaseConnection = async () => {
  try {
    // Prevent multiple simultaneous initialization attempts
    if (isInitializing) {
      console.log('Database initialization already in progress, waiting...');
      while (isInitializing) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      return db;
    }

    if (!db) {
      isInitializing = true;
      console.log('Opening database connection...');
      
      // Close any existing connection first
      if (db) {
        try {
          await db.closeAsync();
        } catch (closeError) {
          console.warn('Error closing existing database connection:', closeError);
        }
      }
      
      db = await SQLite.openDatabaseAsync('fasting_app.db');
      console.log('Database connection established');
      isInitializing = false;
    }
    return db;
  } catch (error) {
    console.error('Failed to open database connection:', error);
    isInitializing = false;
    db = null;
    throw error;
  }
};

// Get database connection with retry logic
const getDatabaseConnection = async (retries = 3) => {
  for (let i = 0; i < retries; i++) {
    try {
      const database = await initDatabaseConnection();
      if (database) {
        // Test the connection with a simple query
        await database.getFirstAsync('SELECT 1');
        return database;
      }
    } catch (error) {
      console.error(`Database connection attempt ${i + 1} failed:`, error);
      if (i === retries - 1) {
        throw error;
      }
      // Reset connection on failure
      db = null;
      isInitializing = false;
      // Wait before retry
      await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
    }
  }
  throw new Error('Failed to establish database connection after retries');
};

// Execute database operation with connection validation
const executeWithValidConnection = async (operation, ...args) => {
  try {
    const database = await getDatabaseConnection();
    if (!database) {
      throw new Error('Database connection is null');
    }
    return await operation(database, ...args);
  } catch (error) {
    console.error('Database operation failed:', error);
    // Reset connection on any database error
    db = null;
    isInitializing = false;
    throw error;
  }
};

// Initialize database tables
export const initDatabase = async () => {
  try {
    console.log('Starting database initialization...');
    const database = await getDatabaseConnection();
    
    if (!database) {
      throw new Error('Database connection is null');
    }
    
    // Create tables using execAsync for bulk operations
    await database.execAsync(`
      PRAGMA journal_mode = WAL;
      
      CREATE TABLE IF NOT EXISTS fasting_sessions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        start_time TEXT NOT NULL,
        end_time TEXT,
        duration_hours REAL,
        preset_type TEXT,
        is_completed BOOLEAN DEFAULT 0,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      );
      
      CREATE TABLE IF NOT EXISTS weight_entries (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        weight REAL NOT NULL,
        date TEXT NOT NULL,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      );
      
      CREATE TABLE IF NOT EXISTS hydration_entries (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        amount REAL NOT NULL,
        date TEXT NOT NULL,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      );
      
      CREATE TABLE IF NOT EXISTS achievements (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        type TEXT NOT NULL UNIQUE,
        title TEXT NOT NULL,
        description TEXT,
        unlocked_at TEXT,
        is_unlocked BOOLEAN DEFAULT 0
      );
      
      CREATE TABLE IF NOT EXISTS user_settings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        key TEXT UNIQUE NOT NULL,
        value TEXT NOT NULL
      );
      
      CREATE TABLE IF NOT EXISTS user_profile (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT,
        age INTEGER,
        height REAL,
        gender TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP
      );
      
      CREATE TABLE IF NOT EXISTS app_metadata (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        key TEXT UNIQUE NOT NULL,
        value TEXT NOT NULL
      );
    `);
    
    // Check if achievements have been initialized
    const achievementsCheck = await database.getFirstAsync(
      'SELECT COUNT(*) as count FROM achievements'
    );
    
    // Only insert achievements if none exist
    if (achievementsCheck.count === 0) {
      console.log('Initializing achievements for the first time...');
      await database.runAsync(
        `INSERT INTO achievements (type, title, description) VALUES 
         (?, ?, ?), (?, ?, ?), (?, ?, ?), (?, ?, ?)`,
        [
          'streak_7', 
          '7-Day Streak', 
          'Complete 7 consecutive days of fasting',
          'streak_30', 
          '30-Day Streak', 
          'Complete 30 consecutive days of fasting',
          'longest_fast', 
          'Marathon Faster', 
          'Complete a 24-hour fast',
          'weight_milestone', 
          'Weight Goal', 
          'Reach your target weight'
        ]
      );
      
      // Mark achievements as initialized
      await database.runAsync(
        'INSERT OR REPLACE INTO app_metadata (key, value) VALUES (?, ?)',
        ['achievements_initialized', 'true']
      );
      
      console.log('Achievements initialized successfully');
    } else {
      console.log(`Found ${achievementsCheck.count} existing achievements, skipping initialization`);
    }
    
    return true;
  } catch (error) {
    console.error('Database initialization error:', error);
    throw error;
  }
};

// Fasting session operations
export const startFastingSession = async (presetType) => {
  return executeWithValidConnection(async (database) => {
    const startTime = new Date().toISOString();
    const result = await database.runAsync(
      'INSERT INTO fasting_sessions (start_time, preset_type) VALUES (?, ?)',
      [startTime, presetType]
    );
    return result.lastInsertRowId;
  });
};

export const endFastingSession = async (sessionId) => {
  try {
    const database = await getDatabaseConnection();
    const endTime = new Date().toISOString();
    const result = await database.runAsync(
      'UPDATE fasting_sessions SET end_time = ?, is_completed = 1 WHERE id = ?',
      [endTime, sessionId]
    );
    return result;
  } catch (error) {
    console.error('Error ending fasting session:', error);
    throw error;
  }
};

export const getCurrentFastingSession = async () => {
  try {
    return await executeWithValidConnection(async (database) => {
      const result = await database.getFirstAsync(
        'SELECT * FROM fasting_sessions WHERE end_time IS NULL ORDER BY start_time DESC LIMIT 1'
      );
      return result || null;
    });
  } catch (error) {
     console.error('Error getting current fasting session:', error);
     return null;
   }
 };

// Fasting session functions
export const saveFastingSession = async (session) => {
  try {
    const database = await initDatabaseConnection();
    const result = await database.runAsync(
      'INSERT INTO fasting_sessions (start_time, end_time, duration_hours, preset_type, is_completed) VALUES (?, ?, ?, ?, ?)',
      [session.start_time, session.end_time, session.duration_hours, session.preset_type, session.is_completed]
    );
    return result.lastInsertRowId;
  } catch (error) {
    console.error('Error saving fasting session:', error);
    throw error;
  }
};



export const updateFastingSession = async (id, updates) => {
  try {
    const database = await initDatabaseConnection();
    const setClause = Object.keys(updates).map(key => `${key} = ?`).join(', ');
    const values = Object.values(updates);
    
    const result = await database.runAsync(
      `UPDATE fasting_sessions SET ${setClause} WHERE id = ?`,
      [...values, id]
    );
    return result.changes;
  } catch (error) {
    console.error('Error updating fasting session:', error);
    throw error;
  }
};

// Weight operations
export const addWeightEntry = async (weight, date) => {
  return executeWithValidConnection(async (database) => {
    const result = await database.runAsync(
      'INSERT INTO weight_entries (weight, date) VALUES (?, ?)',
      [weight, date]
    );
    return result.lastInsertRowId;
  });
};

export const getWeightEntries = async (limit = 30) => {
  return executeWithValidConnection(async (database) => {
    const result = await database.getAllAsync(
      'SELECT * FROM weight_entries ORDER BY date DESC LIMIT ?',
      [limit]
    );
    return result;
  });
};

// Hydration operations
export const addHydrationEntry = async (amount, date) => {
  try {
    const database = await getDatabaseConnection();
    
    if (!database) {
      throw new Error('Database connection is null');
    }
    
    const result = await database.runAsync(
      'INSERT INTO hydration_entries (amount, date) VALUES (?, ?)',
      [amount, date]
    );
    return result.lastInsertRowId;
  } catch (error) {
    console.error('Error adding hydration entry:', error);
    throw error;
  }
};

export const getHydrationForDate = async (date) => {
  try {
    const database = await getDatabaseConnection();
    
    if (!database) {
      throw new Error('Database connection is null');
    }
    
    const result = await database.getFirstAsync(
      'SELECT SUM(amount) as total FROM hydration_entries WHERE date = ?',
      [date]
    );
    return result?.total || 0;
  } catch (error) {
    console.error('Error getting hydration for date:', error);
    throw error;
  }
};

// Achievement operations
export const unlockAchievement = async (type) => {
  try {
    const database = await getDatabaseConnection();
    const unlockedAt = new Date().toISOString();
    const result = await database.runAsync(
      'UPDATE achievements SET is_unlocked = 1, unlocked_at = ? WHERE type = ? AND is_unlocked = 0',
      [unlockedAt, type]
    );
    return result;
  } catch (error) {
    console.error('Error unlocking achievement:', error);
    throw error;
  }
};

export const resetAchievements = async () => {
  try {
    const database = await getDatabaseConnection();
    const result = await database.runAsync(
      'UPDATE achievements SET is_unlocked = 0, unlocked_at = NULL'
    );
    return result;
  } catch (error) {
    console.error('Error resetting achievements:', error);
    throw error;
  }
};

export const cleanupDuplicateAchievements = async () => {
  try {
    const database = await getDatabaseConnection();
    
    // Delete all achievements first
    await database.runAsync('DELETE FROM achievements');
    
    // Reset the auto-increment counter
    await database.runAsync('DELETE FROM sqlite_sequence WHERE name = "achievements"');
    
    // Insert fresh achievements
    await database.runAsync(
      `INSERT INTO achievements (type, title, description) VALUES 
       (?, ?, ?), (?, ?, ?), (?, ?, ?), (?, ?, ?)`,
      [
        'streak_7', 
        '7-Day Streak', 
        'Complete 7 consecutive days of fasting',
        'streak_30', 
        '30-Day Streak', 
        'Complete 30 consecutive days of fasting',
        'longest_fast', 
        'Marathon Faster', 
        'Complete a 24-hour fast',
        'weight_milestone', 
        'Weight Goal', 
        'Reach your target weight'
      ]
    );
    
    console.log('Duplicate achievements cleaned up successfully');
    return true;
  } catch (error) {
    console.error('Error cleaning up duplicate achievements:', error);
    throw error;
  }
};

export const getAchievements = async () => {
  try {
    const database = await getDatabaseConnection();
    const result = await database.getAllAsync(
      'SELECT * FROM achievements ORDER BY is_unlocked DESC, unlocked_at DESC'
    );
    return result;
  } catch (error) {
    console.error('Error getting achievements:', error);
    throw error;
  }
};

// Statistics operations
export const getFastingStats = async (days = 7) => {
  return executeWithValidConnection(async (database) => {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    
    const result = await database.getFirstAsync(
      `SELECT 
        COUNT(*) as total_sessions,
        AVG(duration_hours) as avg_duration,
        SUM(duration_hours) as total_hours
      FROM fasting_sessions 
      WHERE is_completed = 1 AND start_time >= ?`,
      [startDate.toISOString()]
    );
    return result;
  });
};

// Get weekly fasting data for charts
export const getWeeklyFastingData = async () => {
  try {
    const database = await getDatabaseConnection();
    const result = await database.getAllAsync(
      `SELECT 
        DATE(start_time) as date,
        SUM(duration_hours) as total_hours
      FROM fasting_sessions 
      WHERE is_completed = 1 
        AND start_time >= date('now', '-7 days')
      GROUP BY DATE(start_time)
      ORDER BY date ASC`
    );
    return result;
  } catch (error) {
    console.error('Error getting weekly fasting data:', error);
    throw error;
  }
};

// Get current fasting streak
export const getCurrentStreak = async () => {
  try {
    const database = await getDatabaseConnection();
    const result = await database.getFirstAsync(
      `SELECT COUNT(*) as streak FROM (
        SELECT date(start_time) as session_date FROM fasting_sessions 
        WHERE is_completed = 1 
        AND date(start_time) >= date('now', '-30 days')
        GROUP BY date(start_time)
        ORDER BY date(start_time) DESC
      )`
    );
    return result?.streak || 0;
  } catch (error) {
    console.error('Error getting current streak:', error);
    return 0;
  }
};

// User profile operations
export const getUserProfile = async () => {
  try {
    const database = await getDatabaseConnection();
    const result = await database.getFirstAsync(
      'SELECT * FROM user_profile ORDER BY id DESC LIMIT 1'
    );
    return result;
  } catch (error) {
    console.error('Error getting user profile:', error);
    return null;
  }
};

export const updateUserProfile = async (profileData) => {
  try {
    const database = await getDatabaseConnection();
    const existingProfile = await getUserProfile();
    
    if (existingProfile) {
      await database.runAsync(
        `UPDATE user_profile SET 
         name = ?, age = ?, height = ?, gender = ?, updated_at = CURRENT_TIMESTAMP 
         WHERE id = ?`,
        [profileData.name, profileData.age, profileData.height, profileData.gender, existingProfile.id]
      );
    } else {
      await database.runAsync(
        'INSERT INTO user_profile (name, age, height, gender) VALUES (?, ?, ?, ?)',
        [profileData.name, profileData.age, profileData.height, profileData.gender]
      );
    }
    
    return await getUserProfile();
  } catch (error) {
    console.error('Error updating user profile:', error);
    throw error;
  }
};

// Get weekly hydration data for charts
export const getWeeklyHydrationData = async () => {
  try {
    const database = await getDatabaseConnection();
    const result = await database.getAllAsync(
      `SELECT 
        date,
        SUM(amount) as total_amount
      FROM hydration_entries 
      WHERE date >= date('now', '-7 days')
      GROUP BY date
      ORDER BY date ASC`
    );
    return result;
  } catch (error) {
    console.error('Error getting weekly hydration data:', error);
    throw error;
  }
};

// Export the database connection function for external use if needed
export { getDatabaseConnection };

export const forceCleanupDatabase = async () => {
  try {
    const database = await getDatabaseConnection();
    
    console.log('FORCE CLEANUP: Starting database cleanup...');
    
    // Delete all achievements
    await database.runAsync('DELETE FROM achievements');
    console.log('FORCE CLEANUP: Deleted all achievements');
    
    // Reset the auto-increment counter
    await database.runAsync('DELETE FROM sqlite_sequence WHERE name = "achievements"');
    console.log('FORCE CLEANUP: Reset achievement ID counter');
    
    // Insert only 4 fresh achievements
    await database.runAsync(
      `INSERT INTO achievements (type, title, description) VALUES 
       (?, ?, ?), (?, ?, ?), (?, ?, ?), (?, ?, ?)`,
      [
        'streak_7', 
        '7-Day Streak', 
        'Complete 7 consecutive days of fasting',
        'streak_30', 
        '30-Day Streak', 
        'Complete 30 consecutive days of fasting',
        'longest_fast', 
        'Marathon Faster', 
        'Complete a 24-hour fast',
        'weight_milestone', 
        'Weight Goal', 
        'Reach your target weight'
      ]
    );
    console.log('FORCE CLEANUP: Inserted 4 fresh achievements');
    
    // Mark as initialized to prevent future duplicates
    await database.runAsync(
      'INSERT OR REPLACE INTO app_metadata (key, value) VALUES (?, ?)',
      ['achievements_initialized', 'true']
    );
    console.log('FORCE CLEANUP: Marked achievements as initialized');
    
    // Verify the fix
    const count = await database.getFirstAsync('SELECT COUNT(*) as count FROM achievements');
    console.log(`FORCE CLEANUP: Verification - ${count.count} achievements in database`);
    
    return { success: true, count: count.count };
  } catch (error) {
    console.error('FORCE CLEANUP: Error during cleanup:', error);
    throw error;
  }
};

// Clear all app data
export const clearAllData = async () => {
  try {
    const database = await getDatabaseConnection();
    
    console.log('CLEAR DATA: Starting complete data wipe...');
    
    // Delete all data from all tables
    await database.runAsync('DELETE FROM fasting_sessions');
    console.log('CLEAR DATA: Deleted all fasting sessions');
    
    await database.runAsync('DELETE FROM weight_entries');
    console.log('CLEAR DATA: Deleted all weight entries');
    
    await database.runAsync('DELETE FROM hydration_entries');
    console.log('CLEAR DATA: Deleted all hydration entries');
    
    await database.runAsync('DELETE FROM achievements');
    console.log('CLEAR DATA: Deleted all achievements');
    
    await database.runAsync('DELETE FROM user_settings');
    console.log('CLEAR DATA: Deleted all user settings');
    
    await database.runAsync('DELETE FROM user_profile');
    console.log('CLEAR DATA: Deleted user profile');
    
    await database.runAsync('DELETE FROM app_metadata');
    console.log('CLEAR DATA: Deleted app metadata');
    
    // Reset all auto-increment counters
    await database.runAsync('DELETE FROM sqlite_sequence');
    console.log('CLEAR DATA: Reset all auto-increment counters');
    
    // Re-initialize achievements
    await database.runAsync(
      `INSERT INTO achievements (type, title, description) VALUES 
       (?, ?, ?), (?, ?, ?), (?, ?, ?), (?, ?, ?)`,
      [
        'streak_7', 
        '7-Day Streak', 
        'Complete 7 consecutive days of fasting',
        'streak_30', 
        '30-Day Streak', 
        'Complete 30 consecutive days of fasting',
        'longest_fast', 
        'Marathon Faster', 
        'Complete a 24-hour fast',
        'weight_milestone', 
        'Weight Goal', 
        'Reach your target weight'
      ]
    );
    console.log('CLEAR DATA: Re-initialized achievements');
    
    // Mark achievements as initialized
    await database.runAsync(
      'INSERT INTO app_metadata (key, value) VALUES (?, ?)',
      ['achievements_initialized', 'true']
    );
    console.log('CLEAR DATA: Marked achievements as initialized');
    
    console.log('CLEAR DATA: Complete data wipe finished successfully');
    return { success: true };
  } catch (error) {
    console.error('CLEAR DATA: Error during data clearing:', error);
    throw error;
  }
};