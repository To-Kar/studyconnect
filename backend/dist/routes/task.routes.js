"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const task_controller_1 = require("../controllers/task.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const router = (0, express_1.Router)();
// All task routes require authentication
router.use(auth_middleware_1.authenticate);
router.post('/', task_controller_1.createTask);
router.get('/', task_controller_1.getTasks);
router.get('/my-tasks', task_controller_1.getMyTasks);
router.get('/:id', task_controller_1.getTaskById);
router.put('/:id', task_controller_1.updateTask);
router.delete('/:id', task_controller_1.deleteTask);
exports.default = router;
