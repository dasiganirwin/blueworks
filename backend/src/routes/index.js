const { Router } = require('express');
const router = Router();

router.use('/auth',          require('./auth.routes'));
router.use('/users',         require('./users.routes'));
router.use('/workers',       require('./workers.routes'));
router.use('/jobs',          require('./jobs.routes'));
router.use('/payments',      require('./payments.routes'));
router.use('/notifications', require('./notifications.routes'));
router.use('/disputes',      require('./disputes.routes'));
router.use('/admin',         require('./admin.routes'));
router.use('/push',          require('./push.routes'));

module.exports = router;
