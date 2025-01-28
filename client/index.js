import { io } from "https://cdn.socket.io/4.3.2/socket.io.esm.min.js";

const FORM = document.querySelector("form");
const INPUT = document.querySelector("input");
const MESSAGES = document.getElementById("messages");

let localUser = JSON.parse(localStorage.getItem("user"));

if (!localUser) {
  (async () => {
    const { first_name, last_name, avatar } = await (
      await fetch("https://random-data-api.com/api/users/random_user")
    ).json();

    const USER = { username: `${first_name} ${last_name}`, avatar };

    localStorage.setItem("user", JSON.stringify(USER));

    localUser = USER;
  })();
}

const textToColor = (text) => {
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    hash = text.charCodeAt(i) + ((hash << 5) - hash);
  }

  let color = "#";
  for (let i = 0; i < 3; i++) {
    const VALUE = (hash >> (i * 8)) & 0xff;
    color += ("00" + VALUE.toString(16)).slice(-2);
  }

  return color;
};

const updateMessages = ({ avatar, username, message, created_at }) => {
  const DATE = new Date(created_at).toLocaleTimeString().slice(0, 5);

  const MESSAGE = `
    <li ${
      username === localUser?.username
        ? 'style="background-color: #4a4a4a54"'
        : ""
    }>
    <div>
        <img
        src=${avatar}
        alt="Avatar"
        />
        <small style="color: ${textToColor(username)}">${username}</small>
    </div>
    <p>${message}</p>
    <small style='margin-left: 90%; font-size: 10px'>${DATE}</small>
    </li>`;

  MESSAGES.insertAdjacentHTML("beforeend", MESSAGE);
  MESSAGES.scrollTop = MESSAGES.scrollHeight;
};

const SOCKET = io({ auth: localUser });

SOCKET.on("message", (data) => updateMessages(data));

FORM.addEventListener("submit", async (e) => {
  e.preventDefault();

  if (!!INPUT.value) {
    SOCKET.emit("message", { ...localUser, message: INPUT.value });
    INPUT.value = "";
  }
});
