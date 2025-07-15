const express = require('express');
const fs = require('fs');
const path = require('path');
const helmet = require('helmet');
const morgan = require('morgan');

const app = express();
const PORT = 3000;
const DATA_FILE = path.join(__dirname, 'bookings.json');

// Админ-данные (в реальном проекте используй .env)
const ADMIN_CREDENTIALS = {
  username: 'admin',
  password: 'yourSecurePassword123'
};

// Middleware
app.use(express.json());
app.use(express.static(__dirname));
app.use(helmet());
app.use(morgan('combined'));

// Вспомогательные функции
function readBookings() {
  const data = fs.readFileSync(DATA_FILE, 'utf8');
  return JSON.parse(data);
}

function writeBookings(bookings) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(bookings, null, 2));
}

// --- API ---

// POST /api/book — добавление записи
app.post('/api/book', (req, res) => {
  const newBooking = req.body;

  if (!newBooking.name || !newBooking.phone || !newBooking.service || !newBooking.master || !newBooking.datetime || !newBooking.price) {
    return res.status(400).json({ error: 'Заполните все поля' });
  }

  try {
    let bookings = readBookings();

    // Проверка дубликатов по времени и мастеру
    const exists = bookings.some(b =>
      b.datetime === newBooking.datetime && b.master === newBooking.master
    );

    if (exists) {
      return res.status(400).json({ error: 'На это время уже есть запись у этого мастера.' });
    }

    bookings.push(newBooking);
    writeBookings(bookings);

    console.log('✅ Запись добавлена:', newBooking);
    res.json({ success: true });

  } catch (err) {
    console.error('❌ Ошибка при обработке запроса:', err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// GET /api/bookings — получить все записи (без защиты)
app.get('/api/bookings', (req, res) => {
  try {
    const bookings = readBookings();
    res.json(bookings);
  } catch (err) {
    console.error('❌ Ошибка чтения записей:', err);
    res.status(500).json({ error: 'Не удалось загрузить записи' });
  }
});

// DELETE /api/bookings — удаление записи (только для админа)
app.delete('/api/bookings', (req, res) => {
  const auth = req.headers.authorization;

  if (!auth || !auth.startsWith('Basic ')) {
    return res.status(401).json({ error: 'Доступ запрещён' });
  }

  const base64Credentials = auth.split(' ')[1];
  const credentials = Buffer.from(base64Credentials, 'base64').toString('utf-8');
  const [username, password] = credentials.split(':');

  if (username !== ADMIN_CREDENTIALS.username || password !== ADMIN_CREDENTIALS.password) {
    return res.status(401).json({ error: 'Неверные логин или пароль' });
  }

  const { name, datetime } = req.body;

  if (!name || !datetime) {
    return res.status(400).json({ error: 'Не указаны имя или дата' });
  }

  try {
    let bookings = readBookings();
    const beforeCount = bookings.length;

    bookings = bookings.filter(b => !(b.name === name && b.datetime === datetime));

    if (bookings.length === beforeCount) {
      return res.status(404).json({ error: 'Запись не найдена' });
    }

    writeBookings(bookings);
    console.log('🗑️ Запись удалена:', { name, datetime });
    res.json({ success: true });

  } catch (err) {
    console.error('❌ Ошибка при удалении:', err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Главная страница
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Защита `/admin.html` через Basic Auth
app.get('/admin.html', (req, res) => {
  const auth = req.headers.authorization;

  if (!auth || !auth.startsWith('Basic ')) {
    res.set('WWW-Authenticate', 'Basic realm="Admin"');
    return res.status(401).send('Необходима авторизация');
  }

  const base64Credentials = auth.split(' ')[1];
  const credentials = Buffer.from(base64Credentials, 'base64').toString('utf-8');
  const [username, password] = credentials.split(':');

  if (username === ADMIN_CREDENTIALS.username && password === ADMIN_CREDENTIALS.password) {
    res.sendFile(path.join(__dirname, 'admin.html'));
  } else {
    res.status(401).send('Неверные данные');
  }
});

// Статические файлы (bookings.html и другие)
app.get('/:page.html', (req, res) => {
  const page = req.params.page;
  res.sendFile(path.join(__dirname, `${page}.html`));
});

// Запуск сервера
app.listen(PORT, () => {
  console.log(`🔐 Защищённый сервер запущен: http://localhost:${PORT}`);
});
