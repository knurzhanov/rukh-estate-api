const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const axios = require('axios');
const authRoutes = require('./routes/authRoutes');
const authMiddleware = require('./middleware/authMiddleware');

const app = express();
const PORT = process.env.PORT || 5000;

// Подключение к MongoDB
mongoose.connect(process.env.MONGO_URI, {});

// Модель недвижимости
const PropertySchema = new mongoose.Schema({
  title: { type: String, required: true },
  roomCount: { type: String, required: true },
  area: { type: String, required: true },
  floor: { type: String, required: true },
  totalFloors: { type: String, required: true },
  address: { type: String, required: true },
  price: { type: String, required: true },
  square: { type: String, required: true },
  homeTitle: { type: String, required: false },
  description: { type: String, required: false },
  images: [{ type: String, required: false }],
});

const Property = mongoose.model('Property', PropertySchema);

// Middleware
app.use(express.json());
app.use(cors({
  origin: 'https://rukh-estate.vercel.app', // Укажите домен фронтенда
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Маршруты
app.use('/api/auth', authRoutes);

app.get('/api/protected', authMiddleware, (req, res) => {
  res.json({ message: 'This is a protected route' });
});

// Обработчик для добавления новых объектов
app.post('/add-product', async (req, res) => {
  try {
    const property = new Property(req.body);
    await property.save();
    res.status(201).json(property);
  } catch (error) {
    res.status(400).json({ message: 'Error adding property', error });
  }
});

// Обработчик для удаления объекта по ID
app.delete('/properties/:id', async (req, res) => {
  try {
    const property = await Property.findByIdAndDelete(req.params.id);
    if (!property) {
      return res.status(404).json({ message: 'Property not found' });
    }
    res.status(200).json({ message: 'Property deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting property', error });
  }
});

// Обработчик для обновления объекта по ID
app.put('/properties/:id', async (req, res) => {
  try {
    const property = await Property.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    
    if (!property) {
      return res.status(404).json({ message: 'Property not found' });
    }
    
    res.status(200).json(property);
  } catch (error) {
    res.status(500).json({ message: 'Error updating property', error });
  }
});

// Обработчик для получения списка объектов
app.get('/properties', async (req, res) => {
  let { roomCount } = req.query;

  try {
    let query = {};

    if (roomCount === '100') {
      query = {};
    } else if (roomCount) {
      query = { roomCount: parseInt(roomCount, 10) };
    }

    const properties = await Property.find(query);

    if (properties.length > 0) {
      res.json(properties);
    } else {
      res.status(404).send('Нет доступных квартир');
    }
  } catch (error) {
    res.status(500).send('Ошибка при получении данных');
  }
});

// Обработчик для получения объекта по ID
app.get('/properties/:id', async (req, res) => {
  try {
    const property = await Property.findById(req.params.id);
    if (!property) {
      return res.status(404).json({ message: 'Property not found' });
    }
    res.status(200).json(property);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching property', error });
  }
});

// Пример маршрута для получения списка пользователей (прямое взаимодействие)
app.get('/api/users', async (req, res) => {
  try {
    const users = await User.find(); // Замените на корректную модель пользователя
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching users' });
  }
});

// Пример маршрута для изменения пароля пользователя (прямое взаимодействие)
app.put('/api/users/:id/password', async (req, res) => {
  const { id } = req.params;
  const { password } = req.body;

  try {
    const user = await User.findById(id); // Замените на корректную модель пользователя
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.password = password; // Обновление пароля пользователя
    await user.save();
    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error updating password' });
  }
});

// Пример маршрута для удаления пользователя (прямое взаимодействие)
app.delete('/api/users/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const user = await User.findByIdAndDelete(id); // Замените на корректную модель пользователя
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting user' });
  }
});

// Запуск сервера
app.listen(PORT, () => console.log(`Server is running on port ${PORT}`));
