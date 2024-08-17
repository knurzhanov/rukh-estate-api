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

module.exports = router;
