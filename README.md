# RSSchool NodeJS websocket task template

> Static http server and base task packages.
> By default WebSocket client tries to connect to the 8080 port.

## Installation

1. Clone/download repo
2. `npm install`

## Usage

**Development**

`npm run start:dev`

- App served @ `http://localhost:8181` with nodemon

**Production**

`npm run start`

- App served @ `http://localhost:8181` without nodemon

---

**All commands**

| Command             | Description                                          |
| ------------------- | ---------------------------------------------------- |
| `npm run start:dev` | App served @ `http://localhost:8181` with nodemon    |
| `npm run start`     | App served @ `http://localhost:8181` without nodemon |

**Note**: replace `npm` with `yarn` in `package.json` if you use yarn.

# PR

1. Task https://github.com/AlreadyBored/nodejs-assignments/blob/main/assignments/battleship/assignment.md
2. Done/deadline 12.07.2023/18.07.23
3. Score 188/188

При закрытии программы на сокет клиента отправляется сообщение о закрытии соединения, это видно в WS консоли
Если во время игры разорвется соединение то будет техническое поражение.
При регистрации имя должно начинаться с буквы, может состоять только из букв и цифр
Пароль может содержать нижнее подчеркивание буквы и цифры
При игре с ботом стоит задержка ответа бота 2 секунды

# Scoring: Websocket battleship server

## Basic Scope

- Websocket
  - **+6** Implemented workable websocket server
  - **+6** Handle websocket clients connection/disconnection properly
  - **+10** Websocket server message handler implemented properly
  - **+10** Websocket server message sender implemented properly
- User
  - **+5** Create user with password in temprorary database
  - **+5** User validation
- Room
  - **+6** Create game room
  - **+6** Add user to game room
  - **+6** Start game
  - **+6** Finish game
  - **+8** Update room's game state
  - **+4** Update player's turn
  - **+8** Update players winner table
- Ships
  - **+10** Locate ship to the game board
- Game
  - **+8** Attack
  - **+4** Random attack

## Advanced Scope

- **+30** Task implemented on Typescript
- **+20** Codebase is separated (at least 4 modules)
- **+30** Make bot for single play (optionally)
