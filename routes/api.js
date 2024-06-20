'use strict';
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
require('dotenv').config();
const app = express();

app.use(cors());
app.use(express.static('public'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

mongoose.connect(process.env.DB, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', () => {
  console.log('Connected to MongoDB');
});

const threadSchema = new mongoose.Schema({
  board: { type: String },
  text: { type: String },
  created_on: { type: Date, default: Date.now() },
  bumped_on: { type: Date, default: Date.now() },
  reported: { type: Boolean },
  delete_password: { type: String },
});

const replySchema = new mongoose.Schema({
  thread_id: { type: String },
  text: { type: String },
  created_on: { type: Date, default: Date.now() },
  bumped_on: { type: Date, default: Date.now() },
  delete_password: { type: String },
  reported: { type: Boolean, default: false },
});

const Thread = mongoose.model('Thread', threadSchema);
const Reply = mongoose.model('Reply', replySchema);

module.exports = function (app) {

  app.route('/api/threads/:board')
    .get(async function (req, res) {
      const board = req.params.board;
      const threads = await Thread.find({ board: board }, { _id: 1, board: 1, text: 1, created_on: 1, bumped_on: 1 })
        .sort({ bumped_on: -1 })
        .limit(10)
        .lean();
      for (let i = 0; i < threads.length; i++) {
        let replies = await Reply.find({ thread_id: threads[i]._id }, { _id: 1, thread_id: 1, text: 1, created_on: 1, bumped_on: 1 });
        threads[i].replies = replies ?? [];
        threads[i].replycount = threads[i].replies.length;
      }
      res.send(threads);
    })
    .post(async function (req, res) {
      const board = req.params.board;
      const text = req.body.text;
      const delete_password = req.body.delete_password;
      const newThread = new Thread({
        board: board,
        text: text,
        reported: false,
        delete_password: delete_password,
      });
      let savedThread = await newThread.save();
      return res.send({
        board: board, text: text, reported: false, delete_password: delete_password, created_on: savedThread.created_on,
        bumped_on: savedThread.bumped_on, replies: [], _id: savedThread._id
      });
    })
    .put(async function (req, res) {
      const board = req.params.board;
      const thread_id = req.body.thread_id;
      let thread = await Thread.findOne({ board: board, _id: thread_id });
      if (thread) {
        thread.reported = true;
        const updatedThread = await thread.save();
        return res.send("reported");
      }
      return res.send("thread not found");
    })
    .delete(async function (req, res) {
      const board = req.params.board;
      const thread_id = req.body.thread_id;
      const delete_password = req.body.delete_password;
      let thread = await Thread.findOne({ board: board, _id: thread_id, delete_password: delete_password });
      if (thread) {
        await thread.remove();
        return res.send("success");
      }
      return res.send("incorrect password");
    });

  app.route('/api/replies/:board')
    .get(async function (req, res) {
      const board = req.params.board;
      const thread_id = req.query.thread_id;
      let thread = await Thread.findById(thread_id).lean();
      const replies = await Reply.find({ thread_id: thread_id }, { _id: 1, thread_id: 1, text: 1, created_on: 1, bumped_on: 1 }).lean();
      return res.send({
        _id: thread._id, text: thread.text, created_on: thread.created_on, bumped_on: thread.bumped_on, replies: replies
      });
    })
    .post(async function (req, res) {
      const board = req.params.board;
      const thread_id = req.body.thread_id;
      const text = req.body.text;
      const delete_password = req.body.delete_password;
      const thread = await Thread.findById(thread_id);
      const newReply = new Reply({
        thread_id: thread_id,
        delete_password: delete_password,
        text: text,
        created_on: thread.created_on,
        bumped_on: thread.bumped_on,
      });
      const savedReply = await newReply.save();
      return res.send(savedReply);
    })
    .put(async function (req, res) {
      const board = req.params.board;
      const thread_id = req.body.thread_id;
      const reply_id = req.body.reply_id;
      let reply = await Reply.findOne({ _id:reply_id, thread_id: thread_id });
      if (reply) {
        reply.reported = true;
        const updatedReply = await reply.save();
        return res.send("reported");
      }
      return res.send("reply not found");
    })
    .delete(async function (req, res) {
      const board = req.params.board;
      const thread_id = req.body.thread_id;
      const reply_id = req.body.reply_id;
      const delete_password = req.body.delete_password;
      let reply = await Reply.findOne({ thread_id: thread_id, _id: reply_id, delete_password: delete_password });
      if (reply) {
        reply.text = "[deleted]";
        const updatedReply = await reply.save();
        return res.send("success");
      }
      return res.send("incorrect password");
    });

};
