const invModel = require("../models/inventory-model")
const jwt = require("jsonwebtoken") 
require("dotenv").config()
const Util = {}

/* ************************
 * Constructs the nav HTML unordered list
 ************************** */
Util.getNav = async function (req, res, next) {
  let data = await invModel.getClassifications()
  let list = "<ul>"
  list += '<li><a href="/" title="Home page">Home</a></li>'
  data.rows.forEach((row) => {
    list += "<li>"
    list +=
      '<a href="/inv/type/' +
      row.classification_id +
      '" title="See our inventory of ' +
      row.classification_name +
      ' vehicles">' +
      row.classification_name +
      "</a>"
    list += "</li>"
  })
  list += "</ul>"
  return list
}


/* **************************************
* Build the classification view HTML
* ************************************ */
Util.buildClassificationGrid = async function(data){
  let grid
  if(data.length > 0){
    grid = '<ul id="inv-display">'
    data.forEach(vehicle => { 
      grid += '<li>'
      grid +=  '<a href="../../inv/detail/'+ vehicle.inv_id 
      + '" title="View ' + vehicle.inv_make + ' '+ vehicle.inv_model 
      + 'details"><img src="' + vehicle.inv_thumbnail 
      +'" alt="Image of '+ vehicle.inv_make + ' ' + vehicle.inv_model 
      +' on CSE Motors" /></a>'
      grid += '<div class="namePrice">'
      grid += '<hr />'
      grid += '<h2>'
      grid += '<a href="../../inv/detail/' + vehicle.inv_id +'" title="View ' 
      + vehicle.inv_make + ' ' + vehicle.inv_model + ' details">' 
      + vehicle.inv_make + ' ' + vehicle.inv_model + '</a>'
      grid += '</h2>'
      grid += '<span>$' 
      + new Intl.NumberFormat('en-US').format(vehicle.inv_price) + '</span>'
      grid += '</div>'
      grid += '</li>'
    })
    grid += '</ul>'
  } else { 
    grid += '<p class="notice">Sorry, no matching vehicles could be found.</p>'
  }
  return grid
}

/* **************************************
* Build classification select list
* ************************************ */
Util.buildClassificationList = async function (classification_id = null) {
  let data = await invModel.getClassifications()
  let classificationList = '<select name="classification_id" id="classificationList" required>'
  classificationList += "<option value=''>Choose a Classification</option>"
  data.rows.forEach((row) => {
    classificationList += '<option value="' + row.classification_id + '"'
    if (classification_id != null && row.classification_id == classification_id) {
      classificationList += " selected "
    }
    classificationList += ">" + row.classification_name + "</option>"
  })
  classificationList += "</select>"
  return classificationList
}

/* **************************************
* Build the vehicle detail view HTML
* ************************************ */
Util.buildVehicleDetail = async function(vehicle) {
  let detailHTML = `
    <div class="vehicle-detail">
      <div class="vehicle-image">
        <img src="${vehicle.inv_image}" alt="${vehicle.inv_make} ${vehicle.inv_model}">
      </div>
      
      <div class="vehicle-info">
        <h1>${vehicle.inv_make} ${vehicle.inv_model}</h1>
        <p class="price">$${new Intl.NumberFormat('en-US').format(vehicle.inv_price)}</p>
        
        <div class="specs">
          <p><strong>Year:</strong> ${vehicle.inv_year}</p>
          <p><strong>Mileage:</strong> ${new Intl.NumberFormat('en-US').format(vehicle.inv_miles)} miles</p>
          <p><strong>Color:</strong> ${vehicle.inv_color}</p>
        </div>
        
        <div class="description">
          <h2>Description</h2>
          <p>${vehicle.inv_description}</p>
        </div>
      </div>
    </div>
  `
  return detailHTML
}


/* ****************************************
 * Middleware For Handling Errors
 * Wrap other function in this for 
 * General Error Handling
 **************************************** */
Util.handleErrors = fn => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next)


/* ****************************************
 * Middleware to check token validity
 **************************************** */
Util.checkJWTToken = (req, res, next) => {
  if (req.cookies.jwt) {
    jwt.verify(
      req.cookies.jwt,
      process.env.ACCESS_TOKEN_SECRET,
      function (err, accountData) {
        if (err) {
          req.flash("notice", "Please log in")
          res.clearCookie("jwt")
          return res.redirect("/account/login")
        }
        res.locals.accountData = accountData
        res.locals.loggedin = 1
        next()
      })
  } else {
    next()
  }
}

/* ****************************************
 * Check Login
 **************************************** */
Util.checkLogin = (req, res, next) => {
  if (res.locals.loggedin) {
    next()
  } else {
    req.flash("notice", "Please log in.")
    return res.redirect("/account/login")
  }
}

/* ****************************************
 * Check Authorization
 **************************************** */
Util.requireAuth = (req, res, next) => {
  if (res.locals.loggedin && (res.locals.accountData.account_type === 'Employee' || res.locals.accountData.account_type === 'Admin')) {
    next()
  } else {
    req.flash("notice", "Access denied. Employee or Admin privileges required.")
    res.redirect("/account/login")
  }
}


// Add this function to utilities/index.js
Util.buildReviewSection = async function(vehicle, accountData = null) {
  const reviewModel = require("../models/review-model")
  const reviews = await reviewModel.getReviewsByInventoryId(vehicle.inv_id)
  const ratingData = await reviewModel.getAverageRating(vehicle.inv_id)
  
  let reviewHTML = `
    <div class="reviews-section">
      <h2>Customer Reviews</h2>
      <div class="rating-summary">
        <div class="average-rating">
          <span class="rating-stars">${Util.generateStars(ratingData.average_rating)}</span>
          <span class="rating-number">${ratingData.average_rating}/5</span>
          <span class="review-count">(${ratingData.review_count} reviews)</span>
        </div>
  `
  
  // Add review button if user is logged in and hasn't reviewed
  if (accountData) {
    const hasReviewed = await reviewModel.hasUserReviewed(accountData.account_id, vehicle.inv_id)
    if (!hasReviewed) {
      reviewHTML += `
        <a href="/reviews/add/${vehicle.inv_id}" class="btn-review">Write a Review</a>
      `
    }
  } else {
    reviewHTML += `
      <p><a href="/account/login">Log in</a> to write a review</p>
    `
  }
  
  reviewHTML += `</div>`
  
  if (reviews.length > 0) {
    reviewHTML += `<div class="reviews-list">`
    reviews.forEach(review => {
      reviewHTML += `
        <div class="review-item">
          <div class="review-header">
            <span class="reviewer-name">${review.account_firstname} ${review.account_lastname}</span>
            <span class="review-date">${new Date(review.review_date).toLocaleDateString()}</span>
            <span class="review-rating">${Util.generateStars(review.review_rating)}</span>
          </div>
          <div class="review-text">${review.review_text}</div>
          ${accountData && (accountData.account_id === review.account_id || accountData.account_type === 'Admin') ? `
            <div class="review-actions">
              <a href="/reviews/edit/${review.review_id}">Edit</a> | 
              <a href="/reviews/delete/${review.review_id}" onclick="return confirm('Are you sure you want to delete this review?')">Delete</a>
            </div>
          ` : ''}
        </div>
      `
    })
    reviewHTML += `</div>`
  } else {
    reviewHTML += `
      <div class="no-reviews">
        <p>No reviews yet. Be the first to review this vehicle!</p>
      </div>
    `
  }
  
  reviewHTML += `</div>`
  return reviewHTML
}

// Add helper function for star ratings
Util.generateStars = function(rating) {
  const fullStars = Math.floor(rating)
  const halfStar = rating % 1 >= 0.5
  const emptyStars = 5 - fullStars - (halfStar ? 1 : 0)
  
  let stars = '★'.repeat(fullStars)
  if (halfStar) stars += '½'
  stars += '☆'.repeat(emptyStars)
  
  return stars
}



module.exports = Util