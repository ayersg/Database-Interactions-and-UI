var express = require('express');
var app = express();
var handlebars = require('express-handlebars').create({defaultLayout: 'main'});
app.engine('handlebars', handlebars.engine);
app.set('view engine', 'handlebars');

app.set('port', process.env.PORT || 3000);

var mysql = require('mysql');
var pool = mysql.createPool({
  host  : '52.89.202.21',
  user  : 'student',
  password: 'default',
  database: 'student'
});

//From class
app.get('/reset-table',function(req,res,next){
  var context = {};
  console.log('Reset table.');
  pool.query("DROP TABLE IF EXISTS workouts", function(err){
    var createString = "CREATE TABLE workouts("+
    "id INT PRIMARY KEY AUTO_INCREMENT,"+
    "name VARCHAR(255) NOT NULL,"+
    "reps INT,"+
    "weight INT,"+
    "date DATE,"+
    "lbs BOOLEAN)";
    pool.query(createString, function(err){
      context.results = "Table reset";
      //res.render('home',context);
      res.send(context);
    })
  });
});

app.get('/', function(req, res, next){
  var context = {};
  pool.query('SELECT * FROM workouts', function(err, rows, fields){
    if(err){
      next(err);
      return;
    }
    context = JSON.stringify(rows);
    console.log(context);
    console.log("Rows: " + rows.length);
    res.send(context);
    //res.render('home', context);
  });
});

app.get('/insert',function(req,res,next){
  var context = {};
  console.log("Receiving insert request...." + req.query.name + req.query.reps + req.query.weight)
  pool.query("INSERT INTO workouts (`name`, `reps`, `weight`, `date`, `lbs`) VALUES (?,?,?,?,?)", [req.query.name, req.query.reps, req.query.weight, req.query.date, req.query.lbs], function(err, result){
    if(err){
      next(err);
      return;
    }
    //console.log(results);
    context.id = results.insertId;
    console.log(context);
    res.send(JSON.stringify(context));
    //res.render('home',context);
  });
});

app.get('/delete', function(req, res, next){
  var context = {};
  console.log('Receiving delete request....' + req.query.id);
  pool.query('DELETE FROM workouts WHERE id=?', [req.query.id], function(err, result){
    if(err){
      next(err);
      return;
    }
    context.results = "Deleted " + result.insertId + " rows.";
    //res.render('home', context);
    res.send(context);
  });
});

app.get('/safe-update',function(req,res,next){
  var context = {};
  pool.query("SELECT * FROM workouts WHERE id=?", [req.query.id], function(err, result){
    if(err){
      next(err);
      return;
    }
    if(result.length == 1){
      var curVals = result[0];
      pool.query("UPDATE workouts SET name=?, reps=?, weight=?, date=?, lbs=? WHERE id=? ",
        [req.query.name || curVals.name, req.query.reps || curVals.reps, req.query.weight || curVals.weight, req.query.date || curVals.date, req.query.lbs || curVals.lbs, req.query.id],
        function(err, result){
        if(err){
          next(err);
          return;
        }
        context.results = "Updated " + result.changedRows + " rows.";
        res.render('home',context);
      });
    }
  });
});

//Custom 404 page
app.use(function(req, res){
  res.status(404);
  res.render('404');
});

//Custom 500 page
app.use(function(err, req, res, next){
  console.error(err.stack);
  res.status(500);
  res.render('500');
});

app.listen(app.get('port'), function(){
  console.log('Express started on http://localhost:' + app.get('port') + '; press Ctrl-C to terminate.');
})