//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const date = require(__dirname + "/date.js");
const mongoose = require("mongoose");
const { name } = require("ejs");
const _ = require("lodash");

const app = express();

app.set("view engine", "ejs");

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

// Upgrade to DB, get rid of arrays
// const items = ["Buy Food", "Cook Food", "Eat Food"];
// const workItems = [];

mongoose.connect(
  "mongodb+srv://admin-jay:test123@cluster0.mhhfphq.mongodb.net/todolistDB",
  {
    useNewUrlParser: true,
  }
);

const itemSchema = {
  name: {
    type: String,
    required: true,
  },
};

const Item = mongoose.model("Item", itemSchema);

const item1 = new Item({ name: "Put things on todo list!" });
const item2 = new Item({ name: "Do the things!" });
const item3 = new Item({ name: "Drink tea!" });
const defaultItems = [item1, item2, item3];

const listSchema = {
  name: {
    type: String,
    required: true,
  },
  items: {
    type: [itemSchema],
    required: true,
  },
};

const List = mongoose.model("List", listSchema);

app.get("/", async function (req, res) {
  //const day = date.getDate();

  let items = await Item.find().exec();

  if (items.length === 0) {
    await Item.insertMany(defaultItems);
    res.redirect("/");
  } else {
    res.render("list", { listTitle: "Today", newListItems: items });
  }
});

app.post("/", async function (req, res) {
  const itemName = req.body.newItem;
  const listName = req.body.list;

  const newItem = new Item({ name: itemName });

  if (listName === "Today") {
    await newItem.save(); // can use save to add an item to an existing collection
    res.redirect("/");
  } else {
    let listToUpdate = await List.findOne({ name: listName });
    await listToUpdate.items.push(newItem);
    await listToUpdate.save();
    res.redirect("/" + listName);
  }
});

app.post("/delete", async function (req, res) {
  const checkedItemId = req.body.checkBox;
  const listName = req.body.listName;

  if (listName === "Today") {
    await Item.findByIdAndRemove(checkedItemId);
    res.redirect("/");
  } else {
    await List.findOneAndUpdate(
      // which list to find
      { name: listName },
      // what to do to it
      // $pull is from mongo itself, what to pull is an item, needs a criteria - hence 3 {}s
      { $pull: { items: { _id: checkedItemId } } }
    );
    res.redirect("/" + listName);
  }
});

app.get("/:listName", async function (req, res) {
  const listName = _.capitalize(req.params.listName);
  const listToRender = await List.findOne({ name: listName }).exec();
  if (listToRender) {
    // redner the list
    res.render("list.ejs", {
      listTitle: listToRender.name,
      newListItems: listToRender.items,
    });
  } else {
    const list = new List({
      name: listName,
      items: defaultItems,
    });
    await list.save();
    res.redirect("/" + listName);
  }
});

// app.get("/work", function (req, res) {
//   res.render("list", { listTitle: "Work List", newListItems: workItems });
// });

app.get("/about", function (req, res) {
  res.render("about");
});

app.listen(4000, function () {
  console.log("Server started on port 4000");
});

// Notes from Stackoverflow regarding deprecation of callbacks in mongoose
// alternative to async await

// old way (deprecated)

// Model.find(function (err, models) {
//   if (err) {
//     console.log(err);
//   } else {
//     console.log(models);
//   }
// });

// new way

// Model.find()
//   .then(function (models) {
//     console.log(models);
//   })
//   .catch(function (err) {
//     console.log(err);
//   });
