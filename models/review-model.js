const pool = require("../database/")

const reviewModel = {}

/* ***************************
 *  Get reviews by inventory ID
 * ************************** */
reviewModel.getReviewsByInventoryId = async function (inv_id) {
  try {
    const data = await pool.query(
      `SELECT r.*, a.account_firstname, a.account_lastname 
       FROM public.reviews AS r 
       JOIN public.account AS a ON r.account_id = a.account_id 
       WHERE r.inv_id = $1 
       ORDER BY r.review_date DESC`,
      [inv_id]
    )
    return data.rows
  } catch (error) {
    console.error("getReviewsByInventoryId error: " + error)
    return []
  }
}

/* ***************************
 *  Get average rating by inventory ID
 * ************************** */
reviewModel.getAverageRating = async function (inv_id) {
  try {
    const data = await pool.query(
      `SELECT ROUND(AVG(review_rating), 1) as average_rating,
              COUNT(*) as review_count 
       FROM public.reviews 
       WHERE inv_id = $1`,
      [inv_id]
    )
    return data.rows[0]
  } catch (error) {
    console.error("getAverageRating error: " + error)
    return { average_rating: 0, review_count: 0 }
  }
}

/* ***************************
 *  Check if user has already reviewed a vehicle
 * ************************** */
reviewModel.hasUserReviewed = async function (account_id, inv_id) {
  try {
    const data = await pool.query(
      `SELECT * FROM public.reviews 
       WHERE account_id = $1 AND inv_id = $2`,
      [account_id, inv_id]
    )
    return data.rowCount > 0
  } catch (error) {
    console.error("hasUserReviewed error: " + error)
    return false
  }
}

/* ***************************
 *  Add new review
 * ************************** */
reviewModel.addReview = async function (review_text, review_rating, account_id, inv_id) {
  try {
    const sql = `INSERT INTO public.reviews 
                 (review_text, review_rating, account_id, inv_id) 
                 VALUES ($1, $2, $3, $4) RETURNING *`
    return await pool.query(sql, [review_text, review_rating, account_id, inv_id])
  } catch (error) {
    console.error("addReview error: " + error)
    return error.message
  }
}

/* ***************************
 *  Get review by ID
 * ************************** */
reviewModel.getReviewById = async function (review_id) {
  try {
    const data = await pool.query(
      `SELECT r.*, a.account_firstname, a.account_lastname, i.inv_make, i.inv_model 
       FROM public.reviews AS r 
       JOIN public.account AS a ON r.account_id = a.account_id 
       JOIN public.inventory AS i ON r.inv_id = i.inv_id 
       WHERE r.review_id = $1`,
      [review_id]
    )
    return data.rows[0]
  } catch (error) {
    console.error("getReviewById error: " + error)
    return null
  }
}

/* ***************************
 *  Update review
 * ************************** */
reviewModel.updateReview = async function (review_id, review_text, review_rating) {
  try {
    const sql = `UPDATE public.reviews 
                 SET review_text = $1, review_rating = $2 
                 WHERE review_id = $3 RETURNING *`
    return await pool.query(sql, [review_text, review_rating, review_id])
  } catch (error) {
    console.error("updateReview error: " + error)
    return error.message
  }
}

/* ***************************
 *  Delete review
 * ************************** */
reviewModel.deleteReview = async function (review_id) {
  try {
    const sql = 'DELETE FROM public.reviews WHERE review_id = $1'
    return await pool.query(sql, [review_id])
  } catch (error) {
    console.error("deleteReview error: " + error)
    return error.message
  }
}

module.exports = reviewModel