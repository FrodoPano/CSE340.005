const express = require("express")
const router = new express.Router()
const utilities = require("../utilities/")
const reviewController = require("../controllers/reviewController")
const reviewValidate = require('../utilities/review-validation')

// Route to build add review view
router.get("/add/:inv_id", utilities.checkLogin, utilities.handleErrors(reviewController.buildAddReview))

// Route to add new review
router.post("/add", 
  utilities.checkLogin,
  reviewValidate.reviewRules(),
  reviewValidate.checkReviewData,
  utilities.handleErrors(reviewController.addReview))

// Route to build edit review view
router.get("/edit/:review_id", utilities.checkLogin, utilities.handleErrors(reviewController.buildEditReview))

// Route to update review
router.post("/update", 
  utilities.checkLogin,
  reviewValidate.reviewRules(),
  reviewValidate.checkReviewData,
  utilities.handleErrors(reviewController.updateReview))

// Route to delete review
router.get("/delete/:review_id", utilities.checkLogin, utilities.handleErrors(reviewController.deleteReview))

module.exports = router