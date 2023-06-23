const express = require("express");
const app = express();
const PORT = 8000;
const http = require("http");
const cors = require("cors");
const server = http.createServer(app);

const ws = require("ws");
const wss = new ws.Server({ noServer: true });

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

const allowedOrigins = [
  "localhost:3000",
  "http://localhost:3000",
  "localhost:8000",
  "http://localhost:8000",
  "localhost:5173",
  "http://localhost:5173",
];

const corsOptions = {
  origin: (origin, callback) => {
    if (allowedOrigins.indexOf(origin) !== -1 || !origin) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
  optionsSuccessStatus: 200,
};
app.use(cors(corsOptions));

const onEstablishConnection = (wss, req, clients, id, clientPairsList) => {
  const onConnect = (ws) => {
    clients.add({ id, ws });

    // console.log(clients);

    ws.on("message", (message) => {
      // console.log(`Message received: ${message}`);

      const senderId = JSON.parse(message).senderId;

      const pair1 = clientPairsList.find((pair) => pair.user1Id === senderId);
      const pair2 = clientPairsList.find((pair) => pair.user2Id === senderId);

      if (pair1) {
        for (const item of clients) {
          if (pair1.user2Id === item.id) {
            item.ws.send(message);
          }
        }
      }
      if (pair2) {
        for (const item of clients) {
          if (pair2.user1Id === item.id) {
            item.ws.send(message);
          }
        }
      }
    });

    ws.on("close", function () {
      // clients.delete(ws);
    });
  };

  wss.handleUpgrade(req, req.socket, Buffer.alloc(0), onConnect);
};

const clients = new Set();
let clientPairsList = [];

app.get("/clients", (req, res) => {
  const clientsList = JSON.stringify(clientPairsList);
  res.status(200).json(clientsList);
});

app.post("/chat", (req, res) => {
  const { user1Id, user2Id, user2Name } = req.body;

  const existingPairIndex = clientPairsList.findIndex(
    (item) => user1Id === item.user1Id
  );
  clientPairsList = [
    ...clientPairsList,
    (clientPairsList[existingPairIndex].user2Id = user2Id),
    (clientPairsList[existingPairIndex].user2Name = user2Name),
  ];
  res.status(200).json({ status: "okok" });
});

app.get("/chat/ws/:id", (req, res) => {
  const id = req.params["id"];
  // const name = req.params['name']

  if (
    !req.headers.upgrade ||
    req.headers.upgrade.toLowerCase() != "websocket"
  ) {
    return res
      .status(400)
      .json({ message: "No header/upgrade or it's not equal to 'websocket'." });
  }

  if (!req.headers.connection.match(/\bupgrade\b/i)) {
    return res
      .status(400)
      .json({ message: "req.headers.connection isn't equal to 'Upgrade'" });
  }

  onEstablishConnection(wss, req, clients, id, clientPairsList);
});

app.post("/createroom", (req, res) => {
  const { user1Id, user1Name } = req.body;
  console.log(user1Id, user1Name);

  if (!user1Id || !user1Name) {
    res.status(400).json({message: 'All fields are required!'})
  }

  clientPairsList.push({
    user1Id: user1Id,
    user1Name: user1Name,
    user2Id: "",
    user2Name: "",
  });
  res.status(200).json({ status: "okokok" });
});

app.get("/deleterooms", (req, res) => {
  clientPairsList = [];
  clients.clear();
  res.status(200).json({ message: "Rooms deleted" });
});

app.all("*", (req, res) => {
  res.status(404).json({ message: "404 Not Found" });
});

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
