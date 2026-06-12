const express = require('express');
const router = express.Router();
const accessControlController = require('../controllers/accessControlController');
const { requireRole } = require('../middleware/authMiddleware');

router.get('/me', accessControlController.checkMyAccess);
router.get('/', requireRole('Admin'), accessControlController.listAccess);
router.put('/:role/:feature_key', requireRole('Admin'), accessControlController.updateAccess);

module.exports = router;
