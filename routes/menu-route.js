const express = require('express');
const router = express.Router();
const menuController = require('../controllers/menuController');
const upload = require('../config/imageUploadConfig');
const auth = require('../middleware/check-auth');

// get all MenuItems
router.get('/', menuController.getAllMenu);

// add new MenuItem
router.post('/', auth, upload.single('image'), menuController.createMenu);

// get specific MenuItem details
router.get('/:id', menuController.getMenuById);

// update MenuItem information
router.put('/:id', auth, upload.single('image'), menuController.updateMenuById);

// delete MenuItem
router.delete('/:id', auth, menuController.deleteMenuById);

module.exports = router;
