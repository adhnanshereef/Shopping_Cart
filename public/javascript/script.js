// Add to Cart
function addToCart(proId){
    $.ajax({
      url:'/add-to-cart/'+proId,
      method:'get',
      success:(response)=>{
          if(response.status){
              let count=$('#cart-count').html()
              count=parseInt(count)+1
              $('#cart-count').html(count)
          }
      }
    })
  }
  // Change Quantity and Total Amount
  function changeQuantity(cartId,proId,count,userId){
    let quantity=parseInt(document.getElementById(proId).innerHTML)
    count=parseInt(count)
  $.ajax({
      url:'/change-product-quantity',
      data:{
          user:userId,
          cart:cartId,
          product:proId,
          count:count,
          quantity:quantity
      },
      method:'post',
      success:(response)=>{
          if(response.removeProduct){
              alert("Product Removed from Cart")
              location.reload()
          }else{
              document.getElementById(proId).innerHTML=quantity+count
              document.getElementById('total').innerHTML=response.total
          }
      }
  })
}
//Checkout product
$("#checkout").submit((e)=>{
    e.preventDefault()
    $.ajax({
        url:'/place-order',
        method:'post',
        data:$('#checkout').serialize(),
        success:(response)=>{
            if(response.codSuccess){
                location.href='/order-success'
            }else{
                razorpayPayment(response)
            }
        }
    })
})

function razorpayPayment(order){
    var options = {
        "key": "rzp_test_jeSJDyjQXSi8Bg", // Enter the Key ID generated from the Dashboard
        "amount": order.amount, // Amount is in currency subunits. Default currency is INR. Hence, 50000 refers to 50000 paise
        "currency": "INR",
        "name": "Shopping Cart",
        "description": "Test Transaction",
        "image": "",
        "order_id": order.id, //This is a sample Order ID. Pass the `id` obtained in the response of Step 1
        "handler": function (response){
            verifyPayment(response,order)
        },
        "prefill": {
            "name": "Hello World",
            "email": "hello@world.com",
            "contact": "9999999999"
        },
        "notes": {
            "address": "Razorpay Corporate Office"
        },
        "theme": {
            "color": "#001F52"
        }
    };
    var rzp1 = new Razorpay(options);
    rzp1.open();
}

function verifyPayment(payment,order){
    $.ajax({
        url:'/verify-payment',
        data:{payment,order},
        method:'post',
        success:(response)=>{
            if(response.status){
                location.href='/order-success'
            }else{
                alert("Payment Failed")
            }
        }
    })
}

//Make a order as Shipped
function shipped(orderId){
    $.ajax({
        url:'/admin/shipped/'+orderId,
        method:'post',
        success:(response)=>{
            if(response.status){
                location.reload()
            }
        }
    })
}
function cancelShipped(orderId){
    $.ajax({
        url:'/admin/cancel-shipped/'+orderId,
        method:'post',
        success:(response)=>{
            if(response.status){
                location.reload()
            }
        }
    })
}
function refunded(orderId){
    $.ajax({
        url:'/admin/refunded/'+orderId,
        method:'get',
        success:(response)=>{
            if(response.status){
                location.reload()
            }
        }
    })
}
$("#checkout-buy-now").submit((e)=>{
    e.preventDefault()
    $.ajax({
        url:'/buy-now',
        method:'post',
        data:$('#checkout-buy-now').serialize(),
        success:(response)=>{
            if(response.status){
                location.href='/order-success'
            }
        }
    })
})
$("#delete-account").submit((e)=>{
    e.preventDefault()
    $.ajax({
        url:'/delete-account',
        method:'post',
        data:$('#delete-account').serialize(),
        success:(response)=>{
            if(response.status==true){
                alert('Your account is successfully deleted')
                location.href='/'
            }else{
                alert('Entered password is incorrect')
                location.reload()
            }
        }
    })
})

function orderChecking(status,orderId){
    console.log("status hello",status,orderId);
    if(status=="shipped"){
        document.getElementById(orderId+"c").style.display="none"
        document.getElementById(orderId+"r").style.display="none"
        document.getElementById(orderId+"rb").style.display="none"
    }else if(status=="placed"){
        document.getElementById(orderId+"y").style.display="none"
        document.getElementById(orderId+"r").style.display="none"
        document.getElementById(orderId+"rb").style.display="none"
    }else if(status=="cancelled"){
        document.getElementById(orderId+"y").style.display="none"
        document.getElementById(orderId+"c").style.display="none"
    }else if(status=="refunded"){
        document.getElementById(orderId+"y").style.display="none"
        document.getElementById(orderId+"c").style.display="none"
        document.getElementById(orderId+"r").style.display="none"
    }
}

function cancelOrder(orderId,method){
    $.ajax({
        url:'/cancel-order/'+orderId+'/'+method,
        methode:'get',
        success:(response)=>{
            if(response.status){
                location.reload()
            }
        }
    })
}

function delivered(orderId){
    $.ajax({
        url:'/delivering/'+orderId,
        methode:'get',
        success:(response)=>{
            if(response.status){
                location.href='/deliveries'
            }
        }
    })
}

function gotRefund(orderId){
    $.ajax({
        url:'/got-refund/'+orderId,
        methode:'get',
        success:(response)=>{
            if(response.status){
                location.href='/'
            }
        }
    })
}
