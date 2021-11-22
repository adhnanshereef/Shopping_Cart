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
  if(req.session.userLoggedIn){
    next()
  }else{
    res.redirect('/login')
  }
}

// Login
router.get('/login',(req,res)=>{
  if(req.session.user){
    res.redirect('/')
  }else{
    res.render('user/login',{title:"Login",loginErr:req.session.userLoginErr})
    req.session.userLoginErr=false
  }
})
router.post('/login',(req,res)=>{
  userHelpers.doLogin(req.body).then((response)=>{
    if(response.status){
      req.session.user=response.user
      req.session.userLoggedIn=true
      res.redirect('/')
    }else{
      req.session.userLoginErr="Invalid Username or Password"
      res.redirect('/login')
    }
  })
})
router.get('/logout',(req,res)=>{
  req.session.user=null
  req.session.userLoggedIn=false
  res.redirect('login')
})
// Signup
router.get('/signup',(req,res)=>{
  res.render('user/signup',{title:"Signup"})
})
router.post('/signup',(req,res)=>{
  userHelpers.doSignup(req.body).then(async(response)=>{
    let userDetails=await userHelpers.getSessionUser(response.insertedId)
    req.session.user=userDetails
    req.session.userLoggedIn=true
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
  if(cartCount==0){
    res.send('<head><title>Shopping Cart</title><link rel="icon" href="https://png.pngtree.com/element_our/sm/20180415/sm_5ad31a9302828.jpg" /></head><div style="color:black;width:100%;display:flex;justify-content:center;height:100vh;flex-direction:column;align-items:center;font-family:sans-serif;"><h1>Your Cart is Empty</h1><a href="/" style="text-decoration:none;width:100px;padding:15px;border-radius:15px;background:#0d6efd;color:white;" >Add Products</a></div>');
  }else{
    let carts=await userHelpers.getCartProducts(req.session.user._id)
    let total=await userHelpers.getTotalAmount(req.session.user._id)
    res.render('user/cart',{title:"Cart",user,carts,cartCount,total})
  }
})

router.get('/add-to-cart/:id',verifyLogin,(req,res)=>{
  userHelpers.addToCart(req.params.id,req.session.user._id).then(()=>{
    res.json({status:true})
  })
})
router.post('/change-product-quantity',verifyLogin,(req,res,next)=>{
  userHelpers.changeProductQuantity(req.body).then(async(response)=>{
    response.total=await userHelpers.getTotalAmount(req.body.user)
    res.json(response)
  })
})
router.get('/remove-cart-product/:id',verifyLogin,(req,res)=>{
  userHelpers.removeCartProduct(req.params.id,req.session.user._id).then((response)=>{
    res.redirect('/cart')
  })
})
// Checkout Order
router.get('/place-order',verifyLogin,async(req,res)=>{
  let user=req.session.user
  let cartCount=null
  if(req.session.user){
    cartCount=await userHelpers.getCartCount(req.session.user._id)
  }
  if(cartCount==0){
    res.send('<head><title>Shopping Cart</title><link rel="icon" href="https://png.pngtree.com/element_our/sm/20180415/sm_5ad31a9302828.jpg" /></head><div style="color:black;width:100%;display:flex;justify-content:center;height:100vh;flex-direction:column;align-items:center;font-family:sans-serif;"><h1>Your Cart is Empty</h1><a href="/" style="text-decoration:none;width:100px;padding:15px;border-radius:15px;background:#0d6efd;color:white;" >Add Products</a></div>');
  }else{
    let total=await userHelpers.getTotalAmount(req.session.user._id)
  res.render('user/checkout_order',{title:"Place Order",total,user})
  }
})

router.post('/place-order',verifyLogin,async(req,res)=>{
  let products=await userHelpers.getCartProductList(req.body.userId)
  let total=await userHelpers.getTotalAmount(req.body.userId)
  userHelpers.placeOrder(req.body,products,total).then((orderId)=>{
    if(req.body['paymentMethod']=='cod'){
      res.json({status:true})
    }else{
      userHelpers.generateRazorpay(orderId).then((response)=>{
      })
    }
  })
})

//Orders
router.get('/order-success',verifyLogin,async(req,res)=>{
  let cartCount=null
  if(req.session.user){

    cartCount=await userHelpers.getCartCount(req.session.user._id)
  }
  res.render('user/checkout-success',{title:"Shopping Cart",user:req.session.user,cartCount})
})
router.get('/order',verifyLogin,async(req,res)=>{
  let cartCount=null
  if(req.session.user){
    cartCount=await userHelpers.getCartCount(req.session.user._id)
  }
  let orders=await userHelpers.getAllOrders(req.session.user._id)
  res.render('user/order',{title:"Orders",user:req.session.user,cartCount,orders})
})
router.get('/view-order/:id',verifyLogin,async(req,res)=>{
  let cartCount=null
  if(req.session.user){
    cartCount=await userHelpers.getCartCount(req.session.user._id)
  }
  let products=await userHelpers.getOrderProducts(req.params.id)
  res.render("user/view-order", {user:req.session.user,title:"Ordered Products",cartCount,products});
  console.log(products);
})


module.exports = router;