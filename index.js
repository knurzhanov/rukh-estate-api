const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const authRoutes = require('./routes/authRoutes');
const authMiddleware = require('./middleware/authMiddleware');


const app = express();


const PORT = process.env.PORT || 5000;
// mongoose.connect('mongodb://localhost:27017/real_estate', {})
mongoose.connect(process.env.MONGO_URI, {
  // useNewUrlParser: true, // Удалите это
  // useUnifiedTopology: true, // Удалите это
})
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
  description: { type: String, required: false }, // Описание может быть пустым
  images: [{ type: String, required: false }], // Массив строк для изображений
});

const Property = mongoose.model('Property', PropertySchema);

// Middleware
app.use(express.json());
app.use(cors());
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
      { new: true, runValidators: true } // new: true возвращает обновленный документ, runValidators обеспечивает валидацию данных при обновлении
    );
    
    if (!property) {
      return res.status(404).json({ message: 'Property not found' });
    }
    
    res.status(200).json(property);
  } catch (error) {
    res.status(500).json({ message: 'Error updating property', error });
  }
});

app.get('/properties', async (req, res) => {
  let { roomCount } = req.query;

  try {
    // Логирование roomCount для диагностики
    console.log('roomCount from query:', roomCount);

    let query = {};

    // Проверяем roomCount: если оно равно '100', показываем все квартиры
    if (roomCount === '100') {
      query = {}; // Показать все квартиры
    } else if (roomCount) {
      // Преобразуем roomCount в число для сравнения с числовым полем в базе данных
      query = { roomCount: parseInt(roomCount, 10) };
    }

    // Логирование построенного запроса
    console.log('Query:', query);

    // Получение списка квартир по построенному запросу
    const properties = await Property.find(query);

    // Логирование найденных квартир
    console.log('Properties found:', properties);

    if (properties.length > 0) {
      res.json(properties);
    } else {
      res.status(404).send('Нет доступных квартир');
    }
  } catch (error) {
    console.error('Error:', error);
    res.status(500).send('Ошибка при получении данных');
  }
});




// Обработчик для получения объекта по ID
app.get('/properties/:id', async (req, res) => {
  try {
    const property = await Property.findById(req.params.id);
    if (!property)
      return res.status(404).json({ message: 'Property not found' });
    res.status(200).json(property);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching property', error });
  }
});


app.get('/api/users', async (req, res) => {
  // Логика для получения списка пользователей
  const users = await getUsersFromDatabase(); // Пример
  res.json(users);
});

// Пример маршрута для изменения пароля пользователя
app.put('/api/users/:id/password', async (req, res) => {
  const { id } = req.params;
  const { password } = req.body;

  try {
    const response = await axios.put(`https://rukh-estate-api-5571379c698a.herokuapp.com/api/auth/users/${id}/password`, { password });
    res.json(response.data);
  } catch (error) {
    res.status(500).json({ message: 'Error updating password' });
  }
});

// Пример маршрута для удаления пользователя
app.delete('/api/users/:id', async (req, res) => {
  const { id } = req.params;

  try {
    await axios.delete(`https://rukh-estate-api-5571379c698a.herokuapp.com/api/auth/users/${id}`);
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting user' });
  }
});

app.use(express.json());
app.use(cors({
  origin: 'https://rukh-estate.vercel.app', // Укажите домен фронтенда
  methods: ['GET', 'POST', 'PUT', 'DELETE'], // Разрешенные методы
  allowedHeaders: ['Content-Type', 'Authorization'], // Разрешенные заголовки
}));


// Запуск сервера

app.listen(PORT, () => console.log(`Server is running on port ${PORT}`));
