FROM alpine:latest

RUN apk add --no-cache nodejs npm curl unzip

RUN curl -L https://github.com/XTLS/Xray-core/releases/latest/download/Xray-linux-64.zip -o /tmp/xray.zip && \
    unzip /tmp/xray.zip -d /tmp/xray && \
    mv /tmp/xray/xray /usr/local/bin/xray && \
    chmod +x /usr/local/bin/xray && \
    rm -rf /tmp/xray.zip /tmp/xray

WORKDIR /app
COPY package.json .
RUN npm install
COPY . .

EXPOSE 8080
CMD ["xray", "run", "-c", "config.json"]
