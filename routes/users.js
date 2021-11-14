var express = require("express");
var router = express.Router();
const productHelpers=require('../helpers/product-helpers')
const userHelpers=require('../helpers/user-helpers')


/* GET home page. */
router.get("/",async function (req, res, next) {
  let user=req.session.user
  let cartCount=null
  if(req.session.user){

    cartCount=await userHelpers.getCartCount(req.session.user._id)
  }
  productHelpers.getAllProducts().then((products)=>{
    res.render("user/view-products", { products ,user,title:"Shopping Cart",cartCount }); 
  })
});

// Login Verification
const verifyLogin=(req,res,next)=>{
  if(req.session.loggedIn){
    next()
  }else{
    res.redirect('/login')
  }
}


// Login
router.get('/login',(req,res)=>{
  if(req.session.loggedIn){
    res.redirect('/')
  }else{
    res.render('user/login',{title:"Login",loginErr:req.session.loginErr})
    req.session.loginErr=false
  }
})
router.post('/login',(req,res)=>{
  userHelpers.doLogin(req.body).then((response)=>{
    if(response.status){
      req.session.loggedIn=true
      req.session.user=response.user
      res.redirect('/')
    }else{
      req.session.loginErr="Invalid Username or Password"
      res.redirect('/login')
    }
  })
})
router.get('/logout',(req,res)=>{
  req.session.destroy()
  res.redirect('login')
})
// Signup
router.get('/signup',(req,res)=>{
  res.render('user/signup',{title:"Signup"})
})
router.post('/signup',(req,res)=>{
  userHelpers.doSignup(req.body).then((response)=>{
    req.session.loggedIn=true
    req.session.user=response.user
    res.redirect('/')
  })
})
//Cart
router.get('/cart',verifyLogin,async(req,res)=>{
  let user=req.session.user
  let cartCount=null
  if(req.session.user){
    cartCount=await userHelpers.getCartCount(req.session.user._id)
  }
  let carts=await userHelpers.getCartProducts(req.session.user._id)
  res.render('user/cart',{title:"Cart",user,carts,cartCount})
})

router.get('/add-to-cart/:id',verifyLogin,(req,res)=>{
  userHelpers.addToCart(req.params.id,req.session.user._id).then(()=>{
    res.json({status:true})
  })
})
router.post('/change-product-quantity',(req,res,next)=>{
  console.log(req.body);
  userHelpers.changeProductQuantity(req.body).then(()=>{
    res.redirect('/cart')
    // res.json({status:true})
  })
})

module.exports = router;
