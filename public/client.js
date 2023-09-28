// (async function () {

document.addEventListener('DOMContentLoaded', function () {
  const app = document.querySelector(".app");
  const userList = document.getElementById('user-list');
  const chatBox = document.getElementById('chat-box');

  const socket = io();

  const welcomeMessage = document.getElementById('welcome-message');
  // console.log(welcomeMessage);
  const user_name = welcomeMessage.innerText;
  console.log(user_name, "usernames");
  socket.emit('user_connected', user_name);

  socket.on('connect',async () => {
    console.log('Connected to server');
  // });
  
  // socket.on('user_list', async (users) => {
    // userList.innerHTML = users
    // .map((user) => {
    //   if (user === user_name) {
    //     // return `<li><button class="user-link";">${user}</button></li>`;
    //     console.log(user_name,user);
    //   } 
    //   else if (user){
    //     console.log("old");
    //     return `<li><button class="user-link">${user}</button></li>`;
    //   }
    // })
    // .join("");

    try {
      const response = await fetch('/get_receivers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: user_name }),
      });
      if (response.ok) {
        const receiversList = await response.json();
        // const receiversListElement = document.getElementById('receivers-list');
        const userLinks = document.querySelectorAll('.user-link');
        userLinks.innerHTML = '';

        receiversList.forEach(receiver => {
          const receiverItem = document.createElement('li');
          if (receiver === user_name) {
            // receiverItem.innerHTML=`<button class="user-link">You</button>`
          }
          else {
            receiverItem.innerHTML = `<button class="user-link">${receiver}</button>`
          }
          userList.appendChild(receiverItem);
        });
      } else {
        console.error('Failed to fetch receivers list');
      }
    } catch (error) {
      console.error('Error fetching receivers list:', error);
    }

    const userLinks = document.querySelectorAll('.user-link');
    userLinks.forEach((link) => {
      link.addEventListener('click', async () => {
        const targetUser = link.innerText;
        userLinks.forEach((otherLink) => {
          otherLink.classList.remove('clicked');
        });

        // <img id="receivedImage" style="max-width: 300px;">
        chatBox.innerHTML = `<div><h2 id='users_name'>
        ${targetUser}'s Chat </h2> <h3 id="type"></h3></div>
        <ul id="message-list">
        </ul>
        <div class="typearea">  
          <input type="text" id="message-input" placeholder="Type a message">
          <input type="file" id="img" style=" display:none" name="image" accept="video/*">
          <button onclick="document.getElementById('img').click()" id="camera_btn"><i class="fa fa-camera"></i></button>
          <button style=" display:none" id="send_button">Send</button> 
          <button onclick="document.getElementById('send_button').click()" id="s_btn"><i class="fa fa-paper-plane"></i></button>
        </div>`;


        link.classList.add('clicked');
        const messageList = document.getElementById('message-list');
        const messageInput = document.getElementById('message-input');
        const sendButton = document.getElementById('send_button');

        try {
          const server_response = await fetch('/chat_history', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ sender: user_name, receiver: targetUser }),
          });

          if (server_response.ok) {
            const messageData = await server_response.json();
            messageData.forEach((message) => {
              const messageItem = document.createElement('li');
              if (message.sender === user_name) {
                const messageClass = message.sender === user_name ? 'mychat' : 'yourchat';
                messageItem.className = messageClass;
                messageItem.innerHTML = `<b>You :${message.message} </b> `;
              }
              else {
                messageItem.className = "yourchat"
                messageItem.textContent = `${message.sender}: ${message.message}`;
              }
              messageList.appendChild(messageItem);

            });
            chatBox.scrollTop = chatBox.scrollHeight;
          } else {
            console.error('Failed to fetch chat history');
          }
        } catch (error) {
          console.error('Error fetching chat history:', error);
        }

        
        

        //Image Share
        const imgtag = document.getElementById("img")
        sendButton.addEventListener('click', () => {
          const message = messageInput.value;
          if (message.trim() !== '') {
            socket.emit('send_message', { targetUser, message });
            messageList.innerHTML += `<li class="mychat"><b>You :${message}</b> </li>`;
            messageInput.value = '';
            chatBox.scrollTop = chatBox.scrollHeight;
          }
          const file = imgtag.files[0];
          if (file) {
            const reader = new FileReader();
            var sended_li = document.createElement('li');
            sended_li.classList.add("sended_li_img");
            reader.onload = (event) => {
              const dataURL = event.target.result;
               console.log(dataURL);
               if (dataURL.startsWith('data:image')) {
                var sended_img = document.createElement('img');
                sended_img.style.width = '300px';
                sended_img.style.height = '200px';
                sended_img.src = dataURL;
                sended_img.controls = true;
                sended_li.appendChild(sended_img);
                socket.emit('send_image', ({dataURL,targetUser}));
              }
              else if (dataURL.startsWith('data:video')) {
                var sended_video = document.createElement('video');
                sended_video.style.width = '300px';
                sended_video.style.height = '200px';
                sended_video.src = dataURL;
                sended_video.controls = true;
                sended_li.appendChild(sended_video);
                console.log('Before emitting send_video event');
                socket.emit('_video', ({targetUser,dataURL}))
              }
              messageList.appendChild(sended_li)
              chatBox.scrollTop = chatBox.scrollHeight;
            };
            reader.readAsDataURL(file);
            imgtag.value = '';
            chatBox.scrollTop = chatBox.scrollHeight;
          }
        });
////////////////////////////////
try {
  const server_response = await fetch('/image_history', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sender: user_name, receiver: targetUser }),
  });

  if (server_response.ok) {
    const imageData = await server_response.json();
    imageData.forEach((image) => {
      const messageItem = document.createElement('li');
      if (image.sender === user_name) {
        var sended_li = document.createElement('li');
        sended_li.classList.add("sended_li_img");
        var sended_img = document.createElement('img');
        sended_img.style.width = '300px';
        sended_img.style.height = '200px';
        sended_img.src = image.dataURL;
        sended_li.appendChild(sended_img);
        messageList.appendChild(sended_li);
      }
      else {
        var received_li = document.createElement('li');
          received_li.classList.add("received_li_img");
            console.log("file type is image");
          var received_img = document.createElement('img');
          received_img.style.width = '300px';
          received_img.style.height = '200px';
          received_img.src = image.dataURL;
          received_li.appendChild(received_img);
          messageList.appendChild(received_li)
      }
      // messageList.appendChild(messageItem);
    });
    chatBox.scrollTop = chatBox.scrollHeight;
  } else {
    console.error('Failed to fetch image history');
  }
} catch (error) {
  console.error('Error fetching image history:', error);
}
        /////////////////////
        socket.on('receive_image', (dataURL) => {
          // console.log(dataURL);
          var received_li = document.createElement('li');
          received_li.classList.add("received_li_img");
            console.log("file type is image");
          var received_img = document.createElement('img');
          received_img.style.width = '300px';
          received_img.style.height = '200px';
          received_img.src = dataURL;
          received_li.appendChild(received_img)
          messageList.appendChild(received_li)
          chatBox.scrollTop = chatBox.scrollHeight;
        });

        socket.on('receive_video', (dataURL) => {
          console.log("video from server worked last stage");
          console.log(dataURL);
          var received_li = document.createElement('li')
          received_li.classList.add("received_li_img")
            var received_video = document.createElement('video');
            received_video.style.width = '300px';
            received_video.style.height = '200px';
            received_video.src = dataURL;
            received_video.controls = true;
            received_li.appendChild(received_video);
          messageList.appendChild(received_li);
          chatBox.scrollTop = chatBox.scrollHeight;
        });

        socket.on('receive_message', ({ sender, message }) => {
          if (sender === targetUser) {
            messageList.innerHTML += `<li class="yourchat"><strong>${sender}:</strong> ${message}</li>`;
            chatBox.scrollTop = chatBox.scrollHeight;
          }
        }); 
        
        const typingStatus = document.getElementById('typingStatus');
        let typingTimeout;
        messageInput.addEventListener('keyup', (e) => {
          clearTimeout(typingTimeout);
          socket.emit('typing', targetUser);
          typingTimeout = setTimeout(() => {
            socket.emit('stopped_typing', targetUser);
          }, 3000);
          if (e.key === "Enter") {
            sendButton.click()
          }
        });

        socket.on('user_typing', (sender) => {
          typingStatus.innerHTML = `${sender} is typing...`;
        });

        socket.on('user_stopped_typing', () => {
          typingStatus.innerHTML = '';
        });

      });
    });
  });
});
// })();
