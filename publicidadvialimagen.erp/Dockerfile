# Usa una imagen base de Node.js moderna
FROM node:18-alpine

# Crea el directorio de la app dentro del contenedor
WORKDIR /app

# Copia package.json y package-lock.json
COPY package*.json ./

# Instala dependencias
RUN npm install

# Copia el resto del código
COPY . .

# Expón el puerto
EXPOSE 3000

# Comando de inicio
CMD ["npm", "run", "dev"]
