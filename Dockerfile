# Используем официальный образ Node.js
FROM node:16

# Устанавливаем рабочую директорию
WORKDIR /usr/src/app

# Копируем файлы package.json и package-lock.json для установки зависимостей
COPY package*.json ./

# Устанавливаем PM2 глобально
RUN npm install pm2 -g

# Устанавливаем зависимости
RUN npm install

# Копируем остальные файлы проекта в контейнер
COPY . .

# Открываем порт, если нужно для будущего масштабирования (опционально)
# EXPOSE 3000

# Запускаем проект через PM2
CMD ["pm2-runtime", "ecosystem.config.js"]