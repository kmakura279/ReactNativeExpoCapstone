
import * as SQLite from 'expo-sqlite';

const DATABASE_NAME = 'little_lemon';
const MENU_URL =
  'https://raw.githubusercontent.com/Meta-Mobile-Developer-PC/Working-With-Data-API/main/capstone.json';

let databasePromise = null;

export const getDatabase = () => {
  if (!databasePromise) {
    databasePromise = SQLite.openDatabaseAsync(DATABASE_NAME)
      .catch((error) => {
        databasePromise = null;
        throw error;
      });
  }

  return databasePromise;
};

export const initializeDatabase = async () => {
  const db = await getDatabase();

  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS menu (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      price REAL NOT NULL,
      description TEXT,
      image TEXT,
      category TEXT
    );
  `);

  return db;
};

export const getMenuItems = async () => {
  const db = await initializeDatabase();

  return await db.getAllAsync(
    'SELECT * FROM menu ORDER BY id ASC'
  );
};

export const getMenuCount = async () => {
  const db = await initializeDatabase();

  const result = await db.getFirstAsync(
    'SELECT COUNT(*) AS total FROM menu'
  );

  return result?.total ?? 0;
};

export const saveMenuItems = async (items) => {
  if (!Array.isArray(items) || items.length === 0) {
    throw new Error('No menu items to save.');
  }

  const db = await initializeDatabase();

  await db.withExclusiveTransactionAsync(async (transaction) => {
    for (const item of items) {
      await transaction.runAsync(
        `INSERT INTO menu
         (name, price, description, image, category)
         VALUES (?, ?, ?, ?, ?)`,
        [
          item.name,
          item.price,
          item.description ?? '',
          item.image ?? '',
          item.category ?? '',
        ]
      );
    }
  });
};

export const fetchMenuFromServer = async () => {
  const response = await fetch(MENU_URL);

  if (!response.ok) {
    throw new Error(
      `Failed to fetch menu: HTTP ${response.status}`
    );
  }

  const data = await response.json();

  if (!Array.isArray(data.menu) || data.menu.length === 0) {
    throw new Error('Invalid menu data received.');
  }

  return data.menu.map((item) => ({
    name: String(item.name),
    price: Number(item.price),
    description: String(item.description ?? ''),
    image: String(item.image ?? ''),
    category: String(item.category ?? ''),
  }));
};

export const loadMenu = async () => {
  await initializeDatabase();

  const count = await getMenuCount();

  if (count > 0) {
    console.log('Loading menu from SQLite database.');
    return await getMenuItems();
  }

  console.log('SQLite menu empty. Fetching from server.');

  const remoteItems = await fetchMenuFromServer();

  await saveMenuItems(remoteItems);

  return await getMenuItems();
};
