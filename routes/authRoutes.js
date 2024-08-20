const express = require('express');
const User = require('../models/User');
 // Добавлен импорт модели Property
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt'); // Добавлен импорт bcrypt для хеширования паролей
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();
const JWT_SECRET = '12345'; // Замените на ваш секретный ключ

// Регистрация пользователя
const saltRounds = 10;

router.post('/register', async (req, res) => {
  try {
    const { username, email, password, role } = req.body;

    if (!username || !email || !password || !role) {
      return res.status(400).json({ message: 'Все поля обязательны' });
    }

    if (!['Admin', 'Visitor'].includes(role)) {
      return res.status(400).json({ message: 'Неверная роль пользователя' });
    }

    const existingUser = await User.findOne({ $or: [{ username }, { email }] });
    if (existingUser) {
      return res.status(400).json({ message: 'Пользователь с таким логином или email уже существует' });
    }

    // Хеширование пароля
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Создание нового пользователя с хешированным паролем
    const user = new User({ username, email, password: hashedPassword, role });
    await user.save();
    res.status(201).json({ message: 'Пользователь успешно зарегистрирован', user });
  } catch (error) {
    console.error('Ошибка при регистрации пользователя:', error);
    res.status(500).json({ message: 'Ошибка при регистрации пользователя', error });
  }
});

// Авторизация пользователя
router.post('/login', async (req, res) => { // Изменен путь на /login
  const { username, password } = req.body;

  try {
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(401).json({ message: 'Неверные учетные данные' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Неверные учетные данные' });
    }

    // Создание JWT токена
    const token = jwt.sign({ userId: user._id, role: user.role }, JWT_SECRET, { expiresIn: '1h' });

    // Возвращаем токен и данные пользователя, включая роль
    res.json({ token, user: { username: user.username, role: user.role } });
  } catch (error) {
    console.error('Ошибка при авторизации:', error);
    res.status(500).json({ message: 'Ошибка при авторизации', error });
  }
});

// Добавление объекта недвижимости
router.post('/add-product', async (req, res) => { // Добавлено authMiddleware для защиты маршрута
  try {
    const property = new Property(req.body); // Создаем новый объект недвижимости
    await property.save(); // Сохраняем его в базе данных
    res.status(201).json(property); // Возвращаем успешный ответ
  } catch (error) {
    res.status(400).json({ message: 'Error adding property', error }); // Обрабатываем ошибки
  }
});

// Удаление объекта недвижимости
router.delete('/properties/:id', async (req, res) => {
  try {
    console.log('Получен запрос на удаление с ID:', req.params.id); // Логирование ID
    const property = await Property.findByIdAndDelete(req.params.id);
    if (!property) {
      console.log('Квартира не найдена для ID:', req.params.id); // Логирование, если квартира не найдена
      return res.status(404).json({ message: 'Property not found' });
    }
    console.log('Квартира успешно удалена с ID:', req.params.id); // Логирование успешного удаления
    res.status(200).json({ message: 'Property deleted successfully' });
  } catch (error) {
    console.error('Ошибка при удалении квартиры:', error);
    res.status(500).json({ message: 'Error deleting property', error });
  }
});

// Получение списка пользователей (маршрут /api/auth/users)
router.get('/users', async (req, res) => {
  try {
    const users = await User.find(); // Получаем всех пользователей из базы данных
    res.json(users); // Возвращаем список пользователей
  } catch (error) {
    console.error('Ошибка при получении списка пользователей:', error);
    res.status(500).json({ message: 'Ошибка при получении списка пользователей', error });
  }
});
router.delete('/users/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const user = await User.findByIdAndDelete(id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Ошибка при удалении пользователя:', error);
    res.status(500).json({ message: 'Error deleting user' });
  }
});

// Обновление пользователя (например, обновление пароля)
router.put('/users/:id', async (req, res) => {
  const { id } = req.params;
  const { username, email, password, role } = req.body;

  try {
    // Найти пользователя по ID
    let user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Обновить поля пользователя, если они переданы в запросе
    if (username) user.username = username;
    if (email) user.email = email;
    if (role) user.role = role;

    // Если передан новый пароль, то хешировать его и обновить
    if (password) {
      const saltRounds = 10;
      user.password = await bcrypt.hash(password, saltRounds);
    }

    // Сохранить обновленного пользователя в базе данных
    await user.save();

    res.json({ message: 'User updated successfully', user });
  } catch (error) {
    console.error('Ошибка при обновлении пользователя:', error);
    res.status(500).json({ message: 'Error updating user' });
  }
});


module.exports = router;
