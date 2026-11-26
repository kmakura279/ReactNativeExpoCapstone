
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

  return db.getAllAsync(
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

export const fetchMenuFromServer = async () => {
  const response = await fetch(MENU_URL);

  if (!response.ok) {
    throw new Error(`Menu request failed: ${response.status}`);
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
    category: String(item.category ?? '').toLowerCase(),
  }));
};

export const saveMenuItems = async (items) => {
  if (!Array.isArray(items) || items.length === 0) {
    throw new Error('No menu items to save.');
  }

  const db = await initializeDatabase();

  await db.withExclusiveTransactionAsync(async (transaction) => {
    // Only insert when the table is empty.
    const existing = await transaction.getFirstAsync(
      'SELECT COUNT(*) AS total FROM menu'
    );

    if (existing.total > 0) {
      return;
    }

    for (const item of items) {
      await transaction.runAsync(
        `INSERT INTO menu
         (name, price, description, image, category)
         VALUES (?, ?, ?, ?, ?)`,
        [
          item.name,
          item.price,
          item.description,
          item.image,
          item.category,
        ]
      );
    }
  });
};

export const loadMenu = async () => {
  await initializeDatabase();

  const count = await getMenuCount();

  if (count > 0) {
    console.log('Loading menu from SQLite.');
    return getMenuItems();
  }

  console.log('Fetching menu from remote API.');

  const items = await fetchMenuFromServer();

  await saveMenuItems(items);

  return getMenuItems();
};

// Filter by name, categories, or both.
export const filterMenuItems = async (
  searchText = '',
  selectedCategories = []
) => {
  const db = await initializeDatabase();

  const conditions = [];
  const parameters = [];

  const queryText = searchText.trim().toLowerCase();

  // Filter by dish name
  if (queryText !== '') {
    conditions.push(
      "LOWER(name) LIKE ? ESCAPE '\\'"
    );

    // Treat %, _ and \ as literal search characters.
    const escapedText = queryText.replace(
      /[\\%_]/g,
      (character) => '\\' + character
    );

    parameters.push(`%${escapedText}%`);
  }

  // Filter by one or more categories
  if (selectedCategories.length > 0) {
    const placeholders = selectedCategories
      .map(() => '?')
      .join(', ');

    conditions.push(
      `LOWER(category) IN (${placeholders})`
    );

    parameters.push(
      ...selectedCategories.map((category) =>
        category.toLowerCase()
      )
    );
  }

  let sql = 'SELECT * FROM menu';

  if (conditions.length > 0) {
    sql += ` WHERE ${conditions.join(' AND ')}`;
  }

  sql += ' ORDER BY id ASC';

  return db.getAllAsync(sql, parameters);
};
