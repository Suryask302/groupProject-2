

const express = require('express');
const router = express.Router();

const userController = require('../controller/userController')
const bookController = require('../controller/bookController')
const reviewContoller =require('../controller/reviewController')
const middleware = require('../middleware/auth')


router.post('/register', userController.createUser)

router.post('/login', userController.loginUser)

router.post('/books',middleware.mid, bookController.createBook)

router.get('/books', middleware.mid, bookController.getBook)

router.get('/books/:bookId', middleware.mid, bookController.getBookWithreview)

router.put('/books/:bookId', middleware.mid, bookController.updateBook)

router.delete('/books/:bookId',middleware.mid,bookController.deletedById)

router.post('/books/:bookId/review',reviewContoller.addReview)

router.delete('/books/:bookId/review/:reviewId',reviewContoller.deleteReview)

router.put('/books/:bookId/review/:reviewId',reviewContoller.updateReview)

module.exports = router;