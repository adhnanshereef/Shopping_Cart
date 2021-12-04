var express = require("express");
const {render}=require('../app')
var router = express.Router();
var productHelpers=require('../helpers/product-helpers')
var adminHelpers=require('../helpers/admin-heplers')

// Login Verification
const verifyLogin=(req,res,next)=>{
  if(req.session.adminLoggedIn){
    next()
  }else{
    res.redirect('/admin/login')
  }
}
//View Products
router.get("/",verifyLogin, function (req, res, next) {

  productHelpers.getAllProducts().then((products)=>{

    res.render("admin/view-products", {
      admin: req.session.admin,
      products,
      title: "Admin Panel",
    });
  })
});
//Login
router.get('/login',(req,res)=>{
  if(req.session.admin){
    res.redirect('/admin')
  }else{
    res.render('admin/login',{title:"Admin Login",admin:true,loginErr:req.session.userLoginErr})
    req.session.adminLoginErr=false
  }
})
router.post('/login',(req,res)=>{
  adminHelpers.doLogin(req.body).then((response)=>{
    if(response.status){
      req.session.admin=response.admin
      req.session.adminLoggedIn=true
      res.redirect('/admin/login')
    }else{
      req.session.adminLoginErr="Invalid Username or Password"
      res.redirect('/admin/login')
    }
  })
})
router.get('/logout',(req,res)=>{
  req.session.admin=null
  req.session.adminLoggedIn=false
  res.redirect('/admin/login')
})
//Add Products
router.get("/add-products",verifyLogin, function (req, res) {
  res.render("admin/add-products",{admin: true,title:"Add Products"});
});
router.post("/add-products", (req, res) => {
  productHelpers.addProduct(req.body,(id)=>{
    let image=req.files.image
    image.mv('./public/product-images/'+id+'.jpg',(err,done)=>{
      if(!err){
        res.render('./admin/add-products', {admin: req.session.admin,title:"Add Product"})
      }else{
      }
    })
  },)
});

// Delete Products
router.get('/delete-product/:id',verifyLogin,(req,res)=>{
  let proId=req.params.id
  productHelpers.deleteProduct(proId).then((response)=>{
    res.redirect('/admin')
  })
})
// Edit Products
router.get('/edit-products/:id',verifyLogin,async (req,res)=>{
  let product=await productHelpers.getProductsDetails(req.params.id)
  res.render('admin/edit-products',{admin: req.session.admin,title:"Edit Products",product})
})
router.post('/edit-product/:id',verifyLogin,(req,res)=>{
  productHelpers.updateProduct(req.params.id,req.body).then(()=>{
    res.redirect('/admin')
    if(req.files){
    if(req.files.image){
      let image=req.files.image
        image.mv('./public/product-images/'+req.params.id+'.jpg')
      }
    }
  })
})
// All Orders
router.get('/all-orders',verifyLogin,async(req,res)=>{
  let orders=await adminHelpers.getAllOrders()
  res.render('admin/all-orders',{admin: req.session.admin,title:"All Orders",orders})
})

router.post('/shipped/:id',verifyLogin,(req,res)=>{
  adminHelpers.postAOrderAsShipped(req.params.id).then(()=>{
   res.json({status:true})
  })
})
router.post('/cancel-shipped/:id',verifyLogin,(req,res)=>{
  adminHelpers.cancelShipped(req.params.id).then(()=>{
   res.json({status:true})
  })
})
//All Users
router.get('/all-users',verifyLogin,async(req,res)=>{
  let users=await adminHelpers.getAllUsers()
  res.render('admin/all-users',{admin: req.session.admin,title:"All Users",users})
})

// Order details

// router.get('/order-details/:id',verifyLogin,(req,res)=>{
//   res.render('admin/order-details',{title:"Shopping Cart | Order details",admin:res.session.admin})
// })

router.get('/order-details/:orderId/:userId',verifyLogin,async(req,res)=>{
  let user=await adminHelpers.getUser(req.params.userId)
  let products=await adminHelpers.getOrderProducts(req.params.orderId)
  res.render('admin/order-details',{admin: req.session.admin,title:"Shopping Cart | Order details",user,products})
})

// Product
router.get('/product/:id',verifyLogin,async(req,res)=>{
  let product=await productHelpers.getProduct(req.params.id)
  res.render('admin/product',{title:product.name,product,admin:req.session.admin})
})


module.exports = router;
