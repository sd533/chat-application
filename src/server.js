const http = require('http')
const express = require('express')
const socketio = require('socket.io')
const { generateMessage, generateLocationMessage } = require('./utils/messages')
const {
  addUser,
  getUser,
  getUsersInRoom,
  removeUser,
} = require('./utils/users')
const app = express()
const httpserver = http.createServer(app)
const io = socketio(httpserver)
const Filter = require('bad-words')
const filter = new Filter()

app.use(express.static('public'))

app.get('/', (req, res) => {
  res.sendFile('index.html')
})

io.on('connection', (socket) => {
  console.log('new connection!')
  socket.on('join', (options, callback) => {
    const { error, user } = addUser({ id: socket.id, ...options })
    if (error) {
      return callback(error)
    }
    socket.join(user.room)
    socket.emit('message', generateMessage('admin', 'welcome'))
    socket.broadcast
      .to(user.room)
      .emit('message', generateMessage(`${user.username} has joined`))
    io.to(user.room).emit('roomdata', {
      room: user.room,
      users: getUsersInRoom(user.room),
    })
    callback()
  })

  socket.on('usermsg', (msg, callback) => {
    const user = getUser(socket.id)
    io.to(user.room).emit(
      'message',
      generateMessage(user.username, filter.clean(msg))
    )
    callback()
  })

  socket.on('userlocation', ({ latitude, longitude }, callback) => {
    const user = getUser(socket.id)
    const loc = `https://google.com/maps?q=${latitude},${longitude}`
    io.to(user.room).emit(
      'locationmsg',
      generateLocationMessage(user.username, loc)
    )
    callback()
  })

  socket.on('disconnect', () => {
    const user = removeUser(socket.id)
    if (user) {
      io.to(user.room).emit(
        'message',
        generateMessage(`${user.username} has left`)
      )
      io.to(user.room).emit('roomdata', {
        room: user.room,
        users: getUsersInRoom(user.room),
      })
    }
  })
})

const port = process.env.PORT || 3000
httpserver.listen(port, () => {
  console.log(`server is running on port:${port}`)
})
