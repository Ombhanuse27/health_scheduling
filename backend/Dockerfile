FROM node:18

WORKDIR /usr/src/app

COPY package*.json ./
RUN npm install

COPY . .

EXPOSE 5000

# Use nodemon for hot reload
CMD ["npx", "nodemon", "src/index.js"]
