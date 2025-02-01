FROM node:18

# Install FFmpeg
RUN apt-get update && \
    apt-get install -y ffmpeg && \
    apt-get clean

# Create app directory
WORKDIR /app

# Install app dependencies
COPY package*.json ./
RUN npm install

# Bundle app source
COPY . .

# Create required directories
RUN mkdir -p uploads segments

# Expose port
EXPOSE 3000

# Start command
CMD [ "npm", "start" ]