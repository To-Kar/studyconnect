"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const user_controller_1 = require("../controllers/user.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const router = (0, express_1.Router)();
// All user routes require authentication
router.use(auth_middleware_1.authenticate);
router.get('/', (0, auth_middleware_1.authorize)('ADMIN'), user_controller_1.getUsers);
router.get('/:id', user_controller_1.getUserById);
router.put('/:id', user_controller_1.updateUser);
exports.default = router;
