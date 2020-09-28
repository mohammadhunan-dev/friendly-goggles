const { ipcRenderer } = require("electron");
const Realm = require("realm");
const ObjectId = require("bson").ObjectId;

console.log("renderer: hello from renderer");

async function rendererRealmStuff() {
  const app = new Realm.App({ id: "tutsbrawl-qfxxj" });

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

  const credentials = Realm.Credentials.anonymous();
  const user = await app.logIn(credentials);
  console.log(`renderer: Logged in with the user id: ${user.id}`);

  const config = {
    path: "myrealm.realm",
    schema: [TaskSchema],
    sync: true,
  };

  const realm = new Realm(config);

  const taskList = realm.objects("Task");
  taskList.addListener(() => {
    console.log("NEW TASK!!!");
  });
  console.log(`Renderer: Realm contains ${taskList.length} 'Task' objects.`);

  const htmlList = document.getElementById("tasks");

  taskList.forEach((task) => {
    console.log("task:", task);
    var listItem = document.createElement("LI");
    var itemText = document.createTextNode(task.name);
    listItem.appendChild(itemText);
    htmlList.appendChild(listItem);
  });

  realm.write(() => {
    realm.create("Task", {
      _id: new ObjectId(),
      name: "Go to the gym",
      status: "OPEN",
    });
  });

  console.log(
    `Renderer: Realm now contains ${taskList.length} 'Task' objects.`
  );
  console.log(`Renderer: Sending a request for sync to main`);
  ipcRenderer.send("asynchronous-message", "sync");

  return realm;
}
const realmAsAPromise = rendererRealmStuff();

function createTask() {
  const inputTxt = document.getElementById("taskname").value;
  realmAsAPromise.then((realm) => {
    realm.write(() => {
      realm.create("Task", {
        _id: new ObjectId(),
        name: inputTxt,
        status: "OPEN",
      });
    });
  });
  console.log(`Renderer: Sending a request for sync to main`);
  ipcRenderer.send("asynchronous-message", "sync");
}
