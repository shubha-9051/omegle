FROM node:24-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm i
COPY . .
ARG VITE_SERVER_URL
ENV VITE_SERVER_URL=$VITE_SERVER_URL
RUN npm run build

FROM caddy:2-alpine
COPY --from=build /app/dist /srv
ARG CADDYFILE=Caddyfile.local
COPY ${CADDYFILE} /etc/caddy/Caddyfile