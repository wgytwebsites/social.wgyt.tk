///////////////////////////////
//                           //
// set up express.js stuff!! //
//                           //
///////////////////////////////
const express = require('express')
const app = express()
const http = require('http').Server(app);
const io = require('socket.io')(http);
const mustacheExpress = require('mustache-express')
const cookieParser = require('cookie-parser')
app.use(cookieParser())
app.engine('html', mustacheExpress())
app.set('views', './views')
app.set('view engine', 'html')
app.use(express.json())
app.use('/comment', express.static(`${__dirname}/comment`))
///////////////////////////////
//                           //
// set up database for stuff //
//                           //
///////////////////////////////
const fs = require('fs-extra')
fs.ensureDir(`${__dirname}/comment`)
/////////////////////////
//                     //
// main page of social //
//                     //
/////////////////////////
app.get('/', (req, res) => {
	res.sendFile(`${__dirname}/views/all/index.html`)
})
/////////////////////////
//                     //
// dumbdum legal stuff //
//                     //
/////////////////////////
app.get('/legal', (req, res) => {
	res.sendFile(`${__dirname}/views/all/legal.html`)
})
/////////////////////////
//                     //
// authenticate users! //
//                     //
/////////////////////////
app.get('/auth', (req, res) => {
	res.render('all/auth', {
		app: req.query.app
	})
})
app.get('/auth/callback', (req, res) => {
	res.render('all/authCall', {
		userid: req.query.id,
		username: req.query.name,
		userroles: req.query.roles
	})
})
/////////////////////////
//                     //
// comments embed code //
//                     //
/////////////////////////
app.get('/comments/embed/:url', (req, res) => {
	res.render('comments/commentsembed', {
		userid: req.cookies.id,
		username: req.cookies.name,
		userroles: req.cookies.roles,
		url: req.params.url
	})
})
app.get('/comments/post/:url', (req, res) => {
	res.render('comments/commentspost', {
		userid: req.cookies.id,
		username: req.cookies.name,
		userroles: req.cookies.roles,
		post: req.query.post,
		url: req.params.url
	})
	if (req.cookies.name === undefined) {
		console.log('error')
	} else {
		fs.ensureFile(`${__dirname}/comment/${req.params.url}.html`)
		post = `<!doctype html><html lang="en"><head><style>::-webkit-scrollbar{width:5px}::-webkit-scrollbar-track{box-shadow:0 0 5px #000;border-radius:10px}::-webkit-scrollbar-thumb{background:white;border-radius:10px}::-webkit-scrollbar-thumb:hover{background:black}::-webkit-scrollbar-track-piece{background:#00000000}</style><!-- Required meta tags --><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><!-- Bootstrap CSS --><link href="https://cdn.jsdelivr.net/npm/bootstrap@5.0.0-beta1/dist/css/bootstrap.min.css" rel="stylesheet" integrity="sha384-giJF6kkoqNQ00vy+HMDP7azOuL0xtbfIcaT9wjKHr8RbDVddVHyTfAAsrekwKmP1" crossorigin="anonymous"><title>Hello, world!</title></head><body class="bg-dark"><div class="card bg-secondary"><div class="card-header" style="color:white;">${req.cookies.name}</div><div class="card-body"style="color:white;"><p class="card-text">${req.query.post}</p></div></div> <!-- Option 1: Bootstrap Bundle with Popper --><script src="https://cdn.jsdelivr.net/npm/bootstrap@5.0.0-beta1/dist/js/bootstrap.bundle.min.js" integrity="sha384-ygbV9kiqUc6oa4msXn9868pTtWMgiQaeYH7/t7LECLbyPA2x65Kgf80OJFdroafW" crossorigin="anonymous"></script></body></html>`
		fs.appendFile(`${__dirname}/comment/${req.params.url}.html`, `${post}\r\n`, (err) => {
			if (err) throw err
			console.log('The data to append was appended to file!')
		})
	}
})
app.get('/comments/ensure/:url', (req, res) => {
	fs.ensureFile(`${__dirname}/comment/${req.params.url}.html`)
	res.send('done')
})
///////////////////////
//                   //
// chat website code //
//                   //
///////////////////////
app.get('/chat', (req, res) => {
	res.render('chat/chat', {
		userid: req.cookies.id,
		username: req.cookies.name,
		userroles: req.cookies.roles
	})
})
app.get('/chat.js', (req, res) => {
	res.sendFile(`${__dirname}/views/chat/chat.js`)
})
app.get('/chat.css', (req, res) => {
	res.sendFile(`${__dirname}/views/chat/chat.css`)
})
let numUsers = 0;
io.on('connection', (socket) => {
	let addedUser = false;

	// when the client emits 'new message', this listens and executes
	socket.on('new message', (data) => {
		// we tell the client to execute 'new message'
		socket.broadcast.emit('new message', {
			username: socket.username,
			message: data
		});
	});

	// when the client emits 'add user', this listens and executes
	socket.on('add user', (username) => {
		if (addedUser) return;

		// we store the username in the socket session for this client
		socket.username = username;
		++numUsers;
		addedUser = true;
		socket.emit('login', {
			numUsers: numUsers
		});
		// echo globally (all clients) that a person has connected
		socket.broadcast.emit('user joined', {
			username: socket.username,
			numUsers: numUsers
		});
	});

	// when the client emits 'typing', we broadcast it to others
	socket.on('typing', () => {
		socket.broadcast.emit('typing', {
			username: socket.username
		});
	});

	// when the client emits 'stop typing', we broadcast it to others
	socket.on('stop typing', () => {
		socket.broadcast.emit('stop typing', {
			username: socket.username
		});
	});

	// when the user disconnects.. perform this
	socket.on('disconnect', () => {
		if (addedUser) {
			--numUsers;

			// echo globally that this client has left
			socket.broadcast.emit('user left', {
				username: socket.username,
				numUsers: numUsers
			});
		}
	});
});
app.get('/chat/auth/callback', (req, res) => {
	res.render('chat/chatAuthCall', {
		userid: req.query.id,
		username: req.query.name,
		userroles: req.query.roles
	})
})
////////////////////////
//                    //
// forum website code //
//                    //
////////////////////////
app.get('/forum/', (req, res) => {
	if (req.cookies.id === '') {
		res.render('forum/forumLoggedIn', {
			userid: req.cookies.id,
			username: req.cookies.name,
			userroles: req.cookies.roles
		})
	} else {
		res.render('forum/forumLoggedOut', {
			userid: req.cookies.id,
			username: req.cookies.name,
			userroles: req.cookies.roles
		})
	}
})
/////////////////////////
//                     //
// listen on port 3000 //
//                     //
/////////////////////////
http.listen(3000, () => {
	console.log('listening on port 3000');
});