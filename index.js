///////////////////////////////
//                           //
// set up express.js stuff!! //
//                           //
///////////////////////////////
const express = require('express')
const app = express()
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
const Database = require("@replit/database")
const db = new Database()
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
app.get('/:app/auth/callback', (req, res) => {
	res.render('all/appAuthCall', {
		userid: req.query.id,
		username: req.query.name,
		userroles: req.query.roles,
		app: req.params.app
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
		console.log('[comments]error, undefined user')
	} else {
		fs.ensureFile(`${__dirname}/comment/${req.params.url}.html`)
		post = `<!doctype html><html lang="en"><head>	<link rel="stylesheet" href="https://unpkg.com/tailwindcss@^1.5/dist/base.min.css" /><link rel="stylesheet" href="https://unpkg.com/tailwindcss@^1.5/dist/components.min.css" /><link rel="stylesheet" href="https://unpkg.com/tailwindcss@^1.5/dist/utilities.min.css" /></head><body class="bg-dark"><div class="grid grid-cols-10 gap-4 bg-black"><div class="col-span-2 bg-red-900" style="color:white;">${req.cookies.name}</div><div class="col-span-8"style="color:white;">${req.query.post}</div></div></body></html>`

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
function makeMessageId(){
  return BigInt(new Date().valueOf()).toString(36)+"-"+BigInt(Math.floor(Math.random()*10000000000)).toString(36)
}
async function clearDatabase(){
  return await Promise.all((await db.list("message-")).map(e=>db.delete(e))).then(() => {console.log("deleted sucessfully!")})
} 

async function getScrollbackTo(id){
  console.log("test")
  let list=await db.list("message-")
  list=list.map(e=>[...e.slice("message-".length).split("-").map(e=>parseInt(e, 36)), e.slice("message-".length)]).map(([time, rand, id])=>({time, rand, id}))
  list=list.sort((a,b)=>{
    let result=a.time-b.time;
    if(result==0){ // break the tie
      result=a.rand-b.rand
    }
    return 0 - result // reverse sort order
  })
  let results=[]
  for(let i=0;i<list.length;i++){
    if(list[i].id==id){
      return results
    } else {
      results.push(list[i])
    }
  }
  let objects=await Promise.all(results.map(e=>"message-"+e.id));
  console.log("test")
}
async function sendMessage(username,body){
  let id=makeMessageId();

  await db.set("message-"+id, {
  "body": body,
  "username": username
	})
};

app.get('/chat', (req, res) => {
	res.render('chat/chat', {
		userid: req.cookies.id, // this uses wgytauth v0 if the user isnt logged in redirect to /auth?app=chat
		username: req.cookies.name,
		userroles: req.cookies.roles
	})
})
////////////////////////
//                    //
// forum website code //
//                    //
////////////////////////
app.get('/forum/', (req, res) => {
	if (req.cookies.id === undefined) {
		res.render('forum/forumLoggedOut', {
			userid: req.cookies.id,
			username: req.cookies.name,
			userroles: req.cookies.roles
		})
	} else {
		res.render('forum/forumLoggedIn', {
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
app.listen(3000, () => {
	console.clear();
});