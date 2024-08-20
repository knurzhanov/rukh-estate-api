const express = require('express');
const User = require('../models/User');
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

    const existingUser = await User.findOne({ $or: [{ username }, { email }] });
    if (existingUser) {
      return res.status(400).json({ message: 'User with this username or email already exists' });
    }

    const user = new User({ username, email, password, role });
    await user.save();

    console.log('Registered user:', user); // Логирование зарегистрированного пользователя

    res.status(201).json({ message: 'User registered successfully', user });
  } catch (error) {
    res.status(400).json({ message: 'Error registering user', error });
  }
});


// Авторизация пользователя
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    console.log(`Attempting to log in with username: ${username}`);

    // Поиск пользователя в базе данных по имени пользователя
    const user = await User.findOne({ username });
    if (!user) {
      console.log('User not found:', username);
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Сравнение введенного пароля с хэшированным паролем в базе данных
    const isMatch = await bcrypt.compare(password, user.password);
    console.log(`Comparing passwords: Entered (${password}), Hashed (${user.password})`);

    if (!isMatch) {
      console.log('Password does not match for user:', username);
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Создание JWT токена
    const token = jwt.sign({ userId: user._id, role: user.role }, JWT_SECRET, { expiresIn: '1h' });

    console.log(`User ${username} logged in successfully.`);
    res.json({ token, user: { username: user.username, role: user.role } });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Error logging in', error });
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
// Маршрут для изменения пароля пользователя
router.put('/users/:id/password', async (req, res) => {
  const { id } = req.params;
  const { password } = req.body;

  try {
    // Найти пользователя по ID
    const user = await User.findById(id);
    if (!user) {
      console.log(`User with ID ${id} not found`);
      return res.status(404).json({ message: 'User not found' });
    }

    // Проверка получения пароля из тела запроса
    if (!password) {
      console.log('Password not provided');
      return res.status(400).json({ message: 'Password not provided' });
    }

    // Сохранить обновленный пароль
    await user.save();

    console.log(`Password for user ${id} updated successfully`);
    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    console.error('Error updating password:', error);
    res.status(500).json({ message: 'Error updating password', error });
  }
});




module.exports = router;
