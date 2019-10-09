
// All npm imports
const express = require('express')
var admin = require('firebase-admin')
const firebase = require('firebase')
const app = express()
const bodyParser = require('body-parser')
const exphbs = require('express-handlebars')
const pa = require('path')
const nodemailer = require('nodemailer')
const session  = require ('express-session')


// Firebase initialization
const serviceAccount = require("./serinde-dae45-firebase-adminsdk-z0zyl-40de77fbd0.json")
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: "https://serinde-dae45.firebaseio.com"
  });
const db = admin.firestore();
const sellers = db.collection('Sellers')
const users = db.collection('users')

const firebaseConfig = {
    apiKey: "AIzaSyDFSmXBXK2k_QUsWRu6NJrGhc7AcAEW5ZU",
    authDomain: "serinde-dae45.firebaseapp.com",
    databaseURL: "https://serinde-dae45.firebaseio.com",
    projectId: "serinde-dae45",
    storageBucket: "",
    messagingSenderId: "460955537577",
    appId: "1:460955537577:web:720cc9e7ba3436077319b8"
};
firebase.initializeApp(firebaseConfig);



//All local imports
app.set('view engine', 'handlebars'); 
app.engine('handlebars', exphbs());
app.set('view engine', 'ejs');
app.set('views','./ejsviews');
app.use('/public', express.static(pa.join(__dirname +'/public')));


 app.use(bodyParser.urlencoded({ extended: false }));
 app.use(bodyParser.json());


//----------------------------------
// PORT ROUTE
//----------------------------------
const PORT = process.env.PORT || 3000

app.listen(PORT, () => {
    console.log(`Server is running at port ${PORT}`)
})


//----------------------------------
// LOGIN PAGE GET ROUTE
//----------------------------------
app.get('/login', (req,res)=>{
  res.render("login")
})

//----------------------------------
// CHANGE EMAIL PAGE GET ROUTE
//----------------------------------
app.get('/changeemail', auth, (req,res)=>{
  res.render("changeemail")
})

//----------------------------------
// CHANGE EMAIL POST ROUTE
//----------------------------------
app.post('/changeemail',auth,(req,res)=>{
  const oldEmail = firebase.auth().currentUser.email
  const userEmail = req.body.email
    firebase.auth().currentUser.updateEmail(userEmail)
        .then(result => {
          // update user collection where it is their old email and update the entry
            users.doc(oldEmail).get().then(oldDoc=>{
              if(oldDoc && oldDoc.exists){
                var data = oldDoc.data()
                users.doc(userEmail).set({Email: userEmail, 
                                          FirstName : data.FirstName, 
                                          LastName: data.FirstName, 
                                          Location: data.Location, 
                                          ProfilePicUrl: data.ProfilePicUrl})
                    .then(result=>{
                        users.doc(oldEmail).delete() // deleting old email document
                        users.doc(userEmail).get().then(doc=>{ // getting new information to send to profile
                        data = doc.data()
                        res.render('userprofile', {data})
                      })
                  })// creating another doc with the same data
                
              }
            })
        })
        .catch(error => {
            res.render('errorPage', { message: error.message })
        })
  
})

//----------------------------------
// LOGIN PAGE POST ROUTE
//----------------------------------
app.post('/login', (req, res) => {
  const email = req.body.email
  const password = req.body.password
  firebase.auth().signInWithEmailAndPassword(email, password)
      .then(result => {
          res.redirect('/') // to homepage
      })
      .catch(error => {
          if (email == "") {
              res.render('errorPage', { message: "The email is blank!" })
          }
          else
              res.render('errorPage', { message: error.message })
      })
})


//----------------------------------
// SIGNUP PAGE GET ROUTE
//----------------------------------
app.get('/signup', (req, res) => {
  res.render('signup')
})


//----------------------------------
// SIGNUP PAGE POST ROUTE
//----------------------------------
app.post('/signup', (req, res) => {
  const email = req.body.email
  const password = req.body.password
  const confirmpassword = req.body.confirmpassword
  const first = req.body.first
  const last = req.body.last
  const location = req.body.location
  if (password == confirmpassword) {
      //signup
      firebase.auth().createUserWithEmailAndPassword(email, password)
          .then(result => {
              //creating new document for the new user
              users.doc(email).set({FirstName: first, LastName: last, Location:location, Email: email, ProfilePicUrl:""})
                      .then(result => {
                        //signing in and redirecting to storefront with new account
                        firebase.auth().signInWithEmailAndPassword(email, password)
                        .then(result => {
                            res.redirect('/') // to homepage
                        })
                        .catch(error => {
                            res.render('errorPage', { message: error.message })
                        })
                   })
                  .catch(error => {
                    res.render('errorpage', {message : error.message})
                   })  
          })
          .catch(error => {
              res.render('errorPage', { message: error.message })
          }) 
  }
  else {
      res.render('errorPage', { message: "The passwords do not match." })
  }
})


//----------------------------------
// RESET PASSWORD PAGE GET ROUTE
//----------------------------------
app.get('/resetpassword', (req, res) => {
    res.render('resetpassword')
})


//----------------------------------
// RESET PASSWORD PAGE POST ROUTE
//----------------------------------
app.post('/resetpassword', (req, res) => {
    const email = req.body.email
    const auth = firebase.auth()

    if(email != "") {
        auth.sendPasswordResetEmail(email)
                .then(result => {
                    res.redirect('/login')
                })
    } else {
        res.render('errorPage', { message: "Enter a valid email" })
    }
})


//----------------------------------
// SELLERPAGE GET ROUTE
//----------------------------------
app.get('/sellerprofile', auth,(req, res) => {
  res.render('sellerprofile')
})



//----------------------------------
// USERPAGE GET ROUTE
//----------------------------------
//TODO seller with id for specific seller
app.get('/userprofile', auth, (req, res) => {
    const userEmail = firebase.auth().currentUser.email
    users.doc(userEmail).get().then(doc=>{
      var data = doc.data()
      res.render('userprofile', {data})
    })
})

app.post('/updateuserprofile', auth,(req, res) => {

  const sellerid = "GGoWWB8HPBaTMJw4eGU3";
  const Email = req.body.email;
  const FirstName = req.body.firstName;
  const LastName = req.body.lastName;
  const ProfilePicUrl = ""
  
  sellers.doc(sellerid).set({FirstName, LastName, Email, ProfilePicUrl})
  .then(result => {
    res.redirect('/userprofile')
  })
  .catch(error => {
    res.render('errorpage',{message : error.message})
  })   

})




/*
app.post('/admin/insert', (req, res) => {

  imageUpload(req, res, error => {
      if(error){
          return res.render('admin/errorPage', {message: error})
      }else if(!req.file){
          return res.render('admin/errorPage', {message: 'No file selected'});
      }

      const productTitle = req.body.title;
      const productPrice = req.body.price;
      const productDescription = req.body.description;
      const productImage = req.file.filename;
      
            
      products.doc().set({productTitle, productImage, productPrice, productDescription})
      .then(result => {
          res.redirect('/admin/dashboard-products')
      })
      .catch(error => {
          res.render('errorPage', {
              source: '/admin/insert',
              error
          });
      })
  })
})

*/

//----------------------------------
// HOMEPAGE GET ROUTE
//----------------------------------
app.get('/', (_req,res) => {
  if(firebase.auth().currentUser)
    res.render('storefront',{nav: 'storefront', email: firebase.auth().currentUser.email, login: true});
  else res.render('storefront',{nav: 'storefront', email: '', login: false});
app.get('/contact', (req, res) => {
    res.render('main.handlebars',{nav: 'contact'});
  });

  //==========================================================
  //nodemailer configuration starts..
  //==========================================================
  app.post('/send', (req, res) => {
    const output = `
      <p>You have a new contact request</p>
      <h3>Contact Details</h3>
      <ul>  
        <li>Name: ${req.body.name}</li>
        <li>Company: ${req.body.company}</li>
        <li>Email: ${req.body.email}</li>
        <li>Phone: ${req.body.phone}</li>
      </ul>
      <h3>Message</h3>
      <p>${req.body.message}</p>
    `;
  
    // create reusable transporter object using the default SMTP transport
    let transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      
      //port: 537 ,
      //secure: false, // true for 465, false for other ports
      auth: {
          user: 'sumiayi@gmail.com', // generated ethereal user
          pass: '987654321Ab'  // generated ethereal password
      },
      // tls:{
      //   rejectUnauthorized:false
      // }
    });
  
    // setup email data with unicode symbols
    let mailOptions = {
        from: '"Nodemailer Contact" <sumiayi@gmail.com>', // sender address
        to: 'priankasumia@yahoo.com', // list of receivers
        subject: 'Node Contact Request', // Subject line
        text: 'Hello world?', // plain text body
        html: output // html body
    };
  
    // send mail with defined transport object
    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            return console.log(error);
        }
        console.log('Message sent: %s', info.messageId);   
        console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));
  
        res.render('main.handlebars', {msg:'Email has been sent'});
    });
    });
    //==========================================================
    //NODEMAILER CONFIG. ENDS
    //==========================================================
  })
//==========================================================
//logout 
//==========================================================
app.get('/logout', (req, res) => {
  firebase.auth().signOut()
  .then (result => {
    res.render('storefront',{nav: 'storefront', email: '', login: false});
  })
  .catch(error => {
    res.send(error)
  })
})

//auth functions
function auth(req, res, next) {
  if (firebase.auth().currentUser) {
      next()
  } else {
      res.render('errorPage', { message: "Unauthorized access! Login to access this page." })
  }
}

function adminAuth(req, res, next) {
  if (firebase.auth().currentUser && isAdmin(firebase.auth().currentUser.email)) {
      next()
  } else {
      res.render('errorPage', { message: "Unauthorized access! Privileged users only." })
  }
}

function isAdmin(email) {
  return email == "khoffmeister1@uco.edu" // || email == ""
}