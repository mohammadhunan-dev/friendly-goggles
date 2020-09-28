const { app, BrowserWindow, ipcMain } = require("electron");
const path = require("path");
const Realm = require("realm");
const ObjectId = require("bson").ObjectId;

const TaskSchema = {
  name: "Task",
  properties: {
    _id: "objectId",
    _partition: "string?",
    name: "string",
    status: "string",
  },
  primaryKey: "_id",
};

function createWindow() {
  const win = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: true,
    },
  });

  win.loadFile("index.html");
  win.webContents.openDevTools();
}

async function mainRealmStuff() {
  const appId = "tutsbrawl-qfxxj";
  const appConfig = {
    id: appId,
    url: "https://realm.mongodb.com",
    // timeout: 1000,
    // app: {
    //   name: "tutsbrawl",
    //   version: "0",
    // },
  };

  var realmApp = new Realm.App(appConfig);
  let credentials = Realm.Credentials.anonymous();
  let user = await realmApp.logIn(credentials);
  console.log(`main: User ${user.id} logged in`);

  const config = {
    schema: [TaskSchema],
    path: "myrealm.realm",
    sync: {
      user: user,
      partitionValue: `project=${user.id}`,
    },
  };
  const realm = await Realm.open(config);

  const taskList = realm.objects("Task");
  console.log(`Main: Realm contains ${taskList.length} 'Task' objects.`);

  realm.write(() => {
    realm.create("Task", {
      _id: new ObjectId(),
      name: "Go to the store",
      status: "OPEN",
    });
  });

  console.log(`Main: Realm now contains ${taskList.length} 'Task' objects.`);

  ipcMain.on("asynchronous-message", (event, arg) => {
    if (arg === "sync") {
      console.log(
        `Main: Realm now contains ${taskList.length} 'Task' objects.`
      );

      console.log(`Main: Syncing all local changes`);
      realm.syncSession.uploadAllLocalChanges();
    }
  });
}

app.whenReady().then(() => {
  console.log("main: hello from main");
  createWindow();
  mainRealmStuff();
});
