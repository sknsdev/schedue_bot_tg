const TelegramBot = require('node-telegram-bot-api');
const cron = require('node-cron');
const dotenv = require('dotenv');

// Загрузка переменных окружения из файла .env
dotenv.config();

// Получаем токен из переменных окружения
const token = process.env.TELEGRAM_BOT_TOKEN;
console.log('Запрос Токена');
if (!token) {
    throw new Error('Токен Telegram бота не найден. Проверь файл .env');
}
console.log('Сервер запущен');

// Инициализируем бота
const bot = new TelegramBot(token, { polling: true });

// Хранилище для сохранения времени уведомлений пользователей
const userSettings = {};

// Функция для настройки уведомлений
const setReminder = (chatId, time) => {
    // Удаляем предыдущий cron (если есть) для данного пользователя
    if (userSettings[chatId]) {
        const task = userSettings[chatId].task;
        if (task) {
            task.stop();
        }
    }

    // Добавляем новую cron-задачу
    const task = cron.schedule(`0 ${time.split(':')[1]} ${time.split(':')[0]} * * *`, () => {
        bot.sendMessage(chatId, 'Выпей таблетки');
    }, {
        timezone: 'Europe/Moscow'
    });

    // Сохраняем настройки пользователя
    userSettings[chatId] = { time, task };
};

// Обработка команды /start
bot.onText(/\/start/, (msg) => {
    const chatId = msg.chat.id;
    bot.sendMessage(chatId, 'Привет! Укажи время, когда ты хочешь получать уведомление (например, 19:00). Используй команды /mytime и /time для сверки времени.');
});

// Обработка времени от пользователя
bot.on('message', (msg) => {
    const chatId = msg.chat.id.toString();
    const text = msg.text || '';

    // Проверяем, является ли сообщение временем в формате HH:MM
    const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
    if (timeRegex.test(text)) {
        // Устанавливаем напоминание на указанное время
        setReminder(chatId, text);
        bot.sendMessage(chatId, `Напоминание установлено на ${text} по Москве. Я буду напоминать каждый день.`);
    } else if (!text.startsWith('/')) {
        bot.sendMessage(chatId, 'Пожалуйста, укажи время в формате HH:MM (например, 19:00).');
    }
});

// Команда /mytime для проверки установленного времени уведомления
bot.onText(/\/mytime/, (msg) => {
    const chatId = msg.chat.id.toString();
    if (userSettings[chatId] && userSettings[chatId].time) {
        bot.sendMessage(chatId, `Ваше напоминание установлено на ${userSettings[chatId].time} по Москве.`);
    } else {
        bot.sendMessage(chatId, 'Вы еще не установили время напоминания.');
    }
});

// Команда /time для проверки текущего серверного времени
bot.onText(/\/time/, (msg) => {
    const chatId = msg.chat.id;
    const originalServerTime = new Date().toLocaleTimeString('ru-RU');
    const serverTime = new Date().toLocaleTimeString('ru-RU', { timeZone: 'Europe/Moscow' });
    bot.sendMessage(chatId, `Текущее время: ${serverTime} по Москве, время сервера: ${originalServerTime}`);
});