var express = require("express");
var router = express.Router();
const productHelpers=require('../helpers/product-helpers')
const userHelpers=require('../helpers/user-helpers')


/* GET home page. */
router.get("/", function (req, res, next) {
  productHelpers.getAllProducts().then((products)=>{
    res.render("user/view-products", { products ,admin:false ,title:"Shopping Cart" }); 
  })
});

router.get('/login',(req,res)=>{
  res.render('user/login',{title:"Login"})
})
router.post('/login',(req,res)=>{
  
})
router.get('/signup',(req,res)=>{
  res.render('user/signup',{title:"Signup"})
})
router.post('/signup',(req,res)=>{
  userHelpers.doSignup(req.body).then((response)=>{
    console.log(response);
  })
})

module.exports = router;
