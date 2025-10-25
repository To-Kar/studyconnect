"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const group_controller_1 = require("../controllers/group.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const router = (0, express_1.Router)();
// All group routes require authentication
router.use(auth_middleware_1.authenticate);
router.post('/', group_controller_1.createGroup);
router.get('/', group_controller_1.getGroups);
router.get('/:id', group_controller_1.getGroupById);
router.put('/:id', group_controller_1.updateGroup);
router.delete('/:id', group_controller_1.deleteGroup);
router.post('/:id/members', group_controller_1.addMember);
router.delete('/:id/members/:userId', group_controller_1.removeMember);
exports.default = router;
