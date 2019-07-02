const express = require('express')
const bodyParser = require('body-parser')
const expressJwt = require('express-jwt')
const jwt = require('jsonwebtoken')
require('express-group-routes');
const multer = require("multer");
const crypto = require('crypto')
const path = require('path')
const app=express()
app.use(express.static('public'));

var storage = multer.diskStorage({

  destination: function (req, file, cb) {
    cb(null, 'public/images/')
  },
  filename: function (req, file, cb) {
    crypto.pseudoRandomBytes(16, function (err, raw) {
      if (err) return cb(err)

      cb(null, raw.toString('hex') + path.extname(file.originalname))
    })
  }

})

const upload = multer({
  storage:storage
});

app.use(bodyParser.json())

const mysql = require('mysql')
const connection = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'db_todos'
})
app.group("/api", (router) => {
    
    router.post('/get_profile',expressJwt({secret:'shhhhhhh'}),(req,res)=>{
      const id_login=req.body.id
        connection.query(`SELECT * FROM bio WHERE id_login=${id_login}`, function (err, rows, fields) {
          if (err) throw err
          res.send(rows)
        })
    })

    router.post('/get_images',expressJwt({secret:'shhhhhhh'}),(req,res)=>{
        profile_id = req.body.profile_id
        connection.query(`SELECT images.id, images.caption, images.images,bio.profile_image FROM images INNER JOIN bio ON images.id_profile=bio.id_login WHERE images.id_profile=${profile_id} AND bio.id_login=${profile_id} ORDER BY images.id DESC`, function (err, rows, fields) {
          if (err) throw err
          res.send(rows)
        })
    })

    router.post('/login',(req,res)=>{
        const username = req.body.username
        const password = req.body.password
    
        connection.query(`SELECT * from login WHERE username="${username}" AND password="${password}"`, function (err, rows, fields) {
            if (err) throw err
            if(rows.length > 0){
              const id = rows[0].id
                const token = jwt.sign({username:username},'shhhhhhh')
                res.send({id,"status":"success",username,token})
            }else{
                res.send({"status":"failed"})
            }
            
          })
    })

    router.post("/upload",expressJwt({secret:'shhhhhhh'}),upload.single("file"),(req, res) => {
      const caption = req.body.caption
      const filename = req.file.filename
      const id_profile = req.body.id_profile
      if (!req.file) return res.send('Please upload a file')
      connection.query(`INSERT INTO images (images,caption,id_profile) VALUES ("${filename}","${caption}","${id_profile}")`, function (err, rows, fields) {
        if (err) throw err
        res.send("success")
      })
    });
    
    router.patch("/editbio",expressJwt({secret:'shhhhhhh'}),upload.single("file"),(req, res) => {
      const name = req.body.name
      const website = req.body.website
      const bio = req.body.bio
      const email = req.body.email
      const phone = req.body.phone
      const gender = req.body.gender
      const id_login = req.body.id_login
      const profile_image = req.file.filename
      if (!req.file) return res.send('Please upload a file')
      connection.query(`UPDATE bio SET name="${name}",website="${website}",bio="${bio}",email="${email}",phone="${phone}",gender="${gender}",profile_image="${profile_image}" WHERE id_login = ${id_login}`, function (err, rows, fields) {
        if (err) throw err
        res.send("success")
      })
    });

  //   router.patch('/editcaption',expressJwt({secret:'shhhhhhh'}),(req,res)=>{
  //     const id = req.body.id
  //     const caption = req.body.caption

  //     connection.query(`UPDATE images SET caption="${caption}" WHERE id=${id}`, function (err, rows, fields) {
  //       if (err) throw err
  //       res.send(rows)
  //     })
  // })
  
  router.delete('/deleteimages',expressJwt({secret:'shhhhhhh'}),(req,res)=>{
    const id = req.body.id

    connection.query(`DELETE FROM images WHERE id=${id}`, function (err, rows, fields) {
      if (err) throw err
      res.send(rows)
    })
})
  
});



app.listen('5000',()=>console.log("app running"))