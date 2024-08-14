// Импорт необходимых модулей
const jwt = require('jsonwebtoken'); // Убедитесь, что вы установили этот пакет
const { secretKey } = require('../config'); // Ваш секретный ключ для JWT

// Middleware для проверки аутентификации
const authMiddleware = (req, res, next) => {
  // Получаем токен из заголовка Authorization
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Извлекаем токен из строки 'Bearer <token>'

  if (!token) {
    // Если токен не предоставлен
    return res.status(403).json({ message: 'No token provided' });
  }

  // Проверяем токен с использованием секретного ключа
  jwt.verify(token, secretKey, (err, decoded) => {
    if (err) {
      // Если проверка токена не удалась (например, токен недействителен или просрочен)
      return res.status(401).json({ message: 'Failed to authenticate token' });
    }

    // Если токен валиден, сохраняем идентификатор пользователя из токена в запросе
    req.userId = decoded.id;
    
    // Переходим к следующему middleware или обработчику маршрута
    next();
  });
};

module.exports = authMiddleware;
