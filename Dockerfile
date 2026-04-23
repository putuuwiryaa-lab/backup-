# Gunakan Node.js versi terbaru
FROM node:20-slim

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy seluruh source code
COPY . .

# Build frontend (Vite)
RUN npm run build

# Ekspose port 3000
EXPOSE 3000

# Jalankan server
CMD ["npm", "run", "dev"]
