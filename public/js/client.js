const socket = io()

const $messageForm = document.querySelector('#message-form')
const $messageFormInput = document.querySelector('input')
const $messageFormButton = document.querySelector('button')
const $sendLocationButton = document.querySelector('#send-location')
const $messages = document.querySelector('#messages')

const messageTemplate = document.querySelector('#message-template').innerHTML
const locationMessageTemplate = document.querySelector(
  '#location-message-template'
).innerHTML
const sidebarTemplete = document.querySelector('#sidebar-template').innerHTML

const autoScroll = () => {
  const $newMessage = $messages.lastElementChild

  const newMessageStyles = getComputedStyle($newMessage)
  const newMessageMargin = parseInt(newMessageStyles.marginBottom)
  const newMessageHeight = $newMessage.offsetHeight + newMessageMargin

  const visibleHeight = $messages.offsetHeight

  const containerHeight = $messages.scrollHeight

  const scrollOffSet = $messages.scrollTop + visibleHeight

  if (containerHeight - newMessageHeight <= scrollOffSet) {
    $messages.scrollTop = $messages.scrollHeight
  }
}

const { username, room } = Qs.parse(location.search, {
  ignoreQueryPrefix: true,
})

socket.on('message', (message) => {
  console.log(message)
  const html = Mustache.render(messageTemplate, {
    username: message.username,
    message: message.text,
    createdAt: moment(message.createdAt).format('h:mm a'),
  })
  $messages.insertAdjacentHTML('beforeend', html)
  autoScroll()
})

socket.on('locationmsg', (message) => {
  console.log(`LocationURL:${message.url}`)
  const html = Mustache.render(locationMessageTemplate, {
    username: message.username,
    url: message.url,
    createdAt: moment(message.createdAt).format('h:mm a'),
  })
  $messages.insertAdjacentHTML('beforeend', html)
  autoScroll()
})

socket.on('roomdata', ({ room, users }) => {
  const html = Mustache.render(sidebarTemplete, {
    room,
    users,
  })
  document.querySelector('#sidebar').innerHTML = html
})

$messageForm.addEventListener('submit', (e) => {
  e.preventDefault()
  $messageFormButton.setAttribute('disabled', 'disabled')
  const msg = e.target.elements.message.value
  socket.emit('usermsg', msg, (error) => {
    $messageFormButton.removeAttribute('disabled')
    $messageFormInput.value = ''
    $messageFormInput.focus()
    if (error) {
      return console.log(error)
    }
    console.log(`message has been delivered`)
  })
})

$sendLocationButton.addEventListener('click', () => {
  if (!navigator.geolocation) {
    return alert('Geolocation is not supported by your browser')
  }
  $sendLocationButton.setAttribute('disabled', 'disabled')
  navigator.geolocation.getCurrentPosition((position) => {
    socket.emit(
      'userlocation',
      {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      },
      (error) => {
        $sendLocationButton.removeAttribute('disabled')
        if (error) {
          console.log(error)
        }
        console.log(`location has been shared`)
      }
    )
  })
})

socket.emit('join', { username, room }, (error) => {
  if (error) {
    alert(error)
    location.href = '/'
  }
})
