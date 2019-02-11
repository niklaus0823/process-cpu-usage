require('./build').ps([process.pid], function (err, res) {
  console.log(res);
});

