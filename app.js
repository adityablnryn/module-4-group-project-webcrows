

var ejs = require('ejs');
var mongojs = require("mongojs");
var express = require('express');
var app = express();
var bodyparser = require('body-parser');
app.use(bodyparser());
app.set('view engine', 'ejs');
var serv = require('http').Server(app);
var db = mongojs('mongodb://librarian:timepass@ds113628.mlab.com:13628/webcrowsbooks', ['users']);

app.get('/',function(req, res) {
    res.sendFile(__dirname + '/login.html');
});
app.get('/about',function(req, res) {
    res.sendFile(__dirname + '/client/about.html');
});
app.get('/signup',function(req, res) {
    res.sendFile(__dirname + '/client/signup.html');
});
app.get('/gamearea',function(req, res) {
    res.sendFile(__dirname + '/client/gamearea.html');
});
app.get('/spectator',function(req, res) {
    res.sendFile(__dirname + '/client/spectator.html');
});
app.get('/login',function(req, res) {
    res.sendFile(__dirname + '/client/login.html');
});
app.get('/error',function(req, res) {
    res.sendFile(__dirname + '/client/error.html');
});

app.post('/signUpX', function(req, res, next){
  console.log("body!  ",req.body);
  var username = req.body.userName;
  var useremail = req.body.userEmail;
  var userpass = req.body.userPass;

  db.users.find({userName: username}).toArray(function(err, result) {
   if(result.length)
    {
      var foo = {flag: 2};
      res.send(foo);
    }
    else
    {
      db.users.insert({userName: username, userEmail: useremail, userPass: userpass}, function(err, noOfInsertedDocs){
        if (err)
        {
          res.send({flag: 0});
        }
        else
        {
          var foo = {flag: 1};
          res.send(foo);
        }
      });
    }
  });


});

app.post('/loginX', function(req, res, next){
  var userName = req.body.userName;
  var userPass = req.body.userPass;
  console.log("login received ",req.body);
  db.users.find({userName: userName, userPass: userPass}).toArray(function(err, result) {
    if(err)
    {
      var foo = {flag: 0};
      res.send(foo);
    }
    else if(result.length)
    {
      var foo = {flag: 1};
      res.send(foo);
    }
    else
    {
        var foo = {flag: 0};
        res.send(foo);
    }
  });
});



app.post('/move',function(req,res){
  var row = req.body.rows;
  var col = req.body.cols;
  newtable = isValidMove(req.body.state, req.body.player,req.body.rows,req.body.cols);

  if(newtable==false || GAME.turn != req.body.player){
    delete newtable;
    console.log("Invalid move by "+req.body.player+" on turn: "+GAME.turn);
  }
  else{
      console.log("It is a valid move");
      emptyflag=0;
      for(i=0;i<7;i++){
        for(j=0;j<7;j++){
          if(newtable[i][j]==0){
            emptyflag=1;
            break;
          }
        }
        if(emptyflag==1){
          break;
        }
      }
      if(emptyflag==0){
        count1 = 0;
        count2 = 0;
        for(i=0;i<7;i++){
          for(j=0;j<7;j++){
            if(newtable[i][j]==1){
              count1++;
            }
            else{
              count2++;
            }
          }
        }
        if(count1>count2){
          winner = 1;
        }
        else{
          winner=2;
        }
        timestamp = Date.now();
        //
        var today = new Date();
        var dd = today.getDate();
        var mm = today.getMonth()+1; //January is 0!
        var yyyy = today.getFullYear();

        if(dd<10) {
           dd='0'+dd
        }

        if(mm<10) {
           mm='0'+mm
        }

        today = mm+'/'+dd+'/'+yyyy;
        console.log(today);
        //
        postBoard(GAME);
        gameEnd(GAME,winner,count1,count2,today);
      }
      else {
          GAME.board = newtable;
          GAME.turn = (req.body.player == 1) ? 2 : 1;
          console.log(GAME.board);
          postBoard(GAME);
      }
  }
  return res.json(1);
});

app.get('/statistics', function(req, res){
  db.progress.find({}).toArray(function(err, stats_array) {
    console.log(stats_array);
    return res.json(stats_array);
  });

});

app.use('/client',express.static(__dirname + '/client'));

var portX = process.env.PORT || 2001;
serv.listen(portX);

var io = require('socket.io')(serv,{});

var GAME;
var spec = [];
initGame();

io.sockets.on('connection', function(socket){
  socket.on('enter room', function(){
    var game = GAME, player = game.players.length + 1;
    game.players.push(socket);

    socket.emit('accept', {player: player, board: game.board});

    socket.on('disconnect', function(){
      if(GAME.players[0] === socket)
	       initGame();
      else
         console.log();
    });

    if(game.players.length === 2){
      game.turn = 1;
      //initGame();
      postBoard(game);
    }
  });
  socket.on('spec room', function(){
    spec.push(socket);
  });
});

function initGame(){
  GAME = {
    players: [],
    board:   [[0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0], [0,0,0,0,0,0,0,0] ,[0,0,0,1,2,0,0,0], [0,0,0,2,1,0,0,0],[0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0], [0,0,0,0,0,0,0,0] ],
    turn:    0
  }
}

function gameEnd(game, winner,count1,count2,today){
  var winnerToInsert = winner;
  var count1ToInsert = count1;
  var count2ToInsert = count2;
  var tsToInsert = today;
  db.progress.insert({winner: winnerToInsert, count1: count1ToInsert, count2: count2ToInsert, timeStamp: tsToInsert});
  //
  game.players.map(function(player){
    player.emit('game end', {
      winner: winner,
      count1: count1,
      count2: count2,
      timestamp: timestamp
    });
  });
}

function postBoard(game){
  game.players.map(function(player){
    player.emit('board', {board: game.board, turn: game.turn });
  });
  spec.map(function(sp){
    sp.emit('spec', {board: game.board});
  });
}

function createUser(username, password, password_confirmation, callback){
    if (password !== password_confirmation) {
    var err = 'The passwords do not match';
    callback(err);
  } else {
      db.users.find({username: username}, function(err, user){
      if (!(user.length==0)) {
        err = 'The username you entered already exists';
        callback(err);
      } else {
            db.users.insert({username: username, password: password},function(err,user){
            callback(err,user);
        });
      }
    });
  }
}

function authenticateUser(username, password, callback){
  db.users.find({username: username, password: password}, function(err, user){
    if ((user.length==0)||(user.password==0)) {
      err = 'Credentials do not match';
      callback(err);
    } else {
        callback(err, user);
    }
  });
}

function isValidMove(board, tile, xstart, ystart){
  if (board[xstart][ystart]!=0||(!isOnBoard(xstart,ystart))){
    return false;
  }

  board[xstart][ystart] = tile;

  if(tile == 1){
    otherTile = 2;
  }
  else{
    otherTile = 1;
  }

  tilesToFlip = [];

  var dirs = [[0, 1], [1, 1], [1, 0], [1, -1], [0, -1], [-1, -1], [-1, 0], [-1, 1]];

  for(i=0;i<dirs.length;i++){
    xdir=dirs[i][0];
    ydir=dirs[i][1];
    x=xstart;
    y=ystart;
    x=x+xdir;
    y=y+ydir;
    if(isOnBoard(x,y)&&board[x][y]==otherTile){
      x=x+xdir;
      y=y+ydir;
      if(!isOnBoard(x,y)){
        continue;
      }
      while(board[x][y]==otherTile){
        x=x+xdir;
        y=y+ydir;
        if(!isOnBoard(x,y)){
          break;
        }
      }
      if(!isOnBoard(x,y)){
        continue;
      }
      if(board[x][y]==tile){
        while(true){
          x=x-xdir;
          y=y-ydir;
          if((x==xstart)&&(y==ystart)){
            break;
          }
          tilesToFlip.push([x,y]);
        }
      }
    }
  }

board[xstart][ystart]=0;
if(tilesToFlip.length==0){
  return false;
}

for(i=0;i<tilesToFlip.length;i++){
  xch=tilesToFlip[i][0];
  ych=tilesToFlip[i][1];
  board[xch][ych]=tile;
}
board[xstart][ystart]=tile;
return board;
}

function isOnBoard(x,y){
  return((x>=0)&&(x<=7)&&(y>=0)&&(y<=7))
}
