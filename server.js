const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const app = express();
const server = http.createServer(app);
const io = socketIo(server);
const path = require("path")
const session = require('express-session');
const mongoose = require('mongoose');
const multer = require("multer")
const bodyParser = require('body-parser');
const fs = require("fs")
//Database connection
app.set('view engine', 'ejs');
const messages = require('./model/message');
const connection = require("./config/connection")
const GroupMsg = require("./model/groupmsg")
const groups = require("./model/Groups")
const User = require("./model/userSchema")

const jwt = require("jsonwebtoken")
const config = require("./config/secretkey")
const bcrypt = require("bcrypt");
//
app.use(express.static(path.join(__dirname + "/public")))
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json())

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "User_Images/")
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + file.originalname)
  }
})

const upload = multer({ storage: storage })

const activeUsers = {};
const availableRooms = {};
const connectedUsersInRooms = {};
//
app.use(
  session({
    secret: 'idk',
    resave: false,
    saveUninitialized: true,
  })
);
//Routes
app.get('/', (req, res) => {
  res.redirect('/login');
});

app.get('/register', (req, res) => {
  res.render('register');
});

app.post('/register', upload.single('Profile'), async (req, res) => {
  const { username, email, password, contactnumber, Gender } = req.body;
  const hashedpassword = await bcrypt.hash(password, 12)
  //   const newuser = register.create({
  //     password:hashedpassword,
  //     contactnumber
  // })
  const user = new User({
    username,
    email,
    password: hashedpassword,
    contactnumber,
    Gender,
    Profile: req.file.filename
  });
  await user.save();
  res.redirect('/login');
});



app.get('/login', (req, res) => {
  res.render('login');
});
const createtoken = async (id) => {
  try {
    const token = await jwt.sign({ _id: id }, config.secret)
    return token
  } catch (error) {
    throw error
  }
}
app.post('/login', async (req, res) => {
  const { username, password } = req.body;
  const user = await User.findOne({ username });
  //  if (!user) {
  // console.log("user not found");
  //  res.redirect('/login');
  //  }
  if (user) {
    const passwordmatch = await bcrypt.compare(password, user.password);
    if (passwordmatch) {
      const tokenData = await createtoken(user._id);
      const userResult = {
        _id: user.id,
        name: user.username,
        email: user.email,
        password: user.password,
        contactnumber: user.contactnumber,
        token: tokenData,
      };
      if (userResult) {
        // console.log("Login succesfully ",userResult);
        req.session.user = user;
        res.redirect('/home');
      } else {
        res.redirect('/login');
      }
    } else {
      res.redirect('/login');
      console.log("incorrect password");

    }
  }
  if (!user) {
    res.redirect('/login');
    console.log("user not found");
  }
});

app.get('/home', (req, res) => {
  let user = req.session.user;
  if (user) {
    res.render('index', { username: user.username });
    // console.log(user.username);
  } else {
    res.redirect('/');
  }
});

app.get('/logout', (req, res) => {
  req.session.destroy();
  res.redirect('/');
});

app.get('/GroupChat', (req, res) => {
  const username = req.session.user;
  if (username) {
    res.render('GroupChat', { username: username.username });
  } else {
    res.redirect("/logout")
  }
});

//Socket.io
io.on('connection', (socket) => {
  socket.on('user_connected', (username) => {
    activeUsers[socket.id] = username;
    console.log(username, ": ", socket.id);
    // const user = req.session.user;
    // console.log(activeUsers);
    socket.emit('user_list', Object.values(activeUsers));
    // socket.emit('username', username);
  });

  socket.on('_video', ({dataURL,targetUser}) => {
    console.log("video from server worked");
    const sender = activeUsers[socket.id];
    const receiver = targetUser;
    
    // console.log(sender,receiver,dataURL);
    const fileName = `video-${Date.now()}.mp4`;
    const filePath = __dirname + '/public/videos/' + fileName;
    const data = dataURL.replace(/^data:video\/mp4;base64,/, '');
    const targetSocketId = Object.keys(activeUsers).find(
      (socketId) => activeUsers[socketId] === targetUser
    );
   
    fs.writeFile(filePath, data, 'base64', (err) => {
      if (err) {
        console.error(err);
      } else {
        console.log('video saved:', fileName);
        if (targetSocketId) {
          console.log("id for video found");
          socket.to(targetSocketId).emit('receive_video', '/videos/' + fileName);
        }
      }
    });
  });


socket.on('send_image', ({dataURL,targetUser}) => {
  console.log("image worked");
  const sender = activeUsers[socket.id];
  const receiver = targetUser;
  // console.log(sender,receiver,dataURL);
  const fileName = `image-${Date.now()}.png`;
  const filePath = __dirname + '/public/images/' + fileName;
  const data = dataURL.replace(/^data:image\/png;base64,/, '');
  const targetSocketId = Object.keys(activeUsers).find(
    (socketId) => activeUsers[socketId] === targetUser
  );
  fs.writeFile(filePath, data, 'base64', (err) => {
    if (err) {
      console.error(err);
    } else {
      console.log('Image saved:', fileName);
      if (targetSocketId) {
        // console.log(targetSocketId);
        // socket.emit('image', '/images/' + fileName);
        socket.to(targetSocketId).emit('receive_image', '/images/' + fileName);
      }
    }
  });
});

// socket.on('error', (error) => {
//   console.error('Socket error:', error);
// });

socket.on('send_message', async ({ targetUser, message }) => {
    const sender = activeUsers[socket.id];
    const receiver = targetUser;
    // console.log(sender);
    // console.log(receiver);
    // console.log(message);
    const newMessage = new messages({ sender, receiver, message });
    await newMessage.save();
    const targetSocketId = Object.keys(activeUsers).find(
      (socketId) => activeUsers[socketId] === targetUser
    );
    console.log(targetSocketId);
    //     console.log(socket.id,"sender");
    // console.log(targetSocketId,"receiversid");
    if (targetSocketId) {
      socket.to(targetSocketId).emit('receive_message',{
        sender,
        message,
      });
    }
  });

  socket.on('typing', (targetUser) => {
    const targetSocketId = Object.keys(activeUsers).find(
      (socketId) => activeUsers[socketId] === targetUser
    );

    if (targetSocketId) {
      socket.to(targetSocketId).emit('user_typing', activeUsers[socket.id]);
    }
  });
  
  socket.on('stopped_typing', (targetUser) => {
    const targetSocketId = Object.keys(activeUsers).find(
      (socketId) => activeUsers[socketId] === targetUser
    );
    if (targetSocketId) {
      socket.to(targetSocketId).emit('user_stopped_typing', activeUsers[socket.id]);
    }
  });

  //one-one chat history
  app.post('/chat_history', async (req, res) => {
    const { sender, receiver } = req.body;
    // console.log(sender,receiver);

    if (!sender || !receiver) {
      return res.status(400).json({ error: 'Invalid sender or receiver' });
    }
    try {
      const chat_history = await messages.find({
        $or: [
          { sender: sender, receiver: receiver },
          { sender: receiver, receiver: sender },
        ],
      }).sort({ createdAt: 1 });
      // console.log(chat_history)
      res.json(chat_history);
    } catch (error) {
      console.error('Error fetching chat history:', error);
      res.status(500).json({ error: 'Error fetching chat history' });
    }
  });

                                             //group communication//
  //create group
  socket.on('Create_room', async (roomname, admin) => {
    availableRooms[roomname] = [socket.id];
    const groupname = new groups({ roomname, admin });
    await groupname.save();
    // console.log(availableRooms[roomname] = [socket.id]);
    io.emit('creating_group', roomname);
  });
  socket.emit('room_list', Object.keys(availableRooms));

  //join group
  socket.on('join_room', (roomname, sender) => {
    // if (availableRooms[roomname]) {
    //   availableRooms[roomname].push(socket.id);
      socket.join(roomname); // Join the room
      console.log(`${sender} joined ${roomname}`);

      if (!connectedUsersInRooms[roomname]) {
        connectedUsersInRooms[roomname] = [];
      }
      connectedUsersInRooms[roomname].push(sender);
      io.to(roomname).emit('room_users', connectedUsersInRooms[roomname]);
    // }
  });

  socket.on('Send_message', async ({ targetroom, sender, roommessage }) => {
    // console.log(targetroom,":targetroom");
    // console.log(sender,':sender');
    // console.log(roommessage,":roommessage");
  
    const groupMessage = new GroupMsg({ targetroom, sender, roommessage });
    await groupMessage.save();
    io.to(targetroom).emit('room_message',{ sender, roommessage })
  });


  // Group_chat History
  app.post('/Group_chat_history', async (req, res) => {
    const { sender, targetroom } = req.body;
    // console.log(sender,receiver);
    // if (!sender || !targetroom) {
    //   return res.status(400).json({ error: 'Invalid sender or targetroom' });
    // }

    try {
      const group_chat_history = await GroupMsg.find({
        targetroom: targetroom,
        // sender: sender
      }).sort({ createdAt: 1 });

      // console.log(group_chat_history)
      res.json(group_chat_history);
    } catch (error) {
      console.error('Error fetching group chat history:', error);
      res.status(500).json({ error: 'Error fetching group chat history' });
    }
  });

  socket.on('disconnect', () => {
    delete activeUsers[socket.id];
    socket.emit('user_list', Object.values(activeUsers));
  });


  app.post('/get_receivers', async (req, res) => {
    const { username } = req.body;
    if (!username) {
      return res.status(400).json({ error: 'Invalid username' });
    }

    try {
      const receiversList = await User.distinct('username', {
        // $or: [{ sender: username }],
      });
      res.json(receiversList);
    } catch (error) {
      console.error('Error fetching receivers list:', error);
      res.status(500).json({ error: 'Error fetching receivers list' });
    }
  });

  app.post('/get_groups', async (req, res) => {
    try {
      const groupList = await groups.distinct('roomname', {
        // $or: [{ sender: username }],
      });
      console.log( "Aviilable Rooms",groupList)
      res.json(groupList);
    } catch (error) {
      console.error('Error fetching group list:', error);
      res.status(500).json({ error: 'Error fetching group list' });
    }
  });
});

const PORT = 5000;
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
