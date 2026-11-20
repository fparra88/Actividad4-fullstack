const router = require('express').Router();
const auth = require('../middlewares/auth');
const validateObjectId = require('../middlewares/validateObjectId');
const c = require('../controllers/productController');

router.use(auth); // todas las rutas de productos requieren JWT

router.get('/', c.list);
router.post('/', c.create);
router.get('/:id', validateObjectId, c.getOne);
router.put('/:id', validateObjectId, c.update);
router.delete('/:id', validateObjectId, c.remove);

module.exports = router;
