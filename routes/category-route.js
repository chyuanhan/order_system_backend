const express = require('express');
const router = express.Router();
const categoryController = require('../controllers/categoryController');
const auth = require('../middleware/check-auth');

// create new category
router.post('/', categoryController.createCategory);

// get all categories
router.get('/', categoryController.getAllCategories);

// update category
router.put('/:id', auth, categoryController.updateCategory);

// delete category
router.delete('/:id', auth, categoryController.deleteCategory);

module.exports = router; 