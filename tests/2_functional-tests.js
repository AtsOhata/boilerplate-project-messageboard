const chai = require('chai');
const chaiHttp = require('chai-http');
const assert = chai.assert;
const server = require('../server');

chai.use(chaiHttp);

board = "test001";
createdThreadId = "";
createdThreadDeletePassword = "pass001";
createdReplyId = "";
createdReplyDeletePassword = "passReply001";
suite('Functional Tests', function () {
	test('Test 001: Creating a new thread', function (done) {
		chai
			.request(server)
			.post('/api/threads/' + board)
			.send({
				"text": "test001",
				"delete_password": createdThreadDeletePassword
			})
			.end(function (err, res) {
				assert.equal(res.body.text, 'test001');
				assert.equal(res.body.reported, false);
				assert.equal(res.body.delete_password, 'pass001');
				assert.property(res.body, 'created_on');
				assert.property(res.body, 'bumped_on');
				assert.property(res.body, 'replies');
				createdThreadId = res.body._id;
				done();
			});
	});
	test('Test 002: Creating a new reply', function (done) {
		chai
			.request(server)
			.post('/api/replies/' + board)
			.send({
				thread_id: createdThreadId,
				text: "reply001",
				delete_password: createdReplyDeletePassword,
			})
			.end(function (err, res) {
				assert.equal(res.body.thread_id, createdThreadId);
				assert.equal(res.body.text, 'reply001');
				assert.equal(res.body.reported, false);
				assert.equal(res.body.delete_password, createdReplyDeletePassword);
				assert.property(res.body, 'created_on');
				assert.property(res.body, 'bumped_on');
				createdReplyId = res.body._id;
				done();
			});
	});
	test('Test 003: Viewing a single thread with all replies', function (done) {
		chai
			.request(server)
			.get('/api/replies/' + board + "?thread_id=" + createdThreadId)
			.end(function (err, res) {
				assert.equal(res.body.text, 'test001');
				assert.property(res.body, 'created_on');
				assert.property(res.body, 'bumped_on');
				assert.property(res.body, 'replies');
				done();
			});
	});
	test('Test 004: Reporting a reply', function (done) {
		chai
			.request(server)
			.put('/api/replies/' + board)
			.send({
				thread_id: createdThreadId,
				reply_id: createdReplyId,
			})
			.end(function (err, res) {
				assert.equal(res.text, 'reported');
				done();
			});
	});
	test('Test 005: Deleting a reply with the incorrect password', function (done) {
		chai
			.request(server)
			.delete('/api/replies/' + board)
			.send({
				thread_id: createdThreadId,
				reply_id: createdReplyId,
				delete_password: createdReplyDeletePassword + "0"
			})
			.end(function (err, res) {
				assert.equal(res.text, "incorrect password");
				done();
			});
	});
	test('Test 006: Deleting a reply with the correct password', function (done) {
		chai
			.request(server)
			.delete('/api/replies/' + board)
			.send({
				thread_id: createdThreadId,
				reply_id: createdReplyId,
				delete_password: createdReplyDeletePassword
			})
			.end(function (err, res) {
				assert.equal(res.text, "success");
				done();
			});
	});
	test('Test 007: Viewing the 10 most recent threads with 3 replies each', function (done) {
		chai
			.request(server)
			.get('/api/threads/' + board)
			.end(function (err, res) {
				assert.isArray(res.body);
				assert.isAtLeast(res.body.length, 1);
				assert.property(res.body[0], '_id');
				assert.property(res.body[0], 'text');
				assert.property(res.body[0], 'created_on');
				assert.property(res.body[0], 'bumped_on');
				assert.property(res.body[0], 'replies');
				assert.property(res.body[0], 'replycount');
				done();
			});
	});
	test('Test 008: Reporting a thread', function (done) {
		chai
			.request(server)
			.put('/api/threads/' + board)
			.send({
				thread_id: createdThreadId,
			})
			.end(function (err, res) {
				assert.equal(res.text, "reported");
				done();
			});
	});
	test('Test 009: Deleting a thread with the incorrect password', function (done) {
		chai
			.request(server)
			.delete('/api/threads/' + board)
			.send({
				thread_id: createdThreadId,
				delete_password: createdThreadDeletePassword + "0"
			})
			.end(function (err, res) {
				assert.equal(res.text, "incorrect password");
				done();
			});
	});
	test('Test 010: Deleting a thread with the correct password', function (done) {
		chai
			.request(server)
			.delete('/api/threads/' + board)
			.send({
				thread_id: createdThreadId,
				delete_password: createdThreadDeletePassword
			})
			.end(function (err, res) {
				assert.equal(res.text, "success");
				done();
			});
	});
});
