FROM node:10

RUN apt-get update
RUN apt-get install nano


RUN npm install -g nodemon

# Create app directory
WORKDIR /usr/src/app

# Install app dependencies
# A wildcard is used to ensure both package.json AND package-lock.json are copied
# where available (npm@5+)
COPY package*.json ./

RUN npm install
# If you are building your code for production
# RUN npm install --only=production

# Bundle app source
COPY . .

RUN mkdir /usr/src/app/confenv
RUN touch /usr/src/app/confenv/.env

EXPOSE 3000
CMD [ "npm", "run", "watchenv" ]